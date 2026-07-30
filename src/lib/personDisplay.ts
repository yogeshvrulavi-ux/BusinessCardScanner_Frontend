/**
 * Consistent person labels across admin, users, contacts, and activity UIs.
 *
 * Priority: Full Name → Designation → Email
 * Never use Company Name as the primary identity for a person.
 */

export type PersonDisplayInput = {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  designation?: string | null;
  title?: string | null;
  email?: string | null;
  /** @deprecated Company must never be the primary person label. Ignored. */
  companyName?: string | null;
};

function clean(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

/** Build a display full name from explicit full name or first+last parts. */
export function resolvePersonFullName(input: PersonDisplayInput): string {
  const fromFull = clean(input.fullName) || clean(input.name);
  if (fromFull) return fromFull;
  return [clean(input.firstName), clean(input.lastName)].filter(Boolean).join(" ").trim();
}

/**
 * Primary label for a person (admin, user, inviter, capturer, actor).
 * Company name is intentionally never used.
 */
export function formatPersonDisplay(input: PersonDisplayInput): string {
  const fullName = resolvePersonFullName(input);
  if (fullName) return fullName;

  const designation = clean(input.designation) || clean(input.title);
  if (designation) return designation;

  const email = clean(input.email);
  if (email) return email;

  return "";
}

/** Initials for avatars — derived from the same display priority. */
export function personInitials(input: PersonDisplayInput, fallback = "?"): string {
  const label = formatPersonDisplay(input);
  if (!label) return fallback;
  if (label.includes("@")) {
    return label.slice(0, 2).toUpperCase();
  }
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || fallback;
}
