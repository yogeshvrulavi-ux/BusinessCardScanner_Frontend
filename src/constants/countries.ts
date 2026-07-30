export type CountryOption = {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
};

/** ISO alpha-2 → regional-indicator flag emoji. */
export function flagEmoji(iso: string): string {
  const code = iso.trim().toUpperCase();
  if (code.length !== 2) return "";
  return Array.from(code)
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

const RAW_COUNTRIES: Array<{ iso: string; name: string; dialCode: string }> = [
  { iso: "IN", name: "India", dialCode: "+91" },
  { iso: "US", name: "United States", dialCode: "+1" },
  { iso: "SG", name: "Singapore", dialCode: "+65" },
  { iso: "GB", name: "United Kingdom", dialCode: "+44" },
  { iso: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { iso: "AU", name: "Australia", dialCode: "+61" },
  { iso: "CA", name: "Canada", dialCode: "+1" },
  { iso: "DE", name: "Germany", dialCode: "+49" },
  { iso: "FR", name: "France", dialCode: "+33" },
  { iso: "JP", name: "Japan", dialCode: "+81" },
  { iso: "CN", name: "China", dialCode: "+86" },
  { iso: "HK", name: "Hong Kong", dialCode: "+852" },
  { iso: "MY", name: "Malaysia", dialCode: "+60" },
  { iso: "ID", name: "Indonesia", dialCode: "+62" },
  { iso: "TH", name: "Thailand", dialCode: "+66" },
  { iso: "PH", name: "Philippines", dialCode: "+63" },
  { iso: "VN", name: "Vietnam", dialCode: "+84" },
  { iso: "KR", name: "South Korea", dialCode: "+82" },
  { iso: "TW", name: "Taiwan", dialCode: "+886" },
  { iso: "NZ", name: "New Zealand", dialCode: "+64" },
  { iso: "ZA", name: "South Africa", dialCode: "+27" },
  { iso: "NG", name: "Nigeria", dialCode: "+234" },
  { iso: "KE", name: "Kenya", dialCode: "+254" },
  { iso: "EG", name: "Egypt", dialCode: "+20" },
  { iso: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { iso: "QA", name: "Qatar", dialCode: "+974" },
  { iso: "BH", name: "Bahrain", dialCode: "+973" },
  { iso: "KW", name: "Kuwait", dialCode: "+965" },
  { iso: "OM", name: "Oman", dialCode: "+968" },
  { iso: "IL", name: "Israel", dialCode: "+972" },
  { iso: "TR", name: "Turkey", dialCode: "+90" },
  { iso: "RU", name: "Russia", dialCode: "+7" },
  { iso: "BR", name: "Brazil", dialCode: "+55" },
  { iso: "MX", name: "Mexico", dialCode: "+52" },
  { iso: "AR", name: "Argentina", dialCode: "+54" },
  { iso: "CL", name: "Chile", dialCode: "+56" },
  { iso: "CO", name: "Colombia", dialCode: "+57" },
  { iso: "ES", name: "Spain", dialCode: "+34" },
  { iso: "IT", name: "Italy", dialCode: "+39" },
  { iso: "PT", name: "Portugal", dialCode: "+351" },
  { iso: "NL", name: "Netherlands", dialCode: "+31" },
  { iso: "BE", name: "Belgium", dialCode: "+32" },
  { iso: "CH", name: "Switzerland", dialCode: "+41" },
  { iso: "AT", name: "Austria", dialCode: "+43" },
  { iso: "SE", name: "Sweden", dialCode: "+46" },
  { iso: "NO", name: "Norway", dialCode: "+47" },
  { iso: "DK", name: "Denmark", dialCode: "+45" },
  { iso: "FI", name: "Finland", dialCode: "+358" },
  { iso: "IE", name: "Ireland", dialCode: "+353" },
  { iso: "PL", name: "Poland", dialCode: "+48" },
  { iso: "CZ", name: "Czechia", dialCode: "+420" },
  { iso: "GR", name: "Greece", dialCode: "+30" },
  { iso: "RO", name: "Romania", dialCode: "+40" },
  { iso: "HU", name: "Hungary", dialCode: "+36" },
  { iso: "UA", name: "Ukraine", dialCode: "+380" },
  { iso: "PK", name: "Pakistan", dialCode: "+92" },
  { iso: "BD", name: "Bangladesh", dialCode: "+880" },
  { iso: "LK", name: "Sri Lanka", dialCode: "+94" },
  { iso: "NP", name: "Nepal", dialCode: "+977" },
  { iso: "MM", name: "Myanmar", dialCode: "+95" },
  { iso: "KH", name: "Cambodia", dialCode: "+855" },
  { iso: "LA", name: "Laos", dialCode: "+856" },
  { iso: "BN", name: "Brunei", dialCode: "+673" },
  { iso: "MV", name: "Maldives", dialCode: "+960" },
  { iso: "AF", name: "Afghanistan", dialCode: "+93" },
  { iso: "IQ", name: "Iraq", dialCode: "+964" },
  { iso: "IR", name: "Iran", dialCode: "+98" },
  { iso: "JO", name: "Jordan", dialCode: "+962" },
  { iso: "LB", name: "Lebanon", dialCode: "+961" },
  { iso: "GH", name: "Ghana", dialCode: "+233" },
  { iso: "TZ", name: "Tanzania", dialCode: "+255" },
  { iso: "UG", name: "Uganda", dialCode: "+256" },
  { iso: "ET", name: "Ethiopia", dialCode: "+251" },
  { iso: "MA", name: "Morocco", dialCode: "+212" },
  { iso: "TN", name: "Tunisia", dialCode: "+216" },
  { iso: "DZ", name: "Algeria", dialCode: "+213" },
  { iso: "PE", name: "Peru", dialCode: "+51" },
  { iso: "VE", name: "Venezuela", dialCode: "+58" },
  { iso: "EC", name: "Ecuador", dialCode: "+593" },
  { iso: "UY", name: "Uruguay", dialCode: "+598" },
  { iso: "CR", name: "Costa Rica", dialCode: "+506" },
  { iso: "PA", name: "Panama", dialCode: "+507" },
  { iso: "GT", name: "Guatemala", dialCode: "+502" },
  { iso: "DO", name: "Dominican Republic", dialCode: "+1" },
  { iso: "JM", name: "Jamaica", dialCode: "+1" },
  { iso: "TT", name: "Trinidad and Tobago", dialCode: "+1" },
  { iso: "PR", name: "Puerto Rico", dialCode: "+1" },
  { iso: "IS", name: "Iceland", dialCode: "+354" },
  { iso: "LU", name: "Luxembourg", dialCode: "+352" },
  { iso: "MT", name: "Malta", dialCode: "+356" },
  { iso: "CY", name: "Cyprus", dialCode: "+357" },
  { iso: "HR", name: "Croatia", dialCode: "+385" },
  { iso: "RS", name: "Serbia", dialCode: "+381" },
  { iso: "BG", name: "Bulgaria", dialCode: "+359" },
  { iso: "SK", name: "Slovakia", dialCode: "+421" },
  { iso: "SI", name: "Slovenia", dialCode: "+386" },
  { iso: "LT", name: "Lithuania", dialCode: "+370" },
  { iso: "LV", name: "Latvia", dialCode: "+371" },
  { iso: "EE", name: "Estonia", dialCode: "+372" },
];

export const COUNTRIES: CountryOption[] = RAW_COUNTRIES.map((country) => ({
  ...country,
  flag: flagEmoji(country.iso),
}));

/** Dial codes sorted longest-first for unambiguous matching (+971 before +97, etc.). */
export const DIAL_CODES_LONGEST_FIRST: string[] = [
  ...new Set(COUNTRIES.map((c) => c.dialCode.replace(/^\+/, ""))),
].sort((a, b) => b.length - a.length);

export function findCountryByDialCode(dialCode: string): CountryOption | undefined {
  const normalized = dialCode.trim().startsWith("+")
    ? dialCode.trim()
    : `+${dialCode.trim().replace(/\D/g, "")}`;
  // Prefer India / US / Singapore / UK when several share a dial code (+1).
  const preferred = ["IN", "US", "SG", "GB"];
  const matches = COUNTRIES.filter((c) => c.dialCode === normalized);
  if (matches.length === 0) return undefined;
  return (
    preferred.map((iso) => matches.find((c) => c.iso === iso)).find(Boolean) ||
    matches[0]
  );
}

export function findCountryByIso(iso: string): CountryOption | undefined {
  const key = iso.trim().toUpperCase();
  return COUNTRIES.find((c) => c.iso === key);
}

export function formatCountryOption(country: CountryOption): string {
  return `${country.flag} ${country.name} (${country.dialCode})`;
}
