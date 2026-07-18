export type ScanContact = {
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  designation?: string;
  company?: string;
  companyName?: string;
  phone?: string;
  phoneNumber?: string;
  secondaryPhone?: string;
  email?: string;
  emailAddress?: string;
  secondaryEmail?: string;
  website?: string;
  secondaryWebsite?: string;
  address?: string;
  secondaryAddress?: string;
  notes?: string;
  phones?: string[];
  mobileNumbers?: string[];
  telephoneNumbers?: string[];
  emails?: string[];
  websites?: string[];
  addresses?: string[];
  socialLinks?: string[];
  gstNumbers?: string[];
  confidence?: Record<string, number>;
};

export type ParsedScanResult = {
  fullName: string;
  firstName: string;
  lastName: string;
  designation: string;
  companyName: string;
  phoneNumber: string;
  secondaryPhoneNumber: string;
  emailAddress: string;
  secondaryEmailAddress: string;
  website: string;
  secondaryWebsite: string;
  address: string;
  secondaryAddress: string;
  socialLinks: string;
  gstNumber: string;
  notes: string;
  phones: string[];
  emails: string[];
  websites: string[];
  addresses: string[];
  socialLinksList: string[];
  confidence: Record<string, number>;
};

const unique = (values: string[]) =>
  [...new Set(values.map((v) => v.trim()).filter(Boolean))];

/* ---------------------------------------------------------------------------
 * OCR value normalization.
 * OCR engines sometimes inject stray spaces ("jo hn@gmail.com", "8322 9 474").
 * These helpers clean values before they reach the Review form and the DB,
 * without touching legitimate word spacing in names/companies/addresses.
 * ------------------------------------------------------------------------- */

/** Collapse runs of whitespace to a single space (names, companies, titles). */
const collapseSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();

/** Remove all whitespace (emails, URLs, tax numbers can never contain spaces). */
const stripAllSpaces = (value: string): string => value.replace(/\s+/g, "");

/**
 * Normalize a phone number: keep an optional leading +country-code separated
 * by one space, drop all other OCR spacing/punctuation between digits.
 * "+65 8322 9474" -> "+65 83229474", "8322 9 474" -> "83229474".
 */
const normalizePhoneValue = (value: string): string => {
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

/** Preserve line breaks and word spacing; only collapse duplicate spaces per line. */
const normalizeAddressValue = (value: string): string =>
  value
    .split(/\r?\n/)
    .map(collapseSpaces)
    .filter(Boolean)
    .join("\n");

const normalizeList = (values: string[], normalizer: (value: string) => string) =>
  unique(values.map(normalizer).filter(Boolean));

export function parseScanContact(raw: ScanContact): ParsedScanResult {
  const phones = normalizeList(
    [
      ...(raw.phones || []),
      ...(raw.mobileNumbers || []),
      ...(raw.telephoneNumbers || []),
      raw.phone || "",
      raw.phoneNumber || "",
    ],
    normalizePhoneValue,
  );
  const emails = normalizeList(
    [...(raw.emails || []), raw.email || "", raw.emailAddress || ""],
    stripAllSpaces,
  );
  const websites = normalizeList([...(raw.websites || []), raw.website || ""], stripAllSpaces);
  const addresses = normalizeList(
    [...(raw.addresses || []), raw.address || ""],
    normalizeAddressValue,
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
    confidence: raw.confidence || {},
  };
}

export function emptyScanContact(): ScanContact {
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
    confidence: {},
  };
}

export const CONFIDENCE_LOW_THRESHOLD = 75;
