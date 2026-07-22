import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mic, Square } from "lucide-react";
import { leadFields } from "@/constants/formFields";
import { useUpload } from "@/hooks/useUpload";
import { useForm } from "@/hooks/useForm";
import { useToast } from "@/hooks/useToast";
import { PageContainer } from "@/components/layout/PageContainer";
import { Navbar } from "@/components/layout/Navbar";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/common/Card";
import { UploadZone } from "@/components/upload/UploadZone";
import { ImagePreview } from "@/components/preview/ImagePreview";
import { OCRPreview } from "@/components/preview/OCRPreview";
import { FormSection } from "@/components/form/FormSection";
import { FormGrid } from "@/components/form/FormGrid";
import { FormRow } from "@/components/form/FormRow";
import { FieldRenderer } from "@/components/form/FieldRenderer";
import { FieldClearButton } from "@/components/form/inputs/BaseInput";
import { FormActions } from "@/components/form/FormActions";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/common/Button";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ExtractedValuePicker,
  createPickerItems,
  resolvePickerValues,
  type PickerItem,
} from "@/components/review/ExtractedValuePicker";
import {
  DuplicateResolutionModal,
  type DuplicateAction,
} from "@/components/review/DuplicateResolutionModal";
import {
  buildContactBody,
  resolveCardImageFile,
  resolvePersistableImageDataUrl,
  type LeadPayload,
} from "@/lib/cardImage";
import { isOfflineMode, getConnectionMode } from "@/lib/connectionMode";
import { pickPrimaryEmail } from "@/lib/contactEmail";
import {
  checkStorageHealth,
  saveContact,
  updateContact,
  storageLabel,
} from "@/lib/contactStorage";
import { checkForDuplicates, type DuplicateMatch } from "@/lib/duplicateDetection";
import { notifyOutreachAfterSync } from "@/lib/outreachFeedback";
import { loadUserSettings } from "@/lib/settingsStorage";
import { emptyScanContact, parseScanContact } from "@/lib/scanResult";
import { scanFileAndStore } from "@/lib/scanPipeline";
import { loadScanSession, readFileAsDataUrl, dataUrlToFile, isEmptyScanContact } from "@/lib/scanSession";
import { EventNameCombobox } from "@/components/review/EventNameCombobox";
import { loadEvents, resolveEventForSave } from "@/lib/eventStorage";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";

const initialValues = leadFields.reduce<Record<string, string>>((acc, field) => {
  acc[field.name] = "";
  return acc;
}, {});

const fieldByName = new Map(leadFields.map((field) => [field.name, field]));

type FieldSlot = { name: string; span?: 1 | 2 };

/** Collapsed layout: primary fields only, two per row, address full width. */
const collapsedLayout: FieldSlot[] = [
  { name: "fullName" },
  { name: "firstName" },
  { name: "lastName" },
  { name: "designation" },
  { name: "companyName" },
  { name: "phoneNumber" },
  { name: "emailAddress" },
  { name: "website" },
  { name: "address", span: 2 },
];

/**
 * Expanded layout: each secondary field sits beside its related primary field
 * (phone next to phone, email next to email, etc.) instead of a separate section.
 */
const expandedLayout: FieldSlot[] = [
  { name: "fullName" },
  { name: "firstName" },
  { name: "lastName" },
  { name: "designation" },
  { name: "companyName", span: 2 },
  { name: "phoneNumber" },
  { name: "secondaryPhoneNumber" },
  { name: "emailAddress" },
  { name: "secondaryEmailAddress" },
  { name: "website" },
  { name: "secondaryWebsite" },
  { name: "address", span: 1 },
  { name: "secondaryAddress", span: 1 },
  { name: "socialLinks", span: 2 },
  { name: "gstNumber" },
];

type PickerState = {
  phones: PickerItem[];
  emails: PickerItem[];
  websites: PickerItem[];
  addresses: PickerItem[];
  social: PickerItem[];
};

const emptyPickers = (): PickerState => ({
  phones: [],
  emails: [],
  websites: [],
  addresses: [],
  social: [],
});

