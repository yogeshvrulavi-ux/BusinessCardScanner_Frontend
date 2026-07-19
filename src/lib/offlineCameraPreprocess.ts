/**
 * OpenCV.js enhancement for offline camera captures only.
 * Returns a temporary JPEG File for OCR — the original capture is kept for storage/preview.
 */

type CvMat = {
  delete: () => void;
  cols: number;
  rows: number;
};

type OpenCvRuntime = {
  imread: (el: HTMLCanvasElement | HTMLImageElement) => CvMat;
  cvtColor: (src: CvMat, dst: CvMat, code: number) => void;
  createCLAHE: (clipLimit?: number, tileGridSize?: unknown) => {
    apply: (src: CvMat, dst: CvMat) => void;
    delete: () => void;
  };
  Size: new (w: number, h: number) => unknown;
  GaussianBlur: (src: CvMat, dst: CvMat, ksize: unknown, sigmaX: number) => void;
  addWeighted: (
    src1: CvMat,
    alpha: number,
    src2: CvMat,
    beta: number,
    gamma: number,
    dst: CvMat,
  ) => void;
  Mat: new () => CvMat;
  imshow: (canvasId: string | HTMLCanvasElement, mat: CvMat) => void;
  COLOR_RGBA2GRAY: number;
  COLOR_GRAY2RGBA: number;
};

let cvPromise: Promise<OpenCvRuntime> | null = null;

async function loadOpenCv(): Promise<OpenCvRuntime> {
  if (cvPromise) return cvPromise;

  cvPromise = (async () => {
    const mod = await import("@techstark/opencv-js");
    const cv = (mod.default ?? mod) as OpenCvRuntime & {
      onRuntimeInitialized?: () => void;
    };

    // opencv-js may expose a ready promise or require waiting for onRuntimeInitialized.
    const ready = (cv as unknown as { ready?: Promise<void> }).ready;
    if (ready && typeof ready.then === "function") {
      await ready;
      return cv;
    }

    if (typeof cv.Mat === "function") {
      try {
        const probe = new cv.Mat();
        probe.delete();
        return cv;
      } catch {
        /* still initializing */
      }
    }

    await new Promise<void>((resolve) => {
      const previous = cv.onRuntimeInitialized;
      cv.onRuntimeInitialized = () => {
        previous?.();
        resolve();
      };
    });
    return cv;
  })().catch((error) => {
    cvPromise = null;
    throw error;
  });

  return cvPromise;
}

function loadFileOntoCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context for preprocessing."));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image for preprocessing."));
    };
    img.src = url;
  });
}

/**
 * Enhance a camera capture for offline PaddleOCR.
 * Pipeline: grayscale → CLAHE contrast → light unsharp mask.
 * Falls back to the original file if OpenCV fails.
 */
export async function enhanceOfflineCameraCapture(file: File): Promise<File> {
  try {
    const cv = await loadOpenCv();
    const canvas = await loadFileOntoCanvas(file);

    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const equalized = new cv.Mat();
    const blurred = new cv.Mat();
    const sharpened = new cv.Mat();
    const rgba = new cv.Mat();
    let clahe: { apply: (src: CvMat, dst: CvMat) => void; delete: () => void } | null = null;

    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      clahe = cv.createCLAHE(2.0, new cv.Size(8, 8));
      clahe.apply(gray, equalized);
      cv.GaussianBlur(equalized, blurred, new cv.Size(0, 0), 1.2);
      // Unsharp mask: sharpened = equalized * 1.5 + blurred * -0.5
      cv.addWeighted(equalized, 1.5, blurred, -0.5, 0, sharpened);
      cv.cvtColor(sharpened, rgba, cv.COLOR_GRAY2RGBA);

      const outCanvas = document.createElement("canvas");
      outCanvas.width = canvas.width;
      outCanvas.height = canvas.height;
      cv.imshow(outCanvas, rgba);

      const blob = await new Promise<Blob | null>((resolve) =>
        outCanvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) return file;

      return new File([blob], file.name.replace(/(\.\w+)?$/, "-enhanced.jpg"), {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    } finally {
      src.delete();
      gray.delete();
      equalized.delete();
      blurred.delete();
      sharpened.delete();
      rgba.delete();
      clahe?.delete();
    }
  } catch (error) {
    console.warn("OpenCV offline camera enhance failed; using original image:", error);
    return file;
  }
}
