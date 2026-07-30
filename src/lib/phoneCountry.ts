import {
  COUNTRIES,
  DIAL_CODES_LONGEST_FIRST,
  findCountryByDialCode,
  type CountryOption,
} from "@/constants/countries";

export type SplitPhoneResult = {
  countryCode: string;
  countryName: string;
  countryIso: string;
  localNumber: string;
};

const emptySplit = (): SplitPhoneResult => ({
  countryCode: "",
  countryName: "",
  countryIso: "",
  localNumber: "",
});

/**
 * Split an OCR/user phone into dial code + local number.
 * "+91 9876543210" → { countryCode: "+91", localNumber: "9876543210", … }
 * Leaves country empty when no dial code can be detected.
 */
export function splitPhoneNumber(raw: string): SplitPhoneResult {
  const trimmed = (raw || "").trim();
  if (!trimmed) return emptySplit();

  let working = trimmed.replace(/[\u00A0\u200B]/g, " ").replace(/\s+/g, " ").trim();

  // Convert 00xx international prefix to +xx
  if (working.startsWith("00")) {
    working = `+${working.slice(2)}`;
  }

  const digitsOnly = working.replace(/\D/g, "");
  if (!digitsOnly) return emptySplit();

  const hasPlus = working.startsWith("+") || /^\(\+\d/.test(working);

  if (!hasPlus) {
    return {
      countryCode: "",
      countryName: "",
      countryIso: "",
      localNumber: digitsOnly,
    };
  }

  for (const code of DIAL_CODES_LONGEST_FIRST) {
    if (!digitsOnly.startsWith(code)) continue;
    const local = digitsOnly.slice(code.length);
    if (local.length < 4) continue;
    const country = findCountryByDialCode(`+${code}`);
    return {
      countryCode: `+${code}`,
      countryName: country?.name || "",
      countryIso: country?.iso || "",
      localNumber: local,
    };
  }

  // Unknown +NNN — keep first 1–3 digits as dial code guess, rest as local.
  const guess = digitsOnly.slice(0, Math.min(3, Math.max(1, digitsOnly.length - 7)));
  const local = digitsOnly.slice(guess.length);
  if (local.length >= 4) {
    return {
      countryCode: `+${guess}`,
      countryName: "",
      countryIso: "",
      localNumber: local,
    };
  }

  return {
    countryCode: "",
    countryName: "",
    countryIso: "",
    localNumber: digitsOnly,
  };
}

export function composePhoneNumber(countryCode: string, localNumber: string): string {
  const local = (localNumber || "").replace(/\D/g, "");
  if (!local) return "";
  const cc = (countryCode || "").trim().replace(/[^\d+]/g, "");
  if (!cc) return local;
  const ccDigits = cc.replace(/\D/g, "");
  if (!ccDigits) return local;
  if (local.startsWith(ccDigits)) return `+${local}`;
  return `+${ccDigits}${local}`;
}

export function resolveCountryFromCode(countryCode: string): CountryOption | undefined {
  return findCountryByDialCode(countryCode);
}

export function searchCountries(query: string): CountryOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter((c) => {
    const hay = `${c.name} ${c.dialCode} ${c.iso}`.toLowerCase();
    return hay.includes(q) || c.dialCode.replace("+", "").includes(q.replace("+", ""));
  });
}