function syncEditedPickerValue(
  items: PickerItem[],
  role: "primary" | "secondary",
  value: string,
): PickerItem[] {
  const trimmed = value.trim();
  const roleIndex = items.findIndex((item) => item.role === role);

  if (!trimmed) {
    return roleIndex >= 0 ? items.filter((_, index) => index !== roleIndex) : items;
  }

  const withoutDuplicate = items.filter(
    (item, index) => index === roleIndex || item.value.trim() !== trimmed,
  );
  const adjustedIndex = withoutDuplicate.findIndex((item) => item.role === role);
  if (adjustedIndex >= 0) {
    return withoutDuplicate.map((item, index) =>
      index === adjustedIndex
        ? { ...item, value: trimmed, included: true, role }
        : item,
    );
  }

  return [...withoutDuplicate, { value: trimmed, included: true, role }];
}

export const ReviewPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const eventInputRef = useRef<HTMLInputElement>(null);
  const eventNameRef = useRef("");
  const pendingPayloadRef = useRef<LeadPayload | null>(null);
  const pendingImageRef = useRef<File | null>(null);
  const autoExtractedRef = useRef(false);
  const scanMetaRef = useRef<{
    ocrEngine?: string;
    ocrConfidence?: number;
    captureSource?: string;
  }>({});

  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedScanImage, setSavedScanImage] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pickers, setPickers] = useState<PickerState>(emptyPickers);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  // Event assignment is optional — always start blank, never prefill a default.
  const [eventName, setEventName] = useState("");
  const [eventError, setEventError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const notesRef = useRef("");
  const { success, error, info } = useToast();
  const { confirm } = useConfirmModal();
  const speech = useSpeechToText({
    onUnsupported: () => info("Speech-to-text is not supported in this browser. Use Chrome or Edge."),
    onError: (message) => {
      if (message === "not-allowed") {
        error("Microphone permission denied. Allow mic access to dictate notes.");
      } else {
        info("Could not capture speech. Try again or type your notes.");
      }
    },
  });
  const upload = useUpload();
  const form = useForm(leadFields, initialValues);

  const applyPickerToForm = (next: PickerState) => {
    const phones = resolvePickerValues(next.phones);
    const emails = resolvePickerValues(next.emails);
    const websites = resolvePickerValues(next.websites);
    const addresses = resolvePickerValues(next.addresses);
    const social = resolvePickerValues(next.social);

    form.setMany({
      phoneNumber: phones.primary,
      secondaryPhoneNumber: phones.secondary,
      emailAddress: emails.primary,
      secondaryEmailAddress: emails.secondary,
      website: websites.primary,
      secondaryWebsite: websites.secondary,
      address: addresses.primary,
      secondaryAddress: addresses.secondary,
      socialLinks: social.allIncluded.join(", "),
    });
  };

  const { stopListening } = speech;

  const applyScanData = useCallback((raw: ReturnType<typeof parseScanContact>) => {
    stopListening();
    const nextPickers: PickerState = {
      phones: createPickerItems(raw.phones),
      emails: createPickerItems(raw.emails),
      websites: createPickerItems(raw.websites),
      addresses: createPickerItems(raw.addresses),
      social: createPickerItems(raw.socialLinksList),
    };
    setPickers(nextPickers);
    setConfidence(raw.confidence);

    form.setMany({
      fullName: raw.fullName,
      firstName: raw.firstName,
      lastName: raw.lastName,
      designation: raw.designation,
      companyName: raw.companyName,
      phoneNumber: raw.phoneNumber,
      secondaryPhoneNumber: raw.secondaryPhoneNumber,
      emailAddress: raw.emailAddress,
      secondaryEmailAddress: raw.secondaryEmailAddress,
      website: raw.website,
      secondaryWebsite: raw.secondaryWebsite,
      address: raw.address,
      secondaryAddress: raw.secondaryAddress,
      socialLinks: raw.socialLinks,
      gstNumber: raw.gstNumber,
    });
  }, [form.setMany, stopListening]);

  const loadFromSession = useCallback(() => {
    const { contact, imageDataUrl, meta } = loadScanSession();
    if (imageDataUrl) setSavedScanImage(imageDataUrl);
    if (contact) applyScanData(parseScanContact(contact));
    setOcrWarning(meta?.ocrWarning ?? null);
    scanMetaRef.current = {
      ocrEngine: meta?.ocrEngine,
      ocrConfidence: meta?.ocrConfidence,
      captureSource: meta?.captureSource,
    };
  }, [applyScanData]);

  const handleFormChange = (name: string, value: string) => {
    form.setValue(name, value);

    const pickerTarget: Record<
      string,
      { key: "phones" | "emails"; role: "primary" | "secondary" }
    > = {
      phoneNumber: { key: "phones", role: "primary" },
      secondaryPhoneNumber: { key: "phones", role: "secondary" },
      emailAddress: { key: "emails", role: "primary" },
      secondaryEmailAddress: { key: "emails", role: "secondary" },
    };
    const target = pickerTarget[name];
    if (target) {
      setPickers((current) => ({
        ...current,
        [target.key]: syncEditedPickerValue(
          current[target.key],
          target.role,
          value,
        ),
      }));
    }

    if (name === "firstName" || name === "lastName") {
      const first = name === "firstName" ? value : form.values.firstName;
      const last = name === "lastName" ? value : form.values.lastName;
      const combined = [first, last].filter(Boolean).join(" ").trim();
      if (combined) form.setValue("fullName", combined);
    }
  };

  const settings = loadUserSettings();
  const primaryPhone = form.values.phoneNumber.trim();

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const handleNotesChange = (value: string) => {
    if (speech.listening) speech.stopListening();
    setNotes(value.slice(0, speech.maxLength));
  };

  const handleNotesDictation = () => {
    speech.toggleListening(notesRef.current, (value) => setNotes(value));
  };

  const clearExtractedFields = async () => {
    const confirmed = await confirm({
      title: "Clear all extracted data?",
      description:
        "Are you sure you want to clear all extracted data?\nThe scanned image will remain available.",
      confirmLabel: "Clear",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (!confirmed) return;

    speech.stopListening();
    form.reset(initialValues);
    setPickers(emptyPickers());
    setConfidence({});
    setOcrWarning(null);
    setDuplicateMatch(null);
    setShowDuplicateModal(false);
    pendingPayloadRef.current = null;
    pendingImageRef.current = null;
    // Replace the stored scan result so cleared fields do not rehydrate,
    // and block the auto-OCR retry from re-filling them on this visit.
    autoExtractedRef.current = true;
    sessionStorage.setItem("latestScanResult", JSON.stringify(emptyScanContact()));
    info("Extracted fields cleared. The scanned image was kept.");
  };
  const whatsappTemplateOnSave =
    settings.whatsappNotificationsEnabled &&
    typeof navigator !== "undefined" &&
    navigator.onLine &&
    !isOfflineMode();
  const saveHint =
    whatsappTemplateOnSave && !primaryPhone
      ? "Add a phone number to send the approved WhatsApp template on save."
      : whatsappTemplateOnSave
        ? "On save, your business number sends the approved WhatsApp template to this phone."
        : undefined;

  const resolvedFullName =
    form.values.fullName.trim() ||
    [form.values.firstName, form.values.lastName].filter(Boolean).join(" ").trim();

  const hasDetectedName = Boolean(resolvedFullName);

  const [scanRevision, setScanRevision] = useState(0);

  useEffect(() => {
    eventNameRef.current = eventName ?? "";
  }, [eventName]);

  useEffect(() => {
    loadFromSession();
    const onScanUpdated = () => {
      loadFromSession();
      setScanRevision((n) => n + 1);
    };
    window.addEventListener("cs-scan-updated", onScanUpdated);
    return () => window.removeEventListener("cs-scan-updated", onScanUpdated);
  }, [loadFromSession]);

  const readEventName = () => {
    const fromInput = eventInputRef.current?.value?.trim();
    if (fromInput) {
      eventNameRef.current = fromInput;
      return fromInput;
    }
    return (eventNameRef.current || eventName || "").trim();
  };

  const updatePicker = (key: keyof PickerState, items: PickerItem[]) => {
    const next = { ...pickers, [key]: items };
    setPickers(next);
    applyPickerToForm(next);
  };  

  const runExtraction = async (file: File, captureSourceOverride?: string) => {
    setIsExtracting(true);
    try {
      const captureSource =
        captureSourceOverride || scanMetaRef.current.captureSource || undefined;
      if (captureSource) {
        scanMetaRef.current = { ...scanMetaRef.current, captureSource };
      }
      const dataUrl = await readFileAsDataUrl(file);
      setSavedScanImage(dataUrl);
      const result = await scanFileAndStore(
        file,
        dataUrl,
        undefined,
        captureSource,
      );
      const { contact, ocrWarning: warning } = result;
      scanMetaRef.current = {
        ...scanMetaRef.current,
        ocrEngine: result.ocrEngine,
        ocrConfidence: result.ocrConfidence,
      };
      applyScanData(parseScanContact(contact));
      setOcrWarning(warning ?? null);
      if (warning) {
        info(warning);
      } else {
        success("OCR extraction complete. Review and verify all fields.");
      }
    } catch (err) {
      console.error(err);
      info("Could not extract text. Enter contact details manually.");
      setPickers(emptyPickers());
      setConfidence({});
    } finally {
      setIsExtracting(false);
    }
  };

  // Re-run OCR when a card image exists but extraction was skipped (e.g. previous offline bug).
  useEffect(() => {
    if (autoExtractedRef.current || isExtracting) return;

    const { contact, imageDataUrl } = loadScanSession();
    if (!imageDataUrl || !isEmptyScanContact(contact)) return;

    autoExtractedRef.current = true;
    void (async () => {
      try {
        const file = await dataUrlToFile(imageDataUrl, "scanned-card.jpg");
        await runExtraction(file);
      } catch (err) {
        console.error("Auto OCR retry failed:", err);
        autoExtractedRef.current = false;
      }
    })();
  }, [scanRevision, isExtracting]);

  const buildPayload = (eventOverride?: string): LeadPayload => {
    const trimmedEvent = (eventOverride ?? readEventName()).trim();
    const existingEvent = loadEvents().find(
      (event) => event.name.toLowerCase() === trimmedEvent.toLowerCase(),
    );

    return {
      fullName: resolvedFullName,
      firstName: form.values.firstName,
      lastName: form.values.lastName,
      designation: form.values.designation,
      company: form.values.companyName,
      phone: form.values.phoneNumber,
      secondaryPhone: form.values.secondaryPhoneNumber,
      email:
        form.values.emailAddress.trim() ||
        form.values.secondaryEmailAddress.trim(),
      secondaryEmail: form.values.secondaryEmailAddress,
      website: form.values.website,
      secondaryWebsite: form.values.secondaryWebsite,
      address: form.values.address,
      secondaryAddress: form.values.secondaryAddress,
      socialLinks: form.values.socialLinks,
      gstNumber: form.values.gstNumber,
      notes: notes.trim(),
      eventName: trimmedEvent,
      eventId: existingEvent?.id,
      ocrEngine: scanMetaRef.current.ocrEngine,
      ocrConfidence: scanMetaRef.current.ocrConfidence,
      captureSource: scanMetaRef.current.captureSource,
    };
  };

  const finishAfterSave = () => {
    sessionStorage.removeItem("latestScanResult");
    navigate({ to: "/contacts" });
  };

  const outreachSkipWhatsApp = (settingsSnapshot = loadUserSettings()) =>
    !settingsSnapshot.whatsappNotificationsEnabled;

  const persistContact = async (
    payload: LeadPayload,
    imageFile: File | null,
    existingId?: string,
    merge = false,
  ) => {
    // Prefer the real data URL from OCR/session. Never persist blob: object URLs.
    let imageDataUrl = resolvePersistableImageDataUrl(upload.previewUrl, savedScanImage);
    if (!imageDataUrl && imageFile) {
      try {
        imageDataUrl = await readFileAsDataUrl(imageFile);
        setSavedScanImage(imageDataUrl);
      } catch {
        imageDataUrl = undefined;
      }
    }
    const storageUp = await checkStorageHealth();
    const label = storageLabel();

    if (storageUp) {
      let contactId = existingId;

      if (existingId) {
        const updatePayload =
          merge && duplicateMatch
            ? {
                ...payload,
                phone: payload.phone || String(duplicateMatch.contact.phone || ""),
                email: payload.email || String(duplicateMatch.contact.email || ""),
                website: payload.website || String(duplicateMatch.contact.website || ""),
                address: payload.address || String(duplicateMatch.contact.address || ""),
              }
            : payload;
        await updateContact(existingId, updatePayload, imageDataUrl);

        if (!isOfflineMode() && navigator.onLine) {
          // Backend handles CRM sync transparently
        }
      } else {
        const settingsSnapshot = loadUserSettings();
        const mode = getConnectionMode();
        const saved = await saveContact(payload, imageDataUrl, {
          connectionMode: mode,
          skipWhatsApp: outreachSkipWhatsApp(settingsSnapshot),
          skipEmail:
            !settingsSnapshot.emailNotificationsEnabled || !pickPrimaryEmail(payload),
        });
        contactId = saved.id;

        if (saved.queued) {
          info("Saved to queue. Will sync to database automatically when you're online.");
          sessionStorage.removeItem("latestScanResult");
          navigate({ to: "/queue" });
          return;
        }

        const syncDoneOnSave =
          Boolean(saved.id) || Boolean(saved.error);

        if (syncDoneOnSave) {
          if (saved.error) {
            success(`Saved to ${label}.`);
            error(`Sync failed: ${saved.error}. Use Sync on Contacts.`);
          } else {
            success("Saved and synced to database.");
          }
        } else if (saved.queued) {
          info("Sync failed — contact queued on device. Retry when online.");
        } else {
          success(`Saved to ${label}.`);
        }

      }

      if (existingId) {
        success(`Contact updated in ${label}.`);
      }

      finishAfterSave();
      return;
    }

    const settingsSnapshot = loadUserSettings();
    const mode = getConnectionMode();
    const saved = await saveContact(payload, imageDataUrl, {
      connectionMode: mode,
      skipWhatsApp: outreachSkipWhatsApp(settingsSnapshot),
      skipEmail:
        !settingsSnapshot.emailNotificationsEnabled || !pickPrimaryEmail(payload),
    });
    info("Saved to browser queue. Will sync when storage is available.");
    sessionStorage.removeItem("latestScanResult");
    navigate({ to: "/queue" });
  };

  const executeSave = async (action: DuplicateAction = "new") => {
    if (action === "discard") {
      setShowDuplicateModal(false);
      setDuplicateMatch(null);
      return;
    }

    const payload = buildPayload();
    pendingPayloadRef.current = payload;
    const imageFile = pendingImageRef.current;

    setIsSaving(true);
    try {
      if (action === "update" && duplicateMatch?.contact.id) {
        await persistContact(payload, imageFile, duplicateMatch.contact.id, false);
      } else if (action === "merge" && duplicateMatch?.contact.id) {
        await persistContact(payload, imageFile, duplicateMatch.contact.id, true);
      } else {
        await persistContact(payload, imageFile);
      }
    } catch (saveError) {
      console.error(saveError);
      error(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setIsSaving(false);
      setShowDuplicateModal(false);
      setDuplicateMatch(null);
    }
  };

  const saveLead = async () => {
    const fullName = resolvedFullName;
    if (!fullName) {
      error("Please enter a name before saving.");
      return;
    }

    const trimmedEvent = readEventName().trim();
    setEventError(null);

    if (!form.validate({ fullName })) {
      error("Please resolve validation errors before saving.");
      return;
    }

    if (!form.values.fullName.trim()) {
      form.setValue("fullName", fullName);
    }

    const savedEvent = resolveEventForSave(trimmedEvent);
    setEventName(savedEvent.eventName);
    eventNameRef.current = savedEvent.eventName;

    const payload = buildPayload(savedEvent.eventName);
    const mode = getConnectionMode();

    console.info("[Review save]", {
      eventNameInput: eventInputRef.current?.value,
      eventNameState: eventName,
      eventNameResolved: savedEvent.eventName,
      connectionMode: mode,
      navigatorOnLine: typeof navigator !== "undefined" ? navigator.onLine : null,
      payloadEventName: payload.eventName,
    });

    const imageFile = await resolveCardImageFile(upload.file, upload.previewUrl, savedScanImage);
    pendingPayloadRef.current = payload;
    pendingImageRef.current = imageFile;

    const { duplicates } = await checkForDuplicates(payload);
    if (duplicates.length > 0) {
      setDuplicateMatch(duplicates[0]);
      setShowDuplicateModal(true);
      return;
    }

    await executeSave("new");
  };

  const renderFieldSlot = ({ name, span }: FieldSlot) => {
    const field = fieldByName.get(name);
    if (!field) return null;
    const spansBoth = span === 2 || (span === undefined && field.component === "TextAreaInput");
    return (
      <FormRow key={field.name} className={spansBoth ? "md:col-span-2" : ""}>
        <FieldRenderer
          field={field}
          value={form.values[field.name] || ""}
          error={form.errors[field.name]}
          confidence={field.confidenceKey ? confidence[field.confidenceKey] : undefined}
          onChange={handleFormChange}
        />
      </FormRow>
    );
  };

  const hasMultiValues =
    pickers.phones.length > 1 ||
    pickers.emails.length > 1 ||
    pickers.websites.length > 1 ||
    pickers.addresses.length > 1 ||
    pickers.social.length > 1;

  return (
    <PageContainer>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            upload.onFileSelect(file);
            void runExtraction(file, "Upload");
          }
        }}
      />
      <Navbar
        title="Review & Save Contact"
        subtitle="Verify extracted fields, then save. In Online mode, contacts sync to the database automatically."
      />
      <AppLayout
        left={
          <>
            <Card className="rounded-sm">
              {upload.previewUrl || savedScanImage ? (
                <ImagePreview
                  src={upload.previewUrl || savedScanImage}
                  fileName={upload.file?.name || "Scanned card"}
                  onClear={() => {
                    upload.clear();
                    setSavedScanImage("");
                    sessionStorage.removeItem("latestScanImage");
                  }}
                />
              ) : (
                <UploadZone
                  isDragging={isDragging}
                  error={upload.error}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      upload.onFileSelect(file);
                      void runExtraction(file, "Upload");
                    }
                  }}
                  onPick={() => inputRef.current?.click()}
                />
              )}
              <div className="mt-4 flex gap-2">
                <Button variantType="secondary" className="h-11 flex-1 rounded-md" onClick={() => setCameraOpen(true)}>
                  Use camera
                </Button>
                <Button variantType="secondary" className="h-11 flex-1 rounded-md" onClick={() => navigate({ to: "/scan" })}>
                  Retake scan
                </Button>
              </div>
            </Card>
            <Card className="rounded-sm">
              <EventNameCombobox
                ref={eventInputRef}
                value={eventName ?? ""}
                onChange={(next) => {
                  const value = next ?? "";
                  eventNameRef.current = value;
                  setEventName(value);
                  if (value.trim()) setEventError(null);
                }}
                error={eventError || undefined}
              />

              <div className="mt-5 border-t border-border/60 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">Extracted preview</h3>
                  {isExtracting ? <LoadingSpinner label="Extracting…" /> : null}
                </div>
                <OCRPreview values={form.values} />
              </div>

              <div className="mt-5 border-t border-border/60 pt-5">
                <div className="space-y-2">
                  <Label htmlFor="contact-notes" className="text-sm font-medium text-foreground">
                    Notes
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="contact-notes"
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Type your notes here..."
                      maxLength={2000}
                      className={cn(
                        "min-h-32 resize-none rounded-md border-border/60 bg-background pb-12 pl-3.5 pr-14 pt-3.5 text-sm leading-relaxed shadow-sm transition-[border-color,box-shadow]",
                        speech.listening && "border-red-300/80 ring-2 ring-red-200/60 dark:border-red-900/60 dark:ring-red-950/40",
                      )}
                    />
                    <FieldClearButton
                      onClear={() => handleNotesChange("")}
                      disabled={notes.length === 0}
                      className="right-2 top-2"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 rounded-b-md bg-gradient-to-t from-background via-background/95 to-transparent px-3.5 pb-2.5 pt-6">
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {speech.listening ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-sm bg-red-500" />
                            Listening…
                          </span>
                        ) : (
                          <>{notes.length}/2000</>
                        )}
                      </span>
                      {speech.supported ? (
                        <button
                          type="button"
                          onClick={handleNotesDictation}
                          aria-pressed={speech.listening}
                          aria-label={speech.listening ? "Stop dictating notes" : "Dictate notes"}
                          className={cn(
                            "pointer-events-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border shadow-sm transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            speech.listening
                              ? "border-red-200 bg-red-500 text-white hover:bg-red-600 dark:border-red-800 dark:bg-red-600 dark:hover:bg-red-500"
                              : "border-border/70 bg-muted/80 text-muted-foreground hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-sky-300",
                          )}
                        >
                          {speech.listening ? (
                            <Square className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Notes are not filled from the card scan. Tap the mic to dictate; saved to the Notes field below the event name.
                  </p>
                </div>
              </div>
            </Card>
          </>
        }
        right={
          <Card className="h-full rounded-sm">
            {(ocrWarning || !hasDetectedName) && (
              <div className="mb-5 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                {ocrWarning ? (
                  <>
                    <p className="font-medium">OCR could not read this card</p>
                    <p className="mt-1 text-amber-800/90 dark:text-amber-100/90">{ocrWarning}</p>
                    <p className="mt-2 text-xs opacity-90">
                      Browser OCR runs automatically when the server cannot read the card. You can also edit all fields manually below.
                    </p>
                  </>
                ) : (
                  <p>
                    No name detected from the scan. Type the name in Full Name (or First + Last Name) before saving.
                  </p>
                )}
              </div>
            )}

            <FormSection
              title="Basic Information"
              className="pb-5"
              action={
                <Button
                  type="button"
                  variantType={showAdvancedFields ? "secondary" : "secondary"}
                  onClick={() => setShowAdvancedFields((prev) => !prev)}
                  className="h-8 rounded-md px-3 text-xs font-medium"
                >
                  {showAdvancedFields ? "Hide optional fields" : "Show optional fields"}
                </Button>
              }
            >
              <FormGrid>
                {(showAdvancedFields ? expandedLayout : collapsedLayout).map(renderFieldSlot)}
              </FormGrid>
            </FormSection>

            {hasMultiValues && (
              <FormSection
                title="Select primary & secondary values"
                className="border-t border-border/60 pb-5 pt-5"
              >
                <p className="mb-4 text-xs text-muted-foreground">
                  Check values to include. Mark one as Primary and optionally one as Secondary. Uncheck to discard.
                </p>
                <div className="space-y-5">
                  {pickers.phones.length > 1 && (
                    <ExtractedValuePicker label="Phone numbers" items={pickers.phones} onChange={(items) => updatePicker("phones", items)} />
                  )}
                  {pickers.emails.length > 1 && (
                    <ExtractedValuePicker label="Email addresses" items={pickers.emails} onChange={(items) => updatePicker("emails", items)} />
                  )}
                  {pickers.websites.length > 1 && (
                    <ExtractedValuePicker label="Websites" items={pickers.websites} onChange={(items) => updatePicker("websites", items)} />
                  )}
                  {pickers.addresses.length > 1 && (
                    <ExtractedValuePicker label="Addresses" items={pickers.addresses} onChange={(items) => updatePicker("addresses", items)} />
                  )}
                  {pickers.social.length > 1 && (
                    <ExtractedValuePicker label="Social media links" items={pickers.social} onChange={(items) => updatePicker("social", items)} />
                  )}
                </div>
              </FormSection>
            )}

            <p className="mb-1 mt-2 text-xs text-muted-foreground">
              Save syncs to the database when online. Event name and notes are stored in the contact record.
            </p>
            <FormActions
              onClear={() => void clearExtractedFields()}
              clearDisabled={isSaving || isExtracting}
              onReset={() => {
                sessionStorage.removeItem("latestScanResult");
                navigate({ to: "/scan" });
              }}
              onSave={saveLead}
              saving={isSaving}
              saveHint={saveHint}
            />
          </Card>
        }
      />

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          upload.onFileSelect(file);
          void runExtraction(file, "Camera");
        }}
      />

      <DuplicateResolutionModal
        open={showDuplicateModal}
        match={duplicateMatch}
        incoming={pendingPayloadRef.current ?? buildPayload()}
        onResolve={executeSave}
      />

    </PageContainer>
  );
};
