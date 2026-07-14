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
function otsuThreshold(histogram, totalPixels) {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];
  let sumB = 0;
  let weightB = 0;
  let maxVariance = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    weightB += histogram[t];
    if (weightB === 0) continue;
    const weightF = totalPixels - weightB;
    if (weightF === 0) break;
    sumB += t * histogram[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const variance = weightB * weightF * (meanB - meanF) ** 2;
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  return threshold;
}
function preprocessForOCR(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return ctx.createImageData(canvas.width, canvas.height);
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = width * height;
  const gray = new Uint8Array(pixelCount);
  const histogram = new Uint32Array(256);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const value = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    gray[p] = value;
    histogram[value]++;
  }
  const threshold = otsuThreshold(histogram, pixelCount);
  for (let p = 0; p < pixelCount; p++) {
    const enhanced = Math.min(255, Math.max(0, (gray[p] - 128) * 1.45 + 128));
    const binary = enhanced > threshold ? 255 : 0;
    const o = p * 4;
    data[o] = binary;
    data[o + 1] = binary;
    data[o + 2] = binary;
  }
  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const center = copy[idx];
      const neighbors = (copy[idx - 4] + copy[idx + 4] + copy[idx - width * 4] + copy[idx + width * 4]) / 4;
      const sharpened = Math.min(255, Math.max(0, center + (center - neighbors) * 0.35));
      data[idx] = sharpened;
      data[idx + 1] = sharpened;
      data[idx + 2] = sharpened;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return imageData;
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
export {
  AUTO_CAPTURE_WARMUP_MS as A,
  CARD_ASPECT as C,
  measureCardPresence as a,
  ALIGN_MIN_SHARPNESS as b,
  getAlignmentStatus as c,
  AUTO_CAPTURE_STABLE_READINGS as d,
  AUTO_CAPTURE_HOLD_MS as e,
  isMobileDevice as f,
  getCenteredCardCropRegion as g,
  CARD_DETECT_MIN_SCORE as h,
  initialWebcamConstraintTier as i,
  AUTO_CAPTURE_SHARPNESS as j,
  buildWebcamVideoConstraints as k,
  getAlignmentProgress as l,
  measureFrameSharpness as m,
  preprocessForOCR as n,
  pickDefaultFacingMode as p
};
