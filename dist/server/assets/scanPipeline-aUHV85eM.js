import { PaddleOCR } from "@paddleocr/paddleocr-js";
import { s as storeScanSession } from "./scanSession-HtX0cjGm.js";
import { x as isOfflineMode, p as getConnectionMode, c as apiFetch, d as API_BASE_URL } from "./router-CTqOT-Nn.js";
const unique = (values) => [...new Set(values.map((v) => v.trim()).filter(Boolean))];
const collapseSpaces = (value) => value.replace(/\s+/g, " ").trim();
const stripAllSpaces = (value) => value.replace(/\s+/g, "");
const normalizePhoneValue = (value) => {
  const trimmed = collapseSpaces(value);
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  const ccMatch = trimmed.match(/^\+(\d{1,3})(?=[\s\-.(])/);
  if (ccMatch) {
    const cc = ccMatch[1];
    return `+${cc} ${digits.slice(cc.length)}`;
  }
  return trimmed.startsWith("+") ? `+${digits}` : digits;
};
const normalizeAddressValue = (value) => value.split(/\r?\n/).map(collapseSpaces).filter(Boolean).join("\n");
const normalizeList = (values, normalizer) => unique(values.map(normalizer).filter(Boolean));
function parseScanContact(raw) {
  const phones = normalizeList(
    [
      ...raw.phones || [],
      ...raw.mobileNumbers || [],
      ...raw.telephoneNumbers || [],
      raw.phone || "",
      raw.phoneNumber || ""
    ],
    normalizePhoneValue
  );
  const emails = normalizeList(
    [...raw.emails || [], raw.email || "", raw.emailAddress || ""],
    stripAllSpaces
  );
  const websites = normalizeList([...raw.websites || [], raw.website || ""], stripAllSpaces);
  const addresses = normalizeList(
    [...raw.addresses || [], raw.address || ""],
    normalizeAddressValue
  );
  const socialLinksList = normalizeList(raw.socialLinks || [], stripAllSpaces);
  const gstNumbers = normalizeList(raw.gstNumbers || [], stripAllSpaces);
  const firstName = collapseSpaces(raw.firstName || "");
  const lastName = collapseSpaces(raw.lastName || "");
  const fromParts = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fullName = collapseSpaces(raw.fullName || raw.name || fromParts || "");
  return {
    fullName,
    firstName: firstName || fullName.split(/\s+/)[0] || "",
    lastName: lastName || fullName.split(/\s+/).slice(1).join(" ") || "",
    designation: collapseSpaces(raw.designation || ""),
    companyName: collapseSpaces(raw.companyName || raw.company || ""),
    phoneNumber: phones[0] || "",
    secondaryPhoneNumber: phones[1] || "",
    emailAddress: emails[0] || "",
    secondaryEmailAddress: emails[1] || "",
    website: websites[0] || "",
    secondaryWebsite: websites[1] || "",
    address: addresses[0] || "",
    secondaryAddress: addresses[1] || "",
    socialLinks: socialLinksList.join(", "),
    gstNumber: gstNumbers[0] || "",
    notes: "",
    phones,
    emails,
    websites,
    addresses,
    socialLinksList,
    confidence: raw.confidence || {}
  };
}
function emptyScanContact() {
  return {
    name: "",
    firstName: "",
    lastName: "",
    designation: "",
    company: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    notes: "",
    phones: [],
    mobileNumbers: [],
    telephoneNumbers: [],
    emails: [],
    websites: [],
    addresses: [],
    socialLinks: [],
    gstNumbers: [],
    confidence: {}
  };
}
const CONFIDENCE_LOW_THRESHOLD = 75;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const URL_PATTERN = /(?:https?:\/\/|www\.)[\w\-.]+\.[a-zA-Z]{2,}(?:\/[\w\-.\?=&/#]*)?|\b[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|co\.in|in|org|net|io|biz|consulting|co)\b/i;
const URL_REGEX = /(?:https?:\/\/|www\.)[\w\-.]+\.[a-zA-Z]{2,}(?:\/[\w\-.\?=&/#]*)?|\b[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|co\.in|in|org|net|io|biz|consulting|co)\b/gi;
const PHONE_PATTERN = /(?:(?:\+|00)\d{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)?\d{3,4}[\s\-.]?\d{3,4}(?:[\s\-.]?\d{2,4})?/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const INDIAN_MOBILE_REGEX = /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g;
const SOCIAL_REGEX = /\b(?:linkedin\.com|twitter\.com|facebook\.com|instagram\.com|x\.com|tiktok\.com|behance\.net|dribbble\.com)\S*/gi;
const COMPANY_SUFFIX_REGEX = /\b(?:inc|llc|ltd|corp|corporation|company|group|solutions|technologies|studios|labs|partners|consulting|consultants|pvt|private|limited|llp|plc|gmbh|sa|ag)\b/i;
const DESIGNATION_KEYWORDS = /\b(?:CEO|CTO|CFO|COO|CMO|Founder|President|Director|Manager|Engineer|Developer|Designer|Consultant|Architect|Specialist|Coordinator|Executive|Lead|Head|VP|Vice President|Partner|Principal|Officer|Associate|Analyst|Business Consultant)\b/i;
const ADDRESS_KEYWORDS = /\b(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|suite|ste|floor|fl|building|bldg|place|pl|court|ct|parkway|pkwy|square|sq|sector|gurugram|gurgaon|mumbai|delhi|bengaluru|bangalore|hyderabad|chennai|kolkata|pune|india|pin|postal|zip)\b/i;
const GENERIC_EMAIL_DOMAINS = /* @__PURE__ */ new Set([
  "gmail",
  "yahoo",
  "hotmail",
  "outlook",
  "icloud",
  "protonmail",
  "live",
  "rediffmail"
]);
const UI_GARBAGE_REGEX = /\b(?:remove|retake|discard|save lead|use camera|position your card|opening camera|switch to|back camera|front camera)\b/i;
const OCR_JUNK_SYMBOL = /[|&;:)\]\[({"'\\<>~`^*]/g;
const OCR_JUNK_ONLY = /^[\s|&;:)\]\[({"'\\<>~`^*]+$/;
function stripOcrJunkSymbols(value) {
  const tokens = value.replace(/[\u200B-\u200D\uFEFF]/g, "").split(/\s+/).map((token) => token.replace(OCR_JUNK_SYMBOL, "").trim()).filter(Boolean);
  return tokens.join(" ").replace(/\s+/g, " ").trim();
}
function sanitizeEmail(value) {
  return value.replace(/[|&;:)\]\[({"'\\<>~`^*]+$/g, "").trim();
}
function sanitizePhone(value) {
  return value.replace(/^[|&;:)\]\[({"'\\<>~`^*|]+|[|&;:)\]\[({"'\\<>~`^*|]+$/g, "").trim();
}
function sanitizeUrl(value) {
  return value.replace(/[|&;:)\]\[({"'\\<>~`^*]+$/g, "").trim();
}
function sanitizeAddress(value) {
  return value.split("\n").map(stripOcrJunkSymbols).filter(Boolean).join("\n");
}
const normalizeLine = (line) => stripOcrJunkSymbols(line);
const uniqueItems = (items) => [...new Set(items.map((value) => value.trim()).filter(Boolean))];
const sanitizeList = (items, sanitizer) => uniqueItems(items.map(sanitizer).filter(Boolean));
const cleanLines = (rawText) => rawText.split(/\r?\n/).map(normalizeLine).filter((line) => line.length > 1);
const isGarbageLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return true;
  if (UI_GARBAGE_REGEX.test(trimmed)) return true;
  if (/^[\W_]{2,}$/.test(trimmed)) return true;
  if (OCR_JUNK_ONLY.test(trimmed)) return true;
  if (/^\|[\s@|]/.test(trimmed)) return true;
  if (/@\s*remo/i.test(trimmed)) return true;
  if ((trimmed.match(/[a-zA-Z0-9]/g)?.length ?? 0) < 2) return true;
  const symbolRatio = (trimmed.match(/[^a-zA-Z0-9\s@.+()-]/g)?.length ?? 0) / trimmed.length;
  return symbolRatio > 0.35;
};
const isLogoFragment = (line) => {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length !== 1) return false;
  const word = words[0];
  if (word.length > 10) return false;
  return /[a-z][A-Z]|[A-Z][a-z]+[A-Z]/.test(word);
};
const isLikelyNameLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 60) return false;
  if (isGarbageLine(trimmed) || isLogoFragment(trimmed)) return false;
  if (EMAIL_PATTERN.test(trimmed) || URL_PATTERN.test(trimmed) || PHONE_PATTERN.test(trimmed)) {
    return false;
  }
  if (DESIGNATION_KEYWORDS.test(trimmed) || COMPANY_SUFFIX_REGEX.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length > 5) return false;
  const alphaWords = words.filter((word) => /^[A-Za-z][A-Za-z.'-]*$/.test(word));
  if (alphaWords.length < Math.max(1, words.length - 1)) return false;
  if (words.length === 1 && words[0].length < 5) return false;
  return true;
};
const scoreNameLine = (line) => {
  if (!isLikelyNameLine(line)) return -100;
  const words = line.trim().split(/\s+/);
  let score = 0;
  if (words.length >= 2 && words.length <= 4) score += 40;
  if (words.length === 1) score += 5;
  if (words.every((w) => /^[A-Z][a-z]+$/.test(w) || /^[A-Z]{2,}$/.test(w))) score += 25;
  if (line === line.toUpperCase() && words.length >= 2) score += 10;
  return score;
};
const extractGlobalMatches = (text, regex) => {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const matcher = new RegExp(regex.source, flags);
  return uniqueItems([...text.matchAll(matcher)].map((match) => match[0].trim()));
};
const normalizePhone = (value) => value.replace(/\s+/g, " ").trim();
const extractPhones = (text, lines) => {
  const phones = uniqueItems([
    ...extractGlobalMatches(text, INDIAN_MOBILE_REGEX),
    ...extractGlobalMatches(text, PHONE_PATTERN)
  ]).map(normalizePhone).filter((candidate) => {
    const digits = candidate.replace(/[^\d]/g, "");
    return digits.length >= 7 && digits.length <= 15;
  });
  const remaining = lines.filter((line) => {
    let stripped = line;
    for (const phone of phones) {
      stripped = stripped.replace(phone, "").replace(/\d{7,}/g, "").trim();
    }
    return stripped.length > 2 && !isGarbageLine(stripped);
  });
  return { phones, remaining };
};
const stripKnownValues = (lines, values) => {
  const filtered = [];
  for (const line of lines) {
    if (isGarbageLine(line)) continue;
    let stripped = line;
    for (const value of values) {
      if (!value) continue;
      stripped = stripped.replace(value, "").trim();
    }
    stripped = stripped.replace(EMAIL_REGEX, "").replace(URL_REGEX, "").trim();
    if (stripped.length > 2 && !isGarbageLine(stripped)) {
      filtered.push(stripped);
    }
  }
  return filtered;
};
const extractSocialLinks = (lines) => {
  const socialLinks = extractGlobalMatches(lines.join("\n"), SOCIAL_REGEX);
  const remaining = stripKnownValues(lines, socialLinks);
  return { socialLinks, remaining };
};
const ADDRESS_PIN_CODE = /\b\d{5}(?:-\d{4})?\b|\b\d{6}\b/;
const isAddressLine = (line) => ADDRESS_KEYWORDS.test(line) || ADDRESS_PIN_CODE.test(line) || /\d{2,5}/.test(line) && line.includes(",");
const extractAddress = (lines) => {
  const usable = lines.filter((line) => !isGarbageLine(line));
  const matches = usable.map(isAddressLine);
  const include = [...matches];
  for (let idx = 1; idx < usable.length - 1; idx += 1) {
    if (!include[idx] && include[idx - 1] && matches[idx + 1] && usable[idx].length <= 60) {
      include[idx] = true;
    }
  }
  const addressBlocks = [];
  const remaining = [];
  let currentBlock = [];
  usable.forEach((line, idx) => {
    if (include[idx]) {
      currentBlock.push(line);
    } else {
      if (currentBlock.length > 0) {
        addressBlocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      remaining.push(line);
    }
  });
  if (currentBlock.length > 0) {
    addressBlocks.push(currentBlock.join("\n"));
  }
  return { addresses: uniqueItems(addressBlocks), remaining };
};
const extractNameAndDesignation = (lines) => {
  const usable = lines.filter((line) => !isGarbageLine(line));
  let name = "";
  let designation = "";
  const titleIdx = usable.findIndex((line) => DESIGNATION_KEYWORDS.test(line));
  if (titleIdx >= 0) {
    designation = usable[titleIdx];
    if (titleIdx > 0 && isLikelyNameLine(usable[titleIdx - 1])) {
      name = usable[titleIdx - 1];
      const remaining = usable.filter((_, idx) => idx !== titleIdx - 1 && idx !== titleIdx);
      return { name, designation, remaining };
    }
  }
  let bestScore = -1;
  let bestIdx = -1;
  usable.forEach((line, idx) => {
    const score = scoreNameLine(line);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });
  if (bestIdx >= 0) {
    name = usable[bestIdx];
    const remaining = usable.filter((_, idx) => idx !== bestIdx);
    if (!designation) {
      const nextTitleIdx = remaining.findIndex((line) => DESIGNATION_KEYWORDS.test(line));
      if (nextTitleIdx >= 0) {
        designation = remaining[nextTitleIdx];
        remaining.splice(nextTitleIdx, 1);
      }
    }
    return { name, designation, remaining };
  }
  return { name, designation, remaining: usable };
};
const titleCase = (value) => value.split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
const companyFromDomain = (domainRoot, lines) => {
  const needle = domainRoot.toLowerCase();
  for (const line of lines) {
    if (isGarbageLine(line) || isLikelyNameLine(line)) continue;
    if (line.toLowerCase().includes(needle)) {
      return line.trim();
    }
  }
  return titleCase(domainRoot.replace(/[-_]/g, " "));
};
const completeCompanyFromEmailDomain = (domainRoot, line) => {
  if (!COMPANY_SUFFIX_REGEX.test(line)) return line.trim();
  const suffix = line.match(COMPANY_SUFFIX_REGEX)?.[0] || "";
  const fragment = line.replace(COMPANY_SUFFIX_REGEX, "").trim().toLowerCase();
  if (fragment && domainRoot.toLowerCase().includes(fragment)) {
    return `${titleCase(domainRoot)} ${suffix}`.trim();
  }
  return line.trim();
};
const extractCompany = (lines, emails, websites) => {
  const usable = lines.filter((line) => !isGarbageLine(line) && !isLogoFragment(line));
  const emailDomainRoot = emails[0]?.split("@")[1]?.split(".")[0]?.toLowerCase() || "";
  for (const line of usable) {
    if (COMPANY_SUFFIX_REGEX.test(line) && !isLikelyNameLine(line)) {
      return emailDomainRoot ? completeCompanyFromEmailDomain(emailDomainRoot, line) : line.trim();
    }
  }
  for (const hint of [...emails, ...websites]) {
    const domainMatch = hint.match(/(?:@|(?:www\.)?)([a-zA-Z0-9-]+)\.[a-zA-Z]{2,}/i);
    if (!domainMatch) continue;
    const domainRoot = domainMatch[1].toLowerCase();
    if (GENERIC_EMAIL_DOMAINS.has(domainRoot)) continue;
    const fromDomain = companyFromDomain(domainRoot, usable);
    if (fromDomain) return fromDomain;
  }
  const uppercaseLine = usable.find(
    (line) => line.length >= 4 && line.length <= 50 && line === line.toUpperCase() && !DESIGNATION_KEYWORDS.test(line) && !isLikelyNameLine(line)
  );
  if (uppercaseLine) return uppercaseLine;
  for (const line of usable) {
    if (!isLikelyNameLine(line) && line.length >= 4 && line.length <= 50) {
      return line.trim();
    }
  }
  return "";
};
const inferNames = (fullName) => {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || ""
  };
};
const nameFromEmail = (email) => {
  const local = email.split("@")[0] || "";
  return local.replace(/[._-]+/g, " ").trim();
};
function parseOcrText(rawText) {
  const normalizedText = rawText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  const lines = cleanLines(normalizedText);
  const emails = extractGlobalMatches(normalizedText, EMAIL_REGEX);
  let textWithoutEmails = normalizedText;
  for (const email of emails) {
    textWithoutEmails = textWithoutEmails.replace(email, " ");
  }
  const websites = extractGlobalMatches(textWithoutEmails, URL_REGEX);
  const phonesResult = extractPhones(normalizedText, lines);
  const { socialLinks, remaining: linesAfterSocial } = extractSocialLinks(phonesResult.remaining);
  const addressResult = extractAddress(linesAfterSocial);
  const { name, designation, remaining: linesAfterName } = extractNameAndDesignation(
    addressResult.remaining
  );
  const companyName = extractCompany(linesAfterName, emails, websites);
  const fullName = name || (emails[0] ? nameFromEmail(emails[0]) : "") || "";
  inferNames(fullName);
  const cleanEmails = sanitizeList(emails, sanitizeEmail);
  const cleanPhones = sanitizeList(phonesResult.phones, sanitizePhone);
  const cleanWebsites = sanitizeList(websites, sanitizeUrl);
  const cleanAddresses = sanitizeList(addressResult.addresses, sanitizeAddress);
  const cleanSocial = sanitizeList(socialLinks, sanitizeUrl);
  const cleanFullName = stripOcrJunkSymbols(fullName);
  const cleanDesignation = stripOcrJunkSymbols(designation);
  const cleanCompany = stripOcrJunkSymbols(companyName);
  const { firstName: cleanFirst, lastName: cleanLast } = inferNames(cleanFullName);
  return {
    fullName: cleanFullName,
    firstName: cleanFirst,
    lastName: cleanLast,
    designation: cleanDesignation,
    company: cleanCompany,
    companyName: cleanCompany,
    phone: cleanPhones[0] || "",
    secondaryPhone: cleanPhones[1] || "",
    phones: cleanPhones,
    email: cleanEmails[0] || "",
    secondaryEmail: cleanEmails[1] || "",
    emails: cleanEmails,
    website: cleanWebsites[0] || "",
    secondaryWebsite: cleanWebsites[1] || "",
    websites: cleanWebsites,
    address: cleanAddresses[0] || "",
    secondaryAddress: cleanAddresses[1] || "",
    addresses: cleanAddresses,
    socialLinks: cleanSocial,
    notes: "",
    confidence: {}
  };
}
const LOCAL_DET_URL = "/paddleocr/models/PP-OCRv5_mobile_det_onnx_infer.tar";
const LOCAL_REC_URL = "/paddleocr/models/PP-OCRv5_mobile_rec_onnx_infer.tar";
const LOCAL_WASM_PATHS = "/paddleocr/wasm/";
let ocrInstance = null;
let initPromise = null;
async function getOcrInstance() {
  if (ocrInstance) return ocrInstance;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const ocr = await PaddleOCR.create({
        lang: "en",
        ocrVersion: "PP-OCRv5",
        textDetectionModelName: "PP-OCRv5_mobile_det",
        textDetectionModelAsset: { url: LOCAL_DET_URL },
        textRecognitionModelName: "PP-OCRv5_mobile_rec",
        textRecognitionModelAsset: { url: LOCAL_REC_URL },
        ortOptions: {
          backend: "wasm",
          wasmPaths: LOCAL_WASM_PATHS
        }
      });
      ocrInstance = ocr;
      return ocr;
    } catch (error) {
      initPromise = null;
      ocrInstance = null;
      throw error;
    }
  })();
  return initPromise;
}
function averageItemConfidence(items) {
  if (!items?.length) return void 0;
  const scores = items.map((item) => Number(item.score)).filter((score) => Number.isFinite(score) && score > 0);
  if (scores.length === 0) return void 0;
  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round((avg <= 1 ? avg * 100 : avg) * 10) / 10;
}
async function runBrowserOcr(file) {
  try {
    const ocr = await getOcrInstance();
    const results = await ocr.predict(file);
    const result = results[0];
    const lines = (result?.items || []).map((item) => item.text || "").filter((line) => line.trim().length > 0);
    const rawText = lines.join("\n");
    const ocrConfidence = averageItemConfidence(result?.items);
    if (!rawText) {
      return {
        contact: parseOcrText(rawText),
        rawText,
        ocrWarning: "Browser OCR ran, but could not extract any text.",
        ocrConfidence
      };
    }
    return {
      contact: parseOcrText(rawText),
      rawText,
      ocrConfidence
    };
  } catch (error) {
    console.warn("Browser OCR (PaddleOCR) failed:", error);
    const detail = "";
    return {
      contact: parseOcrText(""),
      rawText: "",
      ocrWarning: `Offline scan failed.${detail} Enter details manually.`
    };
  }
}
let cvPromise = null;
async function loadOpenCv() {
  if (cvPromise) return cvPromise;
  cvPromise = (async () => {
    const mod = await import("@techstark/opencv-js");
    const cv = mod.default ?? mod;
    const ready = cv.ready;
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
      }
    }
    await new Promise((resolve) => {
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
function loadFileOntoCanvas(file) {
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
async function enhanceOfflineCameraCapture(file) {
  try {
    const cv = await loadOpenCv();
    const canvas = await loadFileOntoCanvas(file);
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const equalized = new cv.Mat();
    const blurred = new cv.Mat();
    const sharpened = new cv.Mat();
    const rgba = new cv.Mat();
    let clahe = null;
    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      clahe = cv.createCLAHE(2, new cv.Size(8, 8));
      clahe.apply(gray, equalized);
      cv.GaussianBlur(equalized, blurred, new cv.Size(0, 0), 1.2);
      cv.addWeighted(equalized, 1.5, blurred, -0.5, 0, sharpened);
      cv.cvtColor(sharpened, rgba, cv.COLOR_GRAY2RGBA);
      const outCanvas = document.createElement("canvas");
      outCanvas.width = canvas.width;
      outCanvas.height = canvas.height;
      cv.imshow(outCanvas, rgba);
      const blob = await new Promise(
        (resolve) => outCanvas.toBlob(resolve, "image/jpeg", 0.92)
      );
      if (!blob) return file;
      return new File([blob], file.name.replace(/(\.\w+)?$/, "-enhanced.jpg"), {
        type: "image/jpeg",
        lastModified: Date.now()
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
async function prepareOcrFile(file, captureSource, forceBrowser = false) {
  const offline = forceBrowser || isOfflineMode() || getConnectionMode() === "offline";
  if (offline && captureSource === "Camera") {
    return enhanceOfflineCameraCapture(file);
  }
  return file;
}
async function runBrowserExtraction(file, onProgress, captureSource) {
  const message = typeof navigator !== "undefined" && !navigator.onLine ? "No internet — extracting on device…" : "Extracting contact details on device…";
  onProgress?.({ progress: 20, message });
  if (captureSource === "Camera") {
    onProgress?.({ progress: 30, message: "Enhancing camera capture…" });
  }
  const ocrFile = await prepareOcrFile(file, captureSource, true);
  onProgress?.({ progress: 45, message });
  const result = await runBrowserOcr(ocrFile);
  onProgress?.({ progress: 100, message: "Extraction complete" });
  return {
    contact: result.contact,
    rawText: result.rawText,
    ocrWarning: result.ocrWarning,
    ocrEngine: "PaddleOCR",
    ocrConfidence: result.ocrConfidence
  };
}
function averageConfidence(confidence) {
  if (!confidence || typeof confidence !== "object") return void 0;
  const values = Object.values(confidence).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
  if (values.length === 0) return void 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round((avg <= 1 ? avg * 100 : avg) * 10) / 10;
}
async function runOnlineExtraction(file, onProgress, captureSource) {
  onProgress?.({ progress: 20, message: "Extracting via AWS Textract…" });
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiFetch(`${API_BASE_URL}/api/ocr`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(`Backend OCR returned ${response.status}`);
    }
    const data = await response.json();
    const rawText = data.rawText || "";
    const contact = data.contact || emptyScanContact();
    onProgress?.({ progress: 100, message: "Extraction complete" });
    return {
      contact,
      rawText,
      ocrEngine: "Textract",
      ocrConfidence: averageConfidence(data.confidence ?? data.contact?.confidence)
    };
  } catch (error) {
    console.warn("Online OCR (Textract) failed, falling back to browser OCR:", error);
    return runBrowserExtraction(file, onProgress, captureSource);
  }
}
async function extractContactFromImage(file, onProgress, captureSource) {
  try {
    if (!isOfflineMode() && getConnectionMode() === "online") {
      return await runOnlineExtraction(file, onProgress, captureSource);
    }
    return await runBrowserExtraction(file, onProgress, captureSource);
  } catch (err) {
    console.error("OCR pipeline failed:", err);
    onProgress?.({ progress: 100, message: "Extraction failed — enter details manually" });
    return {
      contact: emptyScanContact(),
      ocrWarning: "Could not read this card. Try better lighting, hold the card flat, or enter details manually."
    };
  }
}
async function scanFileAndStore(file, imageDataUrl, onProgress, captureSource) {
  const result = await extractContactFromImage(file, onProgress, captureSource);
  storeScanSession(result.contact, imageDataUrl, {
    rawText: result.rawText,
    ocrWarning: result.ocrWarning,
    ocrEngine: result.ocrEngine,
    ocrConfidence: result.ocrConfidence,
    captureSource
  });
  return result;
}
const scanPipeline = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  extractContactFromImage,
  scanFileAndStore
}, Symbol.toStringTag, { value: "Module" }));
export {
  CONFIDENCE_LOW_THRESHOLD as C,
  scanPipeline as a,
  emptyScanContact as e,
  parseScanContact as p,
  scanFileAndStore as s
};
