import type { ScanContact } from "./scanResult";

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const URL_PATTERN =
  /(?:https?:\/\/|www\.)[\w\-.]+\.[a-zA-Z]{2,}(?:\/[\w\-.\?=&/#]*)?|\b[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|co\.in|in|org|net|io|biz|consulting|co)\b/i;
const URL_REGEX =
  /(?:https?:\/\/|www\.)[\w\-.]+\.[a-zA-Z]{2,}(?:\/[\w\-.\?=&/#]*)?|\b[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|co\.in|in|org|net|io|biz|consulting|co)\b/gi;
const PHONE_PATTERN =
  /(?:(?:\+|00)\d{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)?\d{3,4}[\s\-.]?\d{3,4}(?:[\s\-.]?\d{2,4})?/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const INDIAN_MOBILE_REGEX = /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g;
const SOCIAL_REGEX =
  /\b(?:linkedin\.com|twitter\.com|facebook\.com|instagram\.com|x\.com|tiktok\.com|behance\.net|dribbble\.com)\S*/gi;
const COMPANY_SUFFIX_REGEX =
  /\b(?:inc|llc|ltd|corp|corporation|company|group|solutions|technologies|studios|labs|partners|consulting|consultants|pvt|private|limited|llp|plc|gmbh|sa|ag)\b/i;
const DESIGNATION_KEYWORDS =
  /\b(?:CEO|CTO|CFO|COO|CMO|Founder|President|Director|Manager|Engineer|Developer|Designer|Consultant|Architect|Specialist|Coordinator|Executive|Lead|Head|VP|Vice President|Partner|Principal|Officer|Associate|Analyst|Business Consultant)\b/i;
/** Street / plot / locality tokens that strongly signal an address line. */
const ADDRESS_STREET_KEYWORDS =
  /\b(?:street|st\.?|avenue|ave\.?|boulevard|blvd\.?|road|rd\.?|drive|drv\.?|dr\.?|lane|ln\.?|suite|ste\.?|floor|fl\.?|building|bldg\.?|block|plot|plt\.?|sector|phase|layout|nagar|colony|tower|complex|mouza|place|pl\.?|court|ct\.?|parkway|pkwy\.?|square|sq\.?|house\s*no\.?|h\.?\s*no\.?|door\s*no\.?|p\.?\s*o\.?\s*box|post\s*office)\b/i;

/** Cities / states often printed on Indian cards (weak alone; strong with digits/commas). */
const ADDRESS_PLACE_KEYWORDS =
  /\b(?:mumbai|delhi|bengaluru|bangalore|hyderabad|chennai|kolkata|pune|gurugram|gurgaon|noida|ahmedabad|jaipur|kochi|cochin|coimbatore|varanasi|bhubaneswar|cuttack|puri|odisha|orissa|ernakulam|alappuzha|alleppey|thrissur|trivandrum|thiruvananthapuram|calicut|kozhikode|mangalore|mysore|indore|bhopal|lucknow|kanpur|patna|ranchi|raipur|surat|vadodara|nagpur|nashik|chandigarh|amritsar|ludhiana|udaipur|jodhpur|guwahati|shillong|imphal|agartala|gangtok|shimla|dehradun|haridwar|rishikesh|goa|panaji|kerala|tamil\s*nadu|karnataka|maharashtra|gujarat|rajasthan|punjab|haryana|bihar|west\s*bengal|uttar\s*pradesh|madhya\s*pradesh|telangana|andhra\s*pradesh|india|u\.?\s*p\.?)\b/i;

const ADDRESS_PREFIX_PATTERN =
  /^(?:address|add(?:ress)?|location|loc)\s*[:\-.]?\s*/i;

/** Marketing / affiliation lines that mention India/Odisha but are not addresses. */
const ADDRESS_FALSE_POSITIVE =
  /\b(?:ministry|tourism|govt\.?|government|recognized|recognised|wholesale|partner|dream|magical|exploring|creating|memories|passion|journey|trusted|b2b|dmc\s+of|since\s+\d{4}|tour|tours?|trekking|adventure|holidays?|vacations?|explore\s+more|live\s+more|24\s*x\s*7|support\s*no|whatsapp)\b/i;

const ADDRESS_BRAND_NOISE =
  /\b(?:pvt\.?|ltd\.?|limited|llp|dmc|travels?|hotels?|vacations?|holidays?|tours?|adventure|solutions|technologies|private)\b/i;

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail",
  "yahoo",
  "hotmail",
  "outlook",
  "icloud",
  "protonmail",
  "live",
  "rediffmail",
]);

const UI_GARBAGE_REGEX =
  /\b(?:remove|retake|discard|save lead|use camera|position your card|opening camera|switch to|back camera|front camera)\b/i;

/** OCR noise symbols that should not appear in extracted contact fields. */
const OCR_JUNK_SYMBOL = /[|&;:)\]\[({"'\\<>~`^*]/g;
const OCR_JUNK_ONLY = /^[\s|&;:)\]\[({"'\\<>~`^*]+$/;

/** Strip junk OCR symbols from a text field while keeping readable words. */
function stripOcrJunkSymbols(value: string): string {
  const tokens = value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .split(/\s+/)
    .map((token) => token.replace(OCR_JUNK_SYMBOL, "").trim())
    .filter(Boolean);

  return tokens.join(" ").replace(/\s+/g, " ").trim();
}

function sanitizeEmail(value: string): string {
  return value.replace(/[|&;:)\]\[({"'\\<>~`^*]+$/g, "").trim();
}

function sanitizePhone(value: string): string {
  return value.replace(/^[|&;:)\]\[({"'\\<>~`^*|]+|[|&;:)\]\[({"'\\<>~`^*|]+$/g, "").trim();
}

function sanitizeUrl(value: string): string {
  return value.replace(/[|&;:)\]\[({"'\\<>~`^*]+$/g, "").trim();
}

/** Clean each line of a multi-line address while preserving line breaks. */
function sanitizeAddress(value: string): string {
  return value
    .split("\n")
    .map((line) => stripOcrJunkSymbols(line.replace(ADDRESS_PREFIX_PATTERN, "")))
    .filter(Boolean)
    .join("\n");
}

const normalizeLine = (line: string): string => stripOcrJunkSymbols(line);

const uniqueItems = (items: string[]): string[] =>
  [...new Set(items.map((value) => value.trim()).filter(Boolean))];

const sanitizeList = (items: string[], sanitizer: (value: string) => string): string[] =>
  uniqueItems(items.map(sanitizer).filter(Boolean));

const cleanLines = (rawText: string): string[] =>
  rawText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => line.length > 1);

/** Drop OCR noise and UI fragments that are not card content. */
const isGarbageLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return true;
  if (UI_GARBAGE_REGEX.test(trimmed)) return true;
  if (/^[\W_]{2,}$/.test(trimmed)) return true;
  if (OCR_JUNK_ONLY.test(trimmed)) return true;
  if (/^\|[\s@|]/.test(trimmed)) return true;
  if (/@\s*remo/i.test(trimmed)) return true;
  if ((trimmed.match(/[a-zA-Z0-9]/g)?.length ?? 0) < 2) return true;
  const symbolRatio =
    (trimmed.match(/[^a-zA-Z0-9\s@.+()-]/g)?.length ?? 0) / trimmed.length;
  return symbolRatio > 0.35;
};

/** Single-word logo fragments like "MetroA" from split headings. */
const isLogoFragment = (line: string): boolean => {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length !== 1) return false;
  const word = words[0];
  if (word.length > 10) return false;
  return /[a-z][A-Z]|[A-Z][a-z]+[A-Z]/.test(word);
};

/** Indian states/regions often printed on cards (service areas); never a person's name. */
const INDIAN_REGIONS = new Set([
  "himachal", "himachal pradesh", "rajasthan", "uttrakhand", "uttarakhand",
  "uttar pradesh", "madhya pradesh", "andhra pradesh", "arunachal pradesh",
  "jammu", "kashmir", "jammu kashmir", "jammu and kashmir", "jammu & kashmir",
  "kerala", "goa", "punjab", "haryana", "bihar", "gujarat", "maharashtra",
  "karnataka", "tamil nadu", "telangana", "west bengal", "odisha", "assam",
  "sikkim", "ladakh", "delhi", "new delhi", "chhattisgarh", "jharkhand",
  "manipur", "meghalaya", "mizoram", "nagaland", "tripura", "india",
]);

const isLikelyNameLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 60) return false;
  if (INDIAN_REGIONS.has(trimmed.toLowerCase())) return false;
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

const scoreNameLine = (line: string): number => {
  if (!isLikelyNameLine(line)) return -100;
  const words = line.trim().split(/\s+/);
  let score = 0;
  if (words.length >= 2 && words.length <= 4) score += 40;
  if (words.length === 1) score += 5;
  if (words.every((w) => /^[A-Z][a-z]+$/.test(w) || /^[A-Z]{2,}$/.test(w))) score += 25;
  if (line === line.toUpperCase() && words.length >= 2) score += 10;
  return score;
};

const extractGlobalMatches = (text: string, regex: RegExp): string[] => {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const matcher = new RegExp(regex.source, flags);
  return uniqueItems([...text.matchAll(matcher)].map((match) => match[0].trim()));
};

const normalizePhone = (value: string): string => value.replace(/\s+/g, " ").trim();

const extractPhones = (text: string, lines: string[]) => {
  const phones = uniqueItems([
    ...extractGlobalMatches(text, INDIAN_MOBILE_REGEX),
    ...extractGlobalMatches(text, PHONE_PATTERN),
  ])
    .map(normalizePhone)
    .filter((candidate) => {
      const digits = candidate.replace(/[^\d]/g, "");
      if (digits.length < 7 || digits.length > 15) return false;
      // Avoid treating Indian PIN codes / short plot numbers as phones.
      if (digits.length === 6) return false;
      if (digits.length < 8) return false;
      return true;
    });

  const remaining = lines.filter((line) => {
    // Keep address lines intact even if they contain digit sequences.
    if (
      ADDRESS_STREET_KEYWORDS.test(line) ||
      ADDRESS_HOUSE_NO.test(line) ||
      ADDRESS_PIN_CODE.test(line) ||
      (ADDRESS_PLACE_KEYWORDS.test(line) && (line.includes(",") || /-\s*\d{6}\b/.test(line)))
    ) {
      return !isGarbageLine(line);
    }
    let stripped = line;
    for (const phone of phones) {
      stripped = stripped.replace(phone, "").replace(/\d{7,}/g, "").trim();
    }
    return stripped.length > 2 && !isGarbageLine(stripped);
  });

  return { phones, remaining };
};

const stripKnownValues = (lines: string[], values: string[]): string[] => {
  const filtered: string[] = [];
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

const extractSocialLinks = (lines: string[]) => {
  const socialLinks = extractGlobalMatches(lines.join("\n"), SOCIAL_REGEX);
  const remaining = stripKnownValues(lines, socialLinks);
  return { socialLinks, remaining };
};

// US zip (5 or 5+4), Indian 6-digit PIN, Pin-221002, City-751030.
const ADDRESS_PIN_CODE =
  /(?:\b(?:pin|pincode|pin\s*code|postal|zip)\b\s*[:.\-]?\s*)?\b\d{5}(?:-\d{4})?\b|(?:\b(?:pin|pincode|pin\s*code|postal|zip)\b\s*[:.\-]?\s*)?\b\d{6}\b|\b[A-Za-z][A-Za-z.\s]{1,28}-\s*\d{6}\b/i;

/** Plot / door / house numbers common on Indian cards (19/526 B, B-2/12, Plot-1215/1400). */
const ADDRESS_HOUSE_NO =
  /(?:\b(?:plot|plt|house|h\.?\s*no\.?|door\s*no\.?|plot\s*no\.?)\b[\s.:#-]*)\d|(?:^\s*(?:no\.?|#)\s*[:.]?\s*\d)|(?:^\s*\d{1,4}\s*\/\s*\d+)|(?:^\s*[A-Za-z]?\d[\w./\s-]*,)/i;

const isAddressExcludedLine = (line: string): boolean => {
  if (EMAIL_PATTERN.test(line) || URL_PATTERN.test(line)) return true;
  // Service-area footers: "Varanasi | Prayagraj | Ayodhya"
  if ((line.match(/\|/g) || []).length >= 1 && ADDRESS_PLACE_KEYWORDS.test(line) && !ADDRESS_HOUSE_NO.test(line)) {
    return true;
  }
  if (DESIGNATION_KEYWORDS.test(line)) return true;
  if (
    COMPANY_SUFFIX_REGEX.test(line) &&
    !ADDRESS_HOUSE_NO.test(line) &&
    !ADDRESS_PIN_CODE.test(line)
  ) {
    return true;
  }
  if (
    ADDRESS_BRAND_NOISE.test(line) &&
    !ADDRESS_HOUSE_NO.test(line) &&
    !ADDRESS_PIN_CODE.test(line) &&
    !ADDRESS_STREET_KEYWORDS.test(line)
  ) {
    return true;
  }
  if (ADDRESS_FALSE_POSITIVE.test(line) && !ADDRESS_HOUSE_NO.test(line) && !ADDRESS_PIN_CODE.test(line)) {
    return true;
  }
  if (/^(?:id|email|e-?mail|web|www|mobile|phone|tel)\s*:?\s*$/i.test(line)) return true;
  return false;
};

/** Strong address signal — enough to seed a block on its own. */
const isStrongAddressLine = (line: string): boolean => {
  if (!line || line.length < 4 || isAddressExcludedLine(line)) return false;
  if (ADDRESS_STREET_KEYWORDS.test(line)) return true;
  if (ADDRESS_HOUSE_NO.test(line)) return true;
  if (ADDRESS_PIN_CODE.test(line)) return true;
  // Digit-led plot/house rows with commas: "19/ 526 B, Pynadathu, ..."
  if (line.length > 5 && /^\s*[\dA-Za-z]/.test(line) && /\d/.test(line) && line.includes(",")) {
    return true;
  }
  return false;
};

/** Weak place line — city/locality blocks, including landmark-style cards without PIN. */
const isWeakAddressLine = (line: string): boolean => {
  if (!line || line.length < 4 || isAddressExcludedLine(line)) return false;
  if (isStrongAddressLine(line)) return true;
  if (!ADDRESS_PLACE_KEYWORDS.test(line)) return false;
  if (line === line.toUpperCase() && line.trim().split(/\s+/).length <= 3 && !/\d/.test(line) && !line.includes(",")) {
    return false;
  }
  return /\d/.test(line) || line.includes(",") || line.trim().split(/\s+/).length >= 2;
};

/** Short locality / landmark lines that can sit inside a multi-line address block. */
const isAddressContinuation = (line: string): boolean => {
  if (!line || line.length < 3 || line.length > 80) return false;
  if (isAddressExcludedLine(line) || isGarbageLine(line)) return false;
  if (isStrongAddressLine(line) || isWeakAddressLine(line)) return true;
  const words = line.trim().split(/\s+/);
  if (words.length > 8) return false;
  if (isLikelyNameLine(line) && words.length <= 3) return false;
  return /^[A-Za-z0-9]/.test(line) && !DESIGNATION_KEYWORDS.test(line);
};

const scoreAddressBlock = (block: string): number => {
  let score = 0;
  for (const line of block.split("\n")) {
    if (ADDRESS_PIN_CODE.test(line)) score += 50;
    if (ADDRESS_HOUSE_NO.test(line)) score += 40;
    if (ADDRESS_STREET_KEYWORDS.test(line)) score += 30;
    if (ADDRESS_PLACE_KEYWORDS.test(line)) score += 10;
    if (line.includes(",")) score += 5;
    if (ADDRESS_BRAND_NOISE.test(line)) score -= 25;
  }
  score += Math.min(20, block.split("\n").length * 5);
  return score;
};

/**
 * Group consecutive address lines into complete multi-line address blocks so
 * addresses spanning several lines (building / street / city-PIN) stay whole.
 */
const extractAddress = (lines: string[]) => {
  const usable = lines.filter((line) => !isGarbageLine(line));
  const strong = usable.map(isStrongAddressLine);
  const weak = usable.map(isWeakAddressLine);

  const include = usable.map((_, idx) => strong[idx] || weak[idx]);

  // Fill gaps between two address seeds (landmark / locality middle lines).
  const seedIdxs = include.map((flag, idx) => (flag ? idx : -1)).filter((idx) => idx >= 0);
  for (let idx = 0; idx < usable.length; idx += 1) {
    if (include[idx]) continue;
    const left = [...seedIdxs].reverse().find((j) => j < idx);
    const right = seedIdxs.find((j) => j > idx);
    if (left === undefined || right === undefined || right - left > 4) continue;
    if (isAddressExcludedLine(usable[idx])) continue;
    include[idx] = true;
  }

  // Sandwich rule: a short connector between two address lines belongs to the block.
  for (let idx = 1; idx < usable.length - 1; idx += 1) {
    if (
      !include[idx] &&
      include[idx - 1] &&
      (include[idx + 1] || strong[idx + 1] || weak[idx + 1]) &&
      usable[idx].length <= 70 &&
      isAddressContinuation(usable[idx])
    ) {
      include[idx] = true;
    }
  }

  // Expand from seeds to adjacent continuation / weak place lines (landmark blocks).
  let changed = true;
  while (changed) {
    changed = false;
    for (let idx = 0; idx < usable.length; idx += 1) {
      if (include[idx]) continue;
      const prev = idx > 0 && include[idx - 1];
      const next = idx < usable.length - 1 && include[idx + 1];
      if (!(prev || next)) continue;
      if (strong[idx] || weak[idx] || isAddressContinuation(usable[idx])) {
        if (isLikelyNameLine(usable[idx]) && !(prev && next) && !weak[idx] && !strong[idx]) {
          continue;
        }
        include[idx] = true;
        changed = true;
      }
    }
  }

  const addressBlocks: string[] = [];
  const remaining: string[] = [];
  let currentBlock: string[] = [];
  let currentHasSignal = false;

  const lineHasAddressSignal = (line: string): boolean =>
    ADDRESS_STREET_KEYWORDS.test(line) ||
    ADDRESS_HOUSE_NO.test(line) ||
    ADDRESS_PIN_CODE.test(line) ||
    (ADDRESS_PLACE_KEYWORDS.test(line) && !ADDRESS_FALSE_POSITIVE.test(line));

  const flush = () => {
    if (currentBlock.length === 0) return;
    if (currentHasSignal || currentBlock.some(lineHasAddressSignal)) {
      addressBlocks.push(
        currentBlock.map((line) => line.replace(ADDRESS_PREFIX_PATTERN, "").trim()).filter(Boolean).join("\n"),
      );
    } else {
      remaining.push(...currentBlock);
    }
    currentBlock = [];
    currentHasSignal = false;
  };

  usable.forEach((line, idx) => {
    if (include[idx]) {
      currentBlock.push(line);
      if (strong[idx] || lineHasAddressSignal(line)) currentHasSignal = true;
    } else {
      flush();
      remaining.push(line);
    }
  });
  flush();

  addressBlocks.sort((a, b) => scoreAddressBlock(b) - scoreAddressBlock(a));
  return { addresses: uniqueItems(addressBlocks.filter(Boolean)), remaining };
};

const extractNameAndDesignation = (lines: string[]) => {
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

const titleCase = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const companyFromDomain = (domainRoot: string, lines: string[]): string => {
  const needle = domainRoot.toLowerCase();
  for (const line of lines) {
    if (isGarbageLine(line) || isLikelyNameLine(line)) continue;
    if (line.toLowerCase().includes(needle)) {
      return line.trim();
    }
  }
  return titleCase(domainRoot.replace(/[-_]/g, " "));
};

const completeCompanyFromEmailDomain = (domainRoot: string, line: string): string => {
  if (!COMPANY_SUFFIX_REGEX.test(line)) return line.trim();
  const suffix = line.match(COMPANY_SUFFIX_REGEX)?.[0] || "";
  const fragment = line.replace(COMPANY_SUFFIX_REGEX, "").trim().toLowerCase();
  if (fragment && domainRoot.toLowerCase().includes(fragment)) {
    return `${titleCase(domainRoot)} ${suffix}`.trim();
  }
  return line.trim();
};

const extractCompany = (lines: string[], emails: string[], websites: string[]) => {
  const usable = lines.filter((line) => !isGarbageLine(line) && !isLogoFragment(line));
  const emailDomainRoot = emails[0]?.split("@")[1]?.split(".")[0]?.toLowerCase() || "";

  for (const line of usable) {
    if (COMPANY_SUFFIX_REGEX.test(line) && !isLikelyNameLine(line)) {
      return emailDomainRoot
        ? completeCompanyFromEmailDomain(emailDomainRoot, line)
        : line.trim();
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
    (line) =>
      line.length >= 4 &&
      line.length <= 50 &&
      line === line.toUpperCase() &&
      !DESIGNATION_KEYWORDS.test(line) &&
      !isLikelyNameLine(line),
  );
  if (uppercaseLine) return uppercaseLine;

  for (const line of usable) {
    if (!isLikelyNameLine(line) && line.length >= 4 && line.length <= 50) {
      return line.trim();
    }
  }

  return "";
};

const inferNames = (fullName: string) => {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
};

const nameFromEmail = (email: string): string => {
  const local = email.split("@")[0] || "";
  return local.replace(/[._-]+/g, " ").trim();
};

export function parseOcrText(rawText: string): ScanContact {
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
    addressResult.remaining,
  );
  const companyName = extractCompany(linesAfterName, emails, websites);

  const fullName =
    name ||
    (emails[0] ? nameFromEmail(emails[0]) : "") ||
    "";
  const { firstName, lastName } = inferNames(fullName);

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
    confidence: {},
  };
}
