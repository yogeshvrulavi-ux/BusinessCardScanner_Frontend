import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Loader2, AlertCircle, X, SwitchCamera, Camera, Check } from "lucide-react";
import { h as cn, B as Button } from "./router-Bh1EUmi_.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "sonner";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@radix-ui/react-tooltip";
import "idb";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-alert-dialog";
import "zod";
function measureFrameSharpness(video, region) {
  if (video.videoWidth === 0 || video.videoHeight === 0) return 0;
  const sampleW = 120;
  const sampleH = 75;
  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  const sx = region.x * video.videoWidth;
  const sy = region.y * video.videoHeight;
  const sw = region.w * video.videoWidth;
  const sh = region.h * video.videoHeight;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sampleW, sampleH);
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
  const gray = new Float32Array(sampleW * sampleH);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const idx = y * sampleW + x;
      const lap = -4 * gray[idx] + gray[idx - 1] + gray[idx + 1] + gray[idx - sampleW] + gray[idx + sampleW];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  if (count === 0) return 0;
  const mean = sum / count;
  return sumSq / count - mean * mean;
}
const CARD_ASPECT = 1.586;
const CARD_FRAME = { x: 0.06, y: 0.34, w: 0.88, h: 0.31 };
const ALIGN_MIN_SHARPNESS = 35;
const AUTO_CAPTURE_SHARPNESS = 95;
const AUTO_CAPTURE_STABLE_READINGS = 8;
const AUTO_CAPTURE_HOLD_MS = 1400;
const AUTO_CAPTURE_WARMUP_MS = 2500;
const CARD_DETECT_MIN_SCORE = 60;
const CARD_MIN_INNER_VARIANCE = 180;
function getCenteredCardCropRegion(video, maxGuideWidthPx = 440) {
  const { videoWidth, videoHeight } = video;
  const displayW = video.clientWidth || videoWidth;
  const displayH = video.clientHeight || videoHeight;
  if (!videoWidth || !videoHeight || !displayW || !displayH) {
    return CARD_FRAME;
  }
  const scale = Math.max(displayW / videoWidth, displayH / videoHeight);
  const renderedW = videoWidth * scale;
  const renderedH = videoHeight * scale;
  const offsetX = (displayW - renderedW) / 2;
  const offsetY = (displayH - renderedH) / 2;
  const guideW = Math.min(displayW * 0.88, maxGuideWidthPx);
  const guideH = guideW / CARD_ASPECT;
  const guideX = (displayW - guideW) / 2;
  const guideY = (displayH - guideH) / 2;
  let sx = (guideX - offsetX) / scale;
  let sy = (guideY - offsetY) / scale;
  let sw = guideW / scale;
  let sh = guideH / scale;
  sx = Math.max(0, sx);
  sy = Math.max(0, sy);
  sw = Math.min(sw, videoWidth - sx);
  sh = Math.min(sh, videoHeight - sy);
  return {
    x: sx / videoWidth,
    y: sy / videoHeight,
    w: sw / videoWidth,
    h: sh / videoHeight
  };
}
function measureCardPresence(video, region) {
  if (video.videoWidth === 0 || video.videoHeight === 0) return 0;
  const sampleW = 96;
  const sampleH = Math.max(48, Math.round(sampleW / CARD_ASPECT));
  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  const sx = region.x * video.videoWidth;
  const sy = region.y * video.videoHeight;
  const sw = region.w * video.videoWidth;
  const sh = region.h * video.videoHeight;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sampleW, sampleH);
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
  const gray = new Float32Array(sampleW * sampleH);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const idx = y * sampleW + x;
      const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
      const gy = Math.abs(gray[idx + sampleW] - gray[idx - sampleW]);
      edgeSum += gx + gy;
      edgeCount++;
    }
  }
  const edgeDensity = edgeCount ? edgeSum / edgeCount : 0;
  const margin = Math.max(2, Math.floor(Math.min(sampleW, sampleH) * 0.12));
  let innerSum = 0;
  let innerCount = 0;
  let outerSum = 0;
  let outerCount = 0;
  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const onBorder = x < margin || y < margin || x >= sampleW - margin || y >= sampleH - margin;
      const v = gray[y * sampleW + x];
      if (onBorder) {
        outerSum += v;
        outerCount++;
      } else {
        innerSum += v;
        innerCount++;
      }
    }
  }
  const innerMean = innerCount ? innerSum / innerCount : 0;
  const outerMean = outerCount ? outerSum / outerCount : 0;
  const contrast = Math.abs(innerMean - outerMean);
  let innerVarSum = 0;
  for (let y = margin; y < sampleH - margin; y++) {
    for (let x = margin; x < sampleW - margin; x++) {
      const v = gray[y * sampleW + x];
      const delta = v - innerMean;
      innerVarSum += delta * delta;
    }
  }
  const innerVariance = innerCount ? innerVarSum / innerCount : 0;
  if (innerMean < 48 || innerVariance < CARD_MIN_INNER_VARIANCE * 0.45) {
    return 0;
  }
  const edgeScore = Math.min(40, edgeDensity / 22 * 40);
  const contrastScore = Math.min(35, contrast / 32 * 35);
  const textureScore = Math.min(25, innerVariance / CARD_MIN_INNER_VARIANCE * 25);
  return Math.round(edgeScore + contrastScore + textureScore);
}
function getAlignmentStatus(sharpness, stableCount, cardScore) {
  if (stableCount >= AUTO_CAPTURE_STABLE_READINGS && cardScore >= CARD_DETECT_MIN_SCORE) {
    return "ready";
  }
  if (stableCount >= Math.max(2, AUTO_CAPTURE_STABLE_READINGS - 1)) return "hold-steady";
  if (sharpness >= ALIGN_MIN_SHARPNESS && cardScore >= CARD_DETECT_MIN_SCORE * 0.65) {
    return "aligning";
  }
  return "searching";
}
function getAlignmentProgress(sharpness, stableCount, cardScore) {
  const sharpPct = Math.min(45, sharpness / AUTO_CAPTURE_SHARPNESS * 45);
  const cardPct = Math.min(35, cardScore / CARD_DETECT_MIN_SCORE * 35);
  const stablePct = Math.min(20, stableCount / AUTO_CAPTURE_STABLE_READINGS * 20);
  return Math.round(sharpPct + cardPct + stablePct);
}
function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}
function pickDefaultFacingMode() {
  return isMobileDevice() ? "environment" : "user";
}
function buildWebcamVideoConstraints(facingMode, tier) {
  if (tier === 0) {
    return isMobileDevice() ? { facingMode: { ideal: facingMode } } : true;
  }
  if (tier === 1) {
    return { facingMode: { ideal: facingMode } };
  }
  return { facingMode: { exact: facingMode } };
}
function initialWebcamConstraintTier() {
  return isMobileDevice() ? 2 : 0;
}
const STATUS_COPY = {
  searching: {
    title: "Position your card",
    hint: "Center the card inside the frame"
  },
  aligning: {
    title: "Card detected",
    hint: "Hold steady and move closer if needed"
  },
  "hold-steady": {
    title: "Almost ready",
    hint: "Keep the card still in the frame"
  },
  ready: {
    title: "Capturing…",
    hint: "Card locked — taking photo"
  }
};
function mapCameraError(err) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera blocked. Click the camera icon in your browser address bar → Allow, then tap Try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera found. Use Choose from folder to upload a card photo.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Camera is busy (Zoom/Teams may be using it). Close other apps and try again.";
  }
  if (name === "OverconstrainedError") {
    return "Camera settings not supported. Tap Try again — we will use a simpler mode.";
  }
  if (typeof err === "string" && err.trim()) return err;
  return "Could not access the camera.";
}
function canvasToJpegFile(canvas, name) {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const byteString = atob(dataUrl.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new File([ab], name, { type: "image/jpeg" });
}
function CameraCapture({ open, onClose, onCapture }) {
  const webcamRef = useRef(null);
  const phaseRef = useRef("live");
  const facingModeRef = useRef(pickDefaultFacingMode());
  const stableCountRef = useRef(0);
  const analysisTimerRef = useRef(null);
  const triggerCaptureRef = useRef(() => {
  });
  const streamReadyAtRef = useRef(0);
  const readyHoldStartedAtRef = useRef(null);
  const autoCaptureLockedRef = useRef(false);
  const [phase, setPhase] = useState("live");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState(pickDefaultFacingMode());
  const [cameraKey, setCameraKey] = useState(0);
  const [constraintTier, setConstraintTier] = useState(initialWebcamConstraintTier);
  const [sharpness, setSharpness] = useState(0);
  const [cardScore, setCardScore] = useState(0);
  const [stableCount, setStableCount] = useState(0);
  const [alignmentStatus, setAlignmentStatus] = useState("searching");
  const [streamReady, setStreamReady] = useState(false);
  phaseRef.current = phase;
  facingModeRef.current = facingMode;
  const getVideo = useCallback(() => webcamRef.current?.video ?? null, []);
  const stopAnalysis = useCallback(() => {
    if (analysisTimerRef.current) {
      window.clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  }, []);
  const resetLiveMetrics = useCallback(() => {
    stableCountRef.current = 0;
    readyHoldStartedAtRef.current = null;
    autoCaptureLockedRef.current = false;
    setStreamReady(false);
    setStableCount(0);
    setSharpness(0);
    setCardScore(0);
    setAlignmentStatus("searching");
  }, []);
  const snapFrame = useCallback(() => {
    const video = getVideo();
    if (!video || video.videoWidth === 0) return null;
    const region = getCenteredCardCropRegion(video);
    const sx = Math.round(region.x * video.videoWidth);
    const sy = Math.round(region.y * video.videoHeight);
    const sw = Math.round(region.w * video.videoWidth);
    const sh = Math.round(region.h * video.videoHeight);
    if (sw <= 0 || sh <= 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvasToJpegFile(canvas, `card-capture-${Date.now()}.jpg`);
  }, [getVideo]);
  const enterPreview = useCallback(
    (file) => {
      stopAnalysis();
      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      phaseRef.current = "preview";
      setPhase("preview");
    },
    [stopAnalysis]
  );
  const triggerCapture = useCallback(() => {
    if (phaseRef.current !== "live" || autoCaptureLockedRef.current) return;
    autoCaptureLockedRef.current = true;
    const file = snapFrame();
    if (file) enterPreview(file);
    else autoCaptureLockedRef.current = false;
  }, [snapFrame, enterPreview]);
  triggerCaptureRef.current = triggerCapture;
  const startAnalysisLoop = useCallback(() => {
    stopAnalysis();
    analysisTimerRef.current = window.setInterval(() => {
      if (phaseRef.current !== "live") return;
      const video = getVideo();
      if (!video) return;
      const region = getCenteredCardCropRegion(video);
      const score = measureFrameSharpness(video, region);
      const presence = measureCardPresence(video, region);
      setSharpness(Math.round(score));
      setCardScore(presence);
      const cardDetected2 = presence >= CARD_DETECT_MIN_SCORE;
      const sharpEnough = score >= AUTO_CAPTURE_SHARPNESS;
      const warmedUp = streamReadyAtRef.current > 0 && Date.now() - streamReadyAtRef.current >= AUTO_CAPTURE_WARMUP_MS;
      if (cardDetected2 && sharpEnough && warmedUp) {
        stableCountRef.current += 1;
        setStableCount(stableCountRef.current);
      } else if (cardDetected2 && score >= ALIGN_MIN_SHARPNESS && warmedUp) {
        stableCountRef.current = Math.max(0, stableCountRef.current - 1);
        setStableCount(stableCountRef.current);
        readyHoldStartedAtRef.current = null;
      } else {
        stableCountRef.current = 0;
        setStableCount(0);
        readyHoldStartedAtRef.current = null;
      }
      const status = getAlignmentStatus(score, stableCountRef.current, presence);
      setAlignmentStatus(status);
      const readyForHold = warmedUp && stableCountRef.current >= AUTO_CAPTURE_STABLE_READINGS && cardDetected2 && sharpEnough;
      if (readyForHold) {
        if (readyHoldStartedAtRef.current === null) {
          readyHoldStartedAtRef.current = Date.now();
          setAlignmentStatus("ready");
        } else if (Date.now() - readyHoldStartedAtRef.current >= AUTO_CAPTURE_HOLD_MS) {
          setAlignmentStatus("ready");
          triggerCaptureRef.current();
        }
      }
    }, 450);
  }, [stopAnalysis, getVideo]);
  const handleUserMedia = useCallback(() => {
    setIsStarting(false);
    setError(null);
    streamReadyAtRef.current = Date.now();
    setStreamReady(true);
    startAnalysisLoop();
  }, [startAnalysisLoop]);
  const handleUserMediaError = useCallback(
    (err) => {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "OverconstrainedError" && constraintTier > 0) {
        setConstraintTier((tier) => tier - 1);
        setIsStarting(true);
        setStreamReady(false);
        setCameraKey((key) => key + 1);
        return;
      }
      if (name === "OverconstrainedError" && constraintTier === 0 && !isMobileDevice()) {
        setConstraintTier(1);
        setIsStarting(true);
        setStreamReady(false);
        setCameraKey((key) => key + 1);
        return;
      }
      setIsStarting(false);
      setStreamReady(false);
      setError(mapCameraError(err));
      stopAnalysis();
    },
    [stopAnalysis, constraintTier]
  );
  const restartCamera = useCallback(() => {
    stopAnalysis();
    resetLiveMetrics();
    setError(null);
    setConstraintTier(initialWebcamConstraintTier());
    setIsStarting(true);
    setCameraKey((key) => key + 1);
  }, [stopAnalysis, resetLiveMetrics]);
  useEffect(() => {
    if (!open) {
      stopAnalysis();
      setPhase("live");
      phaseRef.current = "live";
      setPreviewUrl(null);
      setCapturedFile(null);
      setError(null);
      setConstraintTier(initialWebcamConstraintTier());
      resetLiveMetrics();
      return;
    }
    if (!window.isSecureContext) {
      setError("Camera requires HTTPS or localhost. Open the app via your configured FRONTEND_BASE_URL.");
      setIsStarting(false);
      return;
    }
    if (phaseRef.current === "live") {
      setConstraintTier(initialWebcamConstraintTier());
      setIsStarting(true);
    }
  }, [open, stopAnalysis, resetLiveMetrics]);
  const handleFlipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    facingModeRef.current = next;
    if (open && phaseRef.current === "live") {
      stopAnalysis();
      resetLiveMetrics();
      setConstraintTier(initialWebcamConstraintTier());
      setIsStarting(true);
      setCameraKey((key) => key + 1);
    }
  };
  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedFile(null);
    setPhase("live");
    phaseRef.current = "live";
    restartCamera();
  };
  const handleContinue = () => {
    if (!capturedFile) return;
    onCapture(capturedFile);
    onClose();
  };
  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    stopAnalysis();
    onClose();
  };
  if (!open) return null;
  const statusCopy = STATUS_COPY[alignmentStatus];
  const alignmentProgress = getAlignmentProgress(sharpness, stableCount, cardScore);
  const cardDetected = cardScore >= CARD_DETECT_MIN_SCORE * 0.65;
  const canManualCapture = streamReady && !isStarting && !error;
  const videoConstraints = buildWebcamVideoConstraints(facingMode, constraintTier);
  const cameraLabel = facingMode === "environment" ? "Back camera" : "Front camera";
  const flipCameraLabel = facingMode === "environment" ? "Switch to front camera" : "Switch to back camera";
  const frameBorderClass = alignmentStatus === "ready" ? "border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)]" : alignmentStatus === "hold-steady" ? "border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.35)]" : cardDetected ? "border-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.3)]" : "border-white/80";
  const progressBarClass = alignmentStatus === "ready" || alignmentStatus === "hold-steady" ? "bg-emerald-400" : cardDetected ? "bg-amber-300" : "bg-white/50";
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex flex-col bg-black", role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsx("div", { className: "relative flex-1 overflow-hidden", children: phase === "live" ? /* @__PURE__ */ jsxs(Fragment, { children: [
    !error && /* @__PURE__ */ jsx(
      Webcam,
      {
        ref: webcamRef,
        audio: false,
        mirrored: facingMode === "user",
        screenshotFormat: "image/jpeg",
        screenshotQuality: 0.92,
        forceScreenshotSourceSize: true,
        videoConstraints,
        onUserMedia: handleUserMedia,
        onUserMediaError: handleUserMediaError,
        className: cn("h-full w-full object-cover", (isStarting || error) && "opacity-0")
      },
      `${facingMode}-${constraintTier}-${cameraKey}`
    ),
    isStarting && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-white", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Opening camera…" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-white/60", children: "Please allow camera access if prompted" })
    ] }),
    error && !isStarting && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black px-8 text-center text-white", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20", children: /* @__PURE__ */ jsx(AlertCircle, { className: "h-7 w-7 text-destructive" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-base font-semibold", children: "Camera unavailable" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-white/70", children: error })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex w-full max-w-xs flex-col gap-2", children: [
        /* @__PURE__ */ jsx(Button, { className: "w-full rounded-xl", onClick: restartCamera, children: "Try again" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10", onClick: handleClose, children: "Use folder upload instead" })
      ] })
    ] }),
    !error && !isStarting && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "relative rounded-2xl border-[2.5px] transition-all duration-300",
            frameBorderClass
          ),
          style: {
            width: "min(88vw, 440px)",
            aspectRatio: CARD_ASPECT,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)"
          },
          children: [
            "top-0 left-0 -translate-x-px -translate-y-px border-l-[3px] border-t-[3px] rounded-tl-lg",
            "top-0 right-0 translate-x-px -translate-y-px border-r-[3px] border-t-[3px] rounded-tr-lg",
            "bottom-0 left-0 -translate-x-px translate-y-px border-l-[3px] border-b-[3px] rounded-bl-lg",
            "bottom-0 right-0 translate-x-px translate-y-px border-r-[3px] border-b-[3px] rounded-br-lg"
          ].map((cornerClass) => /* @__PURE__ */ jsx(
            "div",
            {
              className: cn("absolute h-8 w-8 border-inherit", cornerClass),
              style: { borderColor: "inherit" }
            },
            cornerClass
          ))
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 z-10 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/10 bg-black/50 px-3 py-2.5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-9 w-9 shrink-0 rounded-full text-white hover:bg-white/15",
            onClick: handleClose,
            "aria-label": "Close camera",
            children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-semibold text-white", children: statusCopy.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-0.5 truncate text-xs text-white/75", children: statusCopy.hint }),
          isMobileDevice() && streamReady && /* @__PURE__ */ jsx("p", { className: "mt-1 truncate text-[10px] font-medium uppercase tracking-wide text-cyan-300/90", children: cameraLabel }),
          /* @__PURE__ */ jsx("div", { className: "mx-auto mt-2 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-white/20", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: cn("h-full rounded-full transition-all duration-300", progressBarClass),
              style: { width: `${alignmentProgress}%` }
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            className: cn(
              "h-9 shrink-0 rounded-full text-white hover:bg-white/15",
              isMobileDevice() ? "gap-1 px-2.5" : "w-9 px-0"
            ),
            onClick: handleFlipCamera,
            "aria-label": flipCameraLabel,
            title: flipCameraLabel,
            children: [
              /* @__PURE__ */ jsx(SwitchCamera, { className: "h-5 w-5 shrink-0" }),
              isMobileDevice() && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold leading-none", children: facingMode === "environment" ? "Front" : "Back" })
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-5 text-center text-sm font-medium text-white/85", children: "Only the framed area is captured" }),
        /* @__PURE__ */ jsx("p", { className: "mb-5 text-center text-xs text-white/55", children: "Auto-captures when a card is steady in frame · or tap the button below" }),
        isMobileDevice() && /* @__PURE__ */ jsxs("p", { className: "mb-4 text-center text-xs text-cyan-200/80", children: [
          "Wrong camera? Tap ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Back" }),
          " (top-right) for rear camera"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: triggerCapture,
            disabled: !canManualCapture,
            className: cn(
              "relative flex h-[76px] w-[76px] items-center justify-center rounded-full transition-all",
              canManualCapture ? "hover:scale-105 active:scale-95" : "opacity-45 cursor-not-allowed"
            ),
            "aria-label": "Capture manually",
            children: [
              /* @__PURE__ */ jsx("span", { className: "absolute inset-0 rounded-full border-[3px] border-white/90" }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: cn(
                    "flex h-[60px] w-[60px] items-center justify-center rounded-full",
                    canManualCapture ? "bg-white" : "bg-white/40"
                  ),
                  children: /* @__PURE__ */ jsx(Camera, { className: cn("h-7 w-7", canManualCapture ? "text-black" : "text-white/70") })
                }
              )
            ]
          }
        ) })
      ] })
    ] })
  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    previewUrl && /* @__PURE__ */ jsx("img", { src: previewUrl, alt: "Captured card preview", className: "h-full w-full object-contain bg-black" }),
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 pb-6 pt-4", children: [
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "text-white hover:bg-white/20", onClick: handleClose, children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-white", children: "Review capture" }),
      /* @__PURE__ */ jsx("div", { className: "w-10" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 bottom-0 flex gap-3 bg-gradient-to-t from-black/90 to-transparent px-4 pb-8 pt-12", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", className: "flex-1 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20", onClick: handleRetake, children: "Retake" }),
      /* @__PURE__ */ jsxs(Button, { className: "flex-1 rounded-xl bg-gradient-primary shadow-glow", onClick: handleContinue, children: [
        /* @__PURE__ */ jsx(Check, { className: "mr-2 h-4 w-4" }),
        " Continue"
      ] })
    ] })
  ] }) }) });
}
export {
  CameraCapture
};
