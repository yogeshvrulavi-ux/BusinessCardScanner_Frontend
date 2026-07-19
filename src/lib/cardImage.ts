export type LeadPayload = {
  fullName: string;
  firstName?: string;
  lastName?: string;
  designation: string;
  company: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  secondaryEmail?: string;
  website: string;
  secondaryWebsite?: string;
  address: string;
  secondaryAddress?: string;
  socialLinks?: string;
  gstNumber?: string;
  notes?: string;
  /** Event where this card was collected (required on save). */
  eventName?: string;
  /** Client-side event id from local event list. */
  eventId?: string;
  /** Scan metadata (Google Sheets reporting only; not stored in PostgreSQL). */
  ocrEngine?: string;
  ocrConfidence?: number;
  captureSource?: string;
};

/** Prefer a real data URL for persistence — never send blob: URLs to the API. */
export function resolvePersistableImageDataUrl(
  previewUrl?: string | null,
  savedScanImage?: string | null,
): string | undefined {
  const candidates = [savedScanImage, previewUrl].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (candidate.startsWith("data:image/")) return candidate;
  }
  return undefined;
}

export async function resolveCardImageFile(
  file: File | null,
  previewUrl: string,
  dataUrl: string,
): Promise<File | null> {
  if (file) return file;
  const src = resolvePersistableImageDataUrl(previewUrl, dataUrl) || previewUrl || dataUrl;
  if (!src?.startsWith("data:")) return null;

  const response = await fetch(src);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  const ext = type.includes("png") ? "png" : "jpg";
  return new File([blob], `business-card.${ext}`, { type });
}

export function buildContactBody(payload: LeadPayload) {
  return {
    name: payload.fullName,
    fullName: payload.fullName,
    firstName: payload.firstName || "",
    lastName: payload.lastName || "",
    designation: payload.designation,
    company: payload.company,
    phone: payload.phone,
    secondaryPhone: payload.secondaryPhone || "",
    email: payload.email,
    secondaryEmail: payload.secondaryEmail || "",
    website: payload.website,
    secondaryWebsite: payload.secondaryWebsite || "",
    address: payload.address,
    secondaryAddress: payload.secondaryAddress || "",
    socialLinks: payload.socialLinks || "",
    gstNumber: payload.gstNumber || "",
    notes: payload.notes || "",
    eventName: payload.eventName || "",
    eventId: payload.eventId || "",
    source: "scan",
  };
}

export async function buildContactFormData(
  payload: LeadPayload,
  imageFile: File | null,
): Promise<FormData> {
  const formData = new FormData();
  formData.append("contact", JSON.stringify(buildContactBody(payload)));
  if (imageFile) {
    formData.append("card", imageFile);
  }
  return formData;
}
