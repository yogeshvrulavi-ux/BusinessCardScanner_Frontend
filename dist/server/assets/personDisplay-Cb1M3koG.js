function clean(value) {
  return String(value ?? "").trim();
}
function resolvePersonFullName(input) {
  const fromFull = clean(input.fullName) || clean(input.name);
  if (fromFull) return fromFull;
  return [clean(input.firstName), clean(input.lastName)].filter(Boolean).join(" ").trim();
}
function formatPersonDisplay(input) {
  const fullName = resolvePersonFullName(input);
  if (fullName) return fullName;
  const designation = clean(input.designation) || clean(input.title);
  if (designation) return designation;
  const email = clean(input.email);
  if (email) return email;
  return "";
}
function personInitials(input, fallback = "?") {
  const label = formatPersonDisplay(input);
  if (!label) return fallback;
  if (label.includes("@")) {
    return label.slice(0, 2).toUpperCase();
  }
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || fallback;
}
export {
  formatPersonDisplay as f,
  personInitials as p
};
