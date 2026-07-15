import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useMemo, useCallback, forwardRef, useId, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, CheckCircle2, Loader2, Check, X, Square, Mic } from "lucide-react";
import { toast } from "sonner";
import { h as cn, B as Button$1, I as Input, w as listStoredContacts, x as listEventNames, y as getExampleEventName, r as getLastUsedEventName, j as loadUserSettings, z as isOfflineMode, E as resolveEventForSave, p as getConnectionMode, F as loadEvents, G as checkStorageHealth, H as storageLabel, J as updateContact, K as pickPrimaryEmail, L as syncContactToZohoStorage, M as saveContact } from "./router-ZM5rT6gC.js";
import { L as Label, D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./label-DfA3np1i.js";
import { C as CONFIDENCE_LOW_THRESHOLD, p as parseScanContact, s as scanFileAndStore } from "./scanPipeline-LsgFENuC.js";
import { CameraCapture } from "./CameraCapture-CEJcQ6nL.js";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { l as loadScanSession, a as isEmptyScanContact, d as dataUrlToFile, r as readFileAsDataUrl } from "./scanSession-HtX0cjGm.js";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@radix-ui/react-tooltip";
import "idb";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-alert-dialog";
import "zod";
import "@radix-ui/react-label";
import "tesseract.js";
import "./cardFrameAnalysis-CC6Q9daB.js";
import "react-webcam";
const leadFields = [
  { label: "Full Name", name: "fullName", type: "text", component: "TextInput", required: true, placeholder: "Enter full name", section: "basic", confidenceKey: "fullName" },
  { label: "First Name", name: "firstName", type: "text", component: "TextInput", placeholder: "First name", section: "basic", confidenceKey: "firstName" },
  { label: "Last Name", name: "lastName", type: "text", component: "TextInput", placeholder: "Last name", section: "basic", confidenceKey: "lastName" },
  { label: "Designation", name: "designation", type: "text", component: "TextInput", placeholder: "Job title", section: "basic", confidenceKey: "designation" },
  { label: "Company Name", name: "companyName", type: "text", component: "TextInput", required: true, placeholder: "Company", section: "company", confidenceKey: "companyName" },
  { label: "Primary Phone", name: "phoneNumber", type: "tel", component: "PhoneInput", required: true, placeholder: "Mobile or phone", section: "contact", confidenceKey: "phoneNumber" },
  { label: "Secondary Phone", name: "secondaryPhoneNumber", type: "tel", component: "PhoneInput", placeholder: "Optional second number", section: "contact" },
  { label: "Primary Email", name: "emailAddress", type: "email", component: "EmailInput", required: true, placeholder: "Email address", section: "contact", confidenceKey: "emailAddress" },
  { label: "Secondary Email", name: "secondaryEmailAddress", type: "email", component: "EmailInput", placeholder: "Optional second email", section: "contact" },
  { label: "Primary Website", name: "website", type: "url", component: "UrlInput", placeholder: "Website URL", section: "company", confidenceKey: "website" },
  { label: "Secondary Website", name: "secondaryWebsite", type: "url", component: "UrlInput", placeholder: "Additional website", section: "company" },
  { label: "Primary Address", name: "address", type: "text", component: "TextAreaInput", placeholder: "Street, city, state", section: "contact", confidenceKey: "address" },
  { label: "Secondary Address", name: "secondaryAddress", type: "text", component: "TextAreaInput", placeholder: "Additional address", section: "contact" },
  { label: "Social Media Links", name: "socialLinks", type: "text", component: "TextAreaInput", placeholder: "LinkedIn, Twitter, etc.", section: "extra" },
  { label: "GST / Tax Number", name: "gstNumber", type: "text", component: "TextInput", placeholder: "GST, PAN, TIN", section: "extra", confidenceKey: "gstNumber" }
];
const useUpload = () => {
  const [state, setState] = useState({ file: null, previewUrl: "", error: "" });
  const onFileSelect = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) return setState((prev) => ({ ...prev, error: "Upload JPG or PNG image only." }));
    if (file.size > 10 * 1024 * 1024) return setState((prev) => ({ ...prev, error: "File should be under 10MB." }));
    setState({ file, previewUrl: URL.createObjectURL(file), error: "" });
  };
  const clear = () => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setState({ file: null, previewUrl: "", error: "" });
  };
  return useMemo(() => ({ ...state, onFileSelect, clear }), [state]);
};
const validationRules = {
  required: (value) => value.trim().length > 0,
  email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => !value || /^\+?[0-9()\-\s]{7,20}$/.test(value),
  url: (value) => !value || /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/.test(value)
};
const validateField = (field, value) => {
  if (field.required && !validationRules.required(value)) return `${field.label} is required.`;
  if (field.component === "EmailInput" && !validationRules.email(value)) return "Please enter a valid email address.";
  if (field.component === "PhoneInput" && !validationRules.phone(value)) return "Please enter a valid phone number.";
  if (field.component === "UrlInput" && !validationRules.url(value)) return "Please enter a valid website URL.";
  return "";
};
const useForm = (fields, initialValues2) => {
  const [values, setValues] = useState(initialValues2);
  const [errors, setErrors] = useState({});
  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);
  const setMany = useCallback((next) => {
    setValues((prev) => ({ ...prev, ...next }));
  }, []);
  const validate = useCallback((overrides) => {
    let nextErrors = {};
    setValues((current) => {
      const merged = overrides ? { ...current, ...overrides } : current;
      nextErrors = fields.reduce((acc, field) => {
        const message = validateField(field, merged[field.name] || "");
        if (message) acc[field.name] = message;
        return acc;
      }, {});
      return current;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [fields]);
  return useMemo(
    () => ({ values, errors, setValue, setMany, validate }),
    [values, errors, setValue, setMany, validate]
  );
};
const useToast = () => ({
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast.info(message)
});
const PageContainer = ({ children }) => /* @__PURE__ */ jsx("section", { className: "mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8", children });
const Navbar = ({ title, subtitle }) => /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-col gap-1.5", children: [
  /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-[#1e3a5f] md:text-[1.75rem]", children: title }),
  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: subtitle })
] });
const AppLayout = ({ left, right }) => /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2 lg:items-stretch", children: [
  /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-6", children: left }),
  /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-6", children: right })
] });
const Card = ({ children, className = "" }) => /* @__PURE__ */ jsx("div", { className: cn("rounded-3xl border border-border/50 bg-card p-5 shadow-soft md:p-6", className), children });
const classes = {
  primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95",
  secondary: "border border-sky-200/80 bg-sky-50 text-slate-700 hover:bg-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  outline: "border border-border/60 bg-transparent hover:bg-muted/60",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
};
const Button = ({ className, variantType = "primary", ...props }) => /* @__PURE__ */ jsx(Button$1, { className: cn("rounded-xl", classes[variantType], className), ...props });
const UploadZone = ({ isDragging, error, onDragOver, onDragLeave, onDrop, onPick }) => /* @__PURE__ */ jsxs("div", { onDragOver, onDragLeave, onDrop, className: `rounded-sm border-2 border-dashed p-8 text-center transition ${isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`, children: [
  /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-sm bg-gradient-primary text-primary-foreground", children: /* @__PURE__ */ jsx(Upload, { className: "h-5 w-5" }) }),
  /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Drag and drop business card" }),
  /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "PNG/JPG up to 10MB" }),
  /* @__PURE__ */ jsx(Button, { className: "mt-5 rounded-sm", onClick: onPick, children: "Choose image" }),
  error ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-destructive", children: error }) : null
] });
const ImagePreview = ({
  src,
  onClear
}) => /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
  /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-sm border border-border/50 bg-muted/10", children: /* @__PURE__ */ jsx("img", { src, alt: "Business card preview", className: "h-auto max-h-64 w-full object-contain" }) }),
  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Scanned card" }),
    /* @__PURE__ */ jsx(Button, { variantType: "danger", className: "h-8 rounded-sm px-3 text-xs", onClick: onClear, children: "Remove" })
  ] })
] });
const EmptyState = ({ icon, title, description }) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center", children: [
  icon && /* @__PURE__ */ jsx("div", { className: "mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary", children: icon }),
  /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: title }),
  /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: description })
] });
const HIDDEN_PREVIEW_FIELDS = /* @__PURE__ */ new Set(["notes", "firstName", "lastName", "secondaryAddress"]);
const OCRPreview = ({ values }) => {
  const entries = Object.entries(values).filter(
    ([key, value]) => Boolean(value) && !HIDDEN_PREVIEW_FIELDS.has(key)
  );
  if (entries.length === 0)
    return /* @__PURE__ */ jsx(
      EmptyState,
      {
        title: "No OCR data yet",
        description: "Upload an image to preview extracted text fields."
      }
    );
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    entries.map(([key, value]) => /* @__PURE__ */ jsxs("p", { className: "text-sm leading-relaxed", children: [
      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: key }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: ": " }),
      /* @__PURE__ */ jsx("span", { className: "text-foreground", children: value })
    ] }, key)),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 inline-flex items-center gap-2 text-sm text-success", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }),
      " OCR extraction ready"
    ] })
  ] });
};
const FormSection = ({
  title,
  children,
  className
}) => /* @__PURE__ */ jsxs("section", { className: cn("space-y-4", className), children: [
  /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground", children: title }),
  children
] });
const FormGrid = ({ children }) => /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children });
const FormRow = ({ children, className }) => /* @__PURE__ */ jsx("div", { className: cn("space-y-1.5", className), children });
const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
const BaseInput = ({ as = "input", value, placeholder, type = "text", onChange }) => {
  if (as === "textarea") {
    return /* @__PURE__ */ jsx(
      Textarea,
      {
        value,
        placeholder,
        onChange: (e) => onChange(e.target.value),
        className: "min-h-24 resize-none rounded-sm border-border/60 bg-background"
      }
    );
  }
  return /* @__PURE__ */ jsx(
    Input,
    {
      value,
      placeholder,
      type,
      onChange: (e) => onChange(e.target.value),
      className: "h-11 rounded-sm border-border/60 bg-background"
    }
  );
};
const TextInput = (props) => /* @__PURE__ */ jsx(BaseInput, { ...props, type: "text" });
const EmailInput = (props) => /* @__PURE__ */ jsx(BaseInput, { ...props, type: "email" });
const PhoneInput = (props) => /* @__PURE__ */ jsx(BaseInput, { ...props, type: "tel" });
const UrlInput = (props) => /* @__PURE__ */ jsx(BaseInput, { ...props, type: "url" });
const TextAreaInput = (props) => /* @__PURE__ */ jsx(BaseInput, { ...props, as: "textarea" });
const ValidationMessage = ({ message }) => message ? /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: message }) : null;
const componentMap = { TextInput, EmailInput, PhoneInput, UrlInput, TextAreaInput };
const FieldRenderer = ({
  field,
  value,
  error,
  confidence,
  onChange
}) => {
  const Component = componentMap[field.component];
  const isLow = confidence !== void 0 && confidence > 0 && confidence < CONFIDENCE_LOW_THRESHOLD;
  const showConfidence = confidence !== void 0 && confidence > 0;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "space-y-1.5",
        isLow && "rounded-sm border border-amber-500/40 bg-amber-500/5 p-2"
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium text-foreground", children: field.label }),
          showConfidence && /* @__PURE__ */ jsxs(
            "span",
            {
              className: cn(
                "text-[10px] font-semibold tabular-nums",
                isLow ? "text-amber-600 dark:text-amber-400" : "text-success"
              ),
              children: [
                Math.round(confidence),
                "% ",
                isLow ? "· verify" : ""
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Component,
          {
            value,
            placeholder: field.placeholder,
            onChange: (next) => onChange(field.name, next)
          }
        ),
        /* @__PURE__ */ jsx(ValidationMessage, { message: error })
      ]
    }
  );
};
const FormActions = ({
  onReset,
  onSave,
  saving,
  saveDisabled,
  saveHint
}) => /* @__PURE__ */ jsxs("div", { className: "sticky bottom-0 z-20 mt-6 space-y-3 bg-background/90 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:static sm:bg-transparent sm:p-0", children: [
  saveHint ? /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-700 dark:text-amber-300", children: saveHint }) : null,
  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
    /* @__PURE__ */ jsx(Button, { variantType: "secondary", className: "min-w-[7rem] flex-1 rounded-sm sm:flex-none", onClick: onReset, children: "Discard" }),
    /* @__PURE__ */ jsx(
      Button,
      {
        variantType: "primary",
        className: "min-w-[7rem] flex-1 rounded-sm sm:flex-none",
        onClick: onSave,
        disabled: saving || saveDisabled,
        children: saving ? "Saving..." : "Save Lead"
      }
    )
  ] })
] });
const LoadingSpinner = ({ label = "Loading..." }) => /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 text-sm text-muted-foreground", children: [
  /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
  /* @__PURE__ */ jsx("span", { children: label })
] });
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(CheckboxPrimitive.Indicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
function createPickerItems(values) {
  const unique = [...new Set(values.filter(Boolean))];
  if (unique.length === 0) return [];
  return unique.map((value, index) => ({
    value,
    included: true,
    role: index === 0 ? "primary" : "none"
  }));
}
function resolvePickerValues(items) {
  const included = items.filter((i) => i.included);
  const primary = included.find((i) => i.role === "primary")?.value || included[0]?.value || "";
  const secondary = included.find((i) => i.role === "secondary")?.value || "";
  return { primary, secondary, allIncluded: included.map((i) => i.value) };
}
function setPrimary(items, index) {
  return items.map((item, i) => {
    if (i === index) return { ...item, included: true, role: "primary" };
    if (item.role === "primary") return { ...item, role: "none" };
    return item;
  });
}
function setSecondary(items, index) {
  return items.map((item, i) => {
    if (i === index) return { ...item, included: true, role: "secondary" };
    if (item.role === "secondary") return { ...item, role: "none" };
    return item;
  });
}
function discardItem(items, index) {
  const next = items.map((item, i) => {
    if (i !== index) return item;
    return { ...item, included: false, role: "none" };
  });
  const included = next.filter((i) => i.included);
  if (included.length === 0) return next;
  const hasPrimary = included.some((i) => i.role === "primary");
  if (!hasPrimary) {
    const firstIdx = next.findIndex((i) => i.included);
    if (firstIdx >= 0) next[firstIdx] = { ...next[firstIdx], role: "primary" };
  }
  return next;
}
function toggleIncluded(items, index) {
  const next = items.map((item, i) => {
    if (i !== index) return item;
    const included2 = !item.included;
    return { ...item, included: included2, role: included2 ? item.role : "none" };
  });
  const included = next.filter((i) => i.included);
  if (included.length === 0) return next;
  const hasPrimary = included.some((i) => i.role === "primary");
  if (!hasPrimary) {
    const firstIdx = next.findIndex((i) => i.included);
    if (firstIdx >= 0) next[firstIdx] = { ...next[firstIdx], role: "primary" };
  }
  return next;
}
function ExtractedValuePicker({ label, items, onChange }) {
  if (items.length === 0) return null;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-sm font-semibold", children: label }),
      /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-muted-foreground", children: [
        items.length,
        " detected"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: items.map((item, index) => /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "rounded-sm border px-3 py-2.5 transition-colors",
          !item.included ? "border-border/40 bg-muted/10 opacity-50" : "border-border/60 bg-muted/20"
        ),
        children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex cursor-pointer items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                checked: item.included,
                onCheckedChange: () => onChange(toggleIncluded(items, index))
              }
            ),
            /* @__PURE__ */ jsx("span", { className: cn("text-sm font-medium", !item.included && "line-through text-muted-foreground"), children: item.value })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5 pl-6 sm:pl-0", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => onChange(setPrimary(items, index)),
                className: cn(
                  "rounded-sm px-2 py-1 text-[11px] font-medium",
                  item.role === "primary" ? "bg-primary text-primary-foreground" : "bg-background/60 text-muted-foreground hover:bg-background"
                ),
                children: "Primary"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => onChange(setSecondary(items, index)),
                className: cn(
                  "rounded-sm px-2 py-1 text-[11px] font-medium",
                  item.role === "secondary" ? "bg-violet-500 text-white" : "bg-background/60 text-muted-foreground hover:bg-background"
                ),
                children: "Secondary"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => onChange(discardItem(items, index)),
                className: "inline-flex h-7 w-7 items-center justify-center rounded-sm border border-destructive/50 bg-destructive/5 text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50",
                disabled: !item.included,
                "aria-label": "Discard value",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            )
          ] })
        ] })
      },
      `${item.value}-${index}`
    )) })
  ] });
}
const Modal = ({ open, onOpenChange, title, description, children }) => /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "rounded-2xl", children: [
  /* @__PURE__ */ jsxs(DialogHeader, { children: [
    /* @__PURE__ */ jsx(DialogTitle, { children: title }),
    description ? /* @__PURE__ */ jsx(DialogDescription, { children: description }) : null
  ] }),
  children
] }) });
function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}
function findDuplicatesLocally(contacts, payload) {
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = normalizePhone(payload.phone || "");
  const name = String(payload.fullName || "").trim().toLowerCase();
  const company = String(payload.company || "").trim().toLowerCase();
  const duplicates = [];
  const seen = /* @__PURE__ */ new Set();
  for (const contact of contacts) {
    const id = String(contact.id || "");
    if (!id || seen.has(id)) continue;
    const matchedBy = [];
    const cEmail = String(contact.email || "").trim().toLowerCase();
    const cPhone = normalizePhone(String(contact.phone || ""));
    const cName = String(contact.fullName || contact.name || "").trim().toLowerCase();
    const cCompany = String(contact.company || "").trim().toLowerCase();
    if (email && cEmail && email === cEmail) matchedBy.push("email");
    if (phone && cPhone && phone === cPhone) matchedBy.push("phone");
    if (name && company && cName === name && cCompany === company) matchedBy.push("name_company");
    if (matchedBy.length > 0) {
      seen.add(id);
      duplicates.push({ contact, matchedBy });
    }
  }
  return duplicates;
}
async function checkForDuplicates(payload) {
  const contacts = await listStoredContacts();
  return { duplicates: findDuplicatesLocally(contacts, payload) };
}
function diffContacts(existing, incoming) {
  const fields = [
    { key: "fullName", label: "Name", existingKey: "fullName" },
    { key: "designation", label: "Designation" },
    { key: "company", label: "Company" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
    { key: "address", label: "Address" }
  ];
  return fields.map(({ key, label, existingKey }) => {
    const ex = String(existing[existingKey || key] || existing.name || "").trim();
    const inc = String(incoming[key] || "").trim();
    if (!ex && !inc) return null;
    if (ex === inc) return null;
    return { field: label, existing: ex || "—", incoming: inc || "—" };
  }).filter(Boolean);
}
function DuplicateResolutionModal({
  open,
  match,
  incoming,
  onResolve
}) {
  if (!match) return null;
  const existing = match.contact;
  const diffs = diffContacts(existing, incoming);
  const name = existing.fullName || existing.name || "Existing contact";
  return /* @__PURE__ */ jsx(
    Modal,
    {
      open,
      onOpenChange: (next) => !next && onResolve("discard"),
      title: "Possible duplicate found",
      description: `A contact matching this card already exists (${match.matchedBy.join(", ")}).`,
      children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-sm border border-border/60 bg-muted/20 p-3 text-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: name }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: existing.company })
        ] }),
        diffs.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Differences" }),
          diffs.map((d) => /* @__PURE__ */ jsxs("div", { className: "rounded-sm border border-border/40 p-2 text-xs", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: d.field }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Existing: " }),
                d.existing
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Scanned: " }),
                d.incoming
              ] })
            ] })
          ] }, d.field))
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Scanned data matches the existing record closely." }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(Button, { variantType: "secondary", className: "rounded-sm", onClick: () => onResolve("update"), children: "Update existing" }),
          /* @__PURE__ */ jsx(Button, { variantType: "secondary", className: "rounded-sm", onClick: () => onResolve("merge"), children: "Merge contact" }),
          /* @__PURE__ */ jsx(Button, { className: "rounded-sm", onClick: () => onResolve("new"), children: "Save as new" }),
          /* @__PURE__ */ jsx(Button, { variantType: "secondary", className: "rounded-sm", onClick: () => onResolve("discard"), children: "Discard" })
        ] })
      ] })
    }
  );
}
async function resolveCardImageFile(file, previewUrl, dataUrl) {
  if (file) return file;
  const src = previewUrl || dataUrl;
  if (!src?.startsWith("data:")) return null;
  const response = await fetch(src);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  const ext = type.includes("png") ? "png" : "jpg";
  return new File([blob], `business-card.${ext}`, { type });
}
function notifyOutreachAfterSync(settings, result) {
  if (!result) return;
  if (settings.emailNotificationsEnabled) {
    const sent = result.emailSent || Boolean(result.emailTo && !result.emailError);
    if (sent) {
      const to = result.emailTo || result.emailExtracted || "contact";
      const extracted = result.emailExtracted;
      const deliveredToExtracted = extracted && to && String(to).trim().toLowerCase() === String(extracted).trim().toLowerCase();
      if (deliveredToExtracted) {
        toast.success(`Thank-you email sent to ${to}.`);
      } else if (extracted) {
        toast.success(
          `Thank-you email sent (dev test inbox: ${to}). Card email: ${extracted}.`
        );
      } else {
        toast.success(`Thank-you email sent to ${to}.`);
      }
    } else if (result.emailSkipped) {
      toast.info("Email skipped — enable Email follow-ups in Settings.");
    } else if (result.emailError) {
      toast.error(`Email not sent: ${result.emailError}`);
    } else if (!result.emailExtracted) {
      toast.error(
        "Email not sent: add an email on the Review page (check the Email field is filled and included in the picker)."
      );
    }
  }
  if (settings.whatsappNotificationsEnabled) {
    if (result.whatsappSent) {
      const to = result.whatsappTo ? ` to ${result.whatsappTo}` : "";
      toast.success(`WhatsApp template sent${to}.`);
    } else if (result.whatsappError) {
      toast.error(`WhatsApp not sent: ${result.whatsappError}`);
    } else {
      toast.warning("WhatsApp send status unknown — check backend logs.");
    }
  }
}
const EventNameCombobox = forwardRef(
  function EventNameCombobox2({ value, onChange, error, disabled = false }, ref) {
    const listId = useId();
    const eventNames = listEventNames();
    return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("label", { htmlFor: listId, className: "text-sm font-medium text-foreground", children: [
        "Event name ",
        /* @__PURE__ */ jsx("span", { className: "font-normal text-muted-foreground", children: "(optional)" })
      ] }),
      /* @__PURE__ */ jsx(
        Input,
        {
          ref,
          id: listId,
          name: "eventName",
          type: "text",
          list: eventNames.length > 0 ? `${listId}-events` : void 0,
          value,
          onChange: (e) => onChange(e.target.value),
          placeholder: `Type event name (e.g. ${getExampleEventName()})`,
          disabled,
          autoComplete: "off",
          className: cn(
            "h-11 rounded-sm border-border/60 bg-background",
            error && "border-destructive/60"
          )
        }
      ),
      eventNames.length > 0 ? /* @__PURE__ */ jsx("datalist", { id: `${listId}-events`, children: eventNames.map((name) => /* @__PURE__ */ jsx("option", { value: name }, name)) }) : null,
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Optional. When set, saved to Zoho Features as Event name. Events page groups leads by this event." }),
      error ? /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: error }) : null
    ] });
  }
);
const NOTES_MAX_LENGTH = 2e3;
function createSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}
function joinDictation(base, spoken) {
  const left = base.trimEnd();
  const right = spoken.trimStart();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}
function capNotes(text) {
  return text.slice(0, NOTES_MAX_LENGTH);
}
function useSpeechToText(options = {}) {
  const lang = options.lang ?? "en-IN";
  const maxLength = options.maxLength ?? NOTES_MAX_LENGTH;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const baseTextRef = useRef("");
  const sessionFinalRef = useRef("");
  const onTextRef = useRef(() => {
  });
  const onUnsupportedRef = useRef(options.onUnsupported);
  const onErrorRef = useRef(options.onError);
  useEffect(() => {
    onUnsupportedRef.current = options.onUnsupported;
    onErrorRef.current = options.onError;
  }, [options.onUnsupported, options.onError]);
  useEffect(() => {
    setSupported(createSpeechRecognition() !== null);
  }, []);
  const publishDisplayText = useCallback((interim = "") => {
    const spoken = joinDictation(sessionFinalRef.current, interim);
    onTextRef.current(capNotes(joinDictation(baseTextRef.current, spoken)));
  }, []);
  const commitSessionToBase = useCallback(() => {
    if (!sessionFinalRef.current.trim()) return;
    baseTextRef.current = capNotes(joinDictation(baseTextRef.current, sessionFinalRef.current));
    sessionFinalRef.current = "";
    onTextRef.current(baseTextRef.current);
  }, []);
  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    commitSessionToBase();
    recognitionRef.current?.stop();
  }, [commitSessionToBase]);
  const startListening = useCallback(
    (baseText, onText) => {
      const recognition = createSpeechRecognition();
      if (!recognition) {
        onUnsupportedRef.current?.();
        return;
      }
      recognitionRef.current?.abort();
      recognitionRef.current = recognition;
      baseTextRef.current = baseText;
      sessionFinalRef.current = "";
      onTextRef.current = onText;
      listeningRef.current = true;
      setListening(true);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.onresult = (event) => {
        if (!listeningRef.current) return;
        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript ?? "";
          if (!transcript) continue;
          if (result.isFinal) {
            sessionFinalRef.current = joinDictation(sessionFinalRef.current, transcript);
          } else {
            interim = joinDictation(interim, transcript);
          }
        }
        publishDisplayText(interim);
      };
      recognition.onerror = (event) => {
        if (event.error === "aborted" || event.error === "no-speech") return;
        onErrorRef.current?.(event.error);
        stopListening();
      };
      recognition.onend = () => {
        if (!listeningRef.current) return;
        commitSessionToBase();
        try {
          recognition.start();
        } catch {
          stopListening();
        }
      };
      try {
        recognition.start();
      } catch {
        onErrorRef.current?.("microphone-unavailable");
        stopListening();
      }
    },
    [commitSessionToBase, lang, publishDisplayText, stopListening]
  );
  useEffect(() => () => recognitionRef.current?.abort(), []);
  const toggleListening = useCallback(
    (baseText, onText) => {
      if (listeningRef.current) {
        stopListening();
        return;
      }
      startListening(baseText, onText);
    },
    [startListening, stopListening]
  );
  return {
    listening,
    supported,
    maxLength,
    startListening,
    stopListening,
    toggleListening
  };
}
const sectionMap = {
  basic: "Basic Information",
  contact: "Contact Information",
  company: "Company Information",
  extra: "Additional Details"
};
const initialValues = leadFields.reduce((acc, field) => {
  acc[field.name] = "";
  return acc;
}, {});
const emptyPickers = () => ({
  phones: [],
  emails: [],
  websites: [],
  addresses: [],
  social: []
});
const ReviewPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const eventInputRef = useRef(null);
  const eventNameRef = useRef("");
  const pendingPayloadRef = useRef(null);
  const pendingImageRef = useRef(null);
  const autoExtractedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedScanImage, setSavedScanImage] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pickers, setPickers] = useState(emptyPickers);
  const [confidence, setConfidence] = useState({});
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [ocrWarning, setOcrWarning] = useState(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [eventName, setEventName] = useState(() => getLastUsedEventName() || "");
  const [eventError, setEventError] = useState(null);
  const [notes, setNotes] = useState("");
  const notesRef = useRef("");
  const { success, error, info } = useToast();
  const speech = useSpeechToText({
    onUnsupported: () => info("Speech-to-text is not supported in this browser. Use Chrome or Edge."),
    onError: (message) => {
      if (message === "not-allowed") {
        error("Microphone permission denied. Allow mic access to dictate notes.");
      } else {
        info("Could not capture speech. Try again or type your notes.");
      }
    }
  });
  const upload = useUpload();
  const form = useForm(leadFields, initialValues);
  const applyPickerToForm = (next) => {
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
      socialLinks: social.allIncluded.join(", ")
    });
  };
  const { stopListening } = speech;
  const applyScanData = useCallback((raw) => {
    stopListening();
    const nextPickers = {
      phones: createPickerItems(raw.phones),
      emails: createPickerItems(raw.emails),
      websites: createPickerItems(raw.websites),
      addresses: createPickerItems(raw.addresses),
      social: createPickerItems(raw.socialLinksList)
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
      gstNumber: raw.gstNumber
    });
  }, [form.setMany, stopListening]);
  const loadFromSession = useCallback(() => {
    const { contact, imageDataUrl, meta } = loadScanSession();
    if (imageDataUrl) setSavedScanImage(imageDataUrl);
    if (contact) applyScanData(parseScanContact(contact));
    setOcrWarning(meta?.ocrWarning ?? null);
  }, [applyScanData]);
  const handleFormChange = (name, value) => {
    form.setValue(name, value);
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
  const handleNotesChange = (value) => {
    if (speech.listening) speech.stopListening();
    setNotes(value.slice(0, speech.maxLength));
  };
  const handleNotesDictation = () => {
    speech.toggleListening(notesRef.current, (value) => setNotes(value));
  };
  const whatsappTemplateOnSave = settings.whatsappNotificationsEnabled && typeof navigator !== "undefined" && navigator.onLine && !isOfflineMode();
  const saveHint = whatsappTemplateOnSave && !primaryPhone ? "Add a phone number to send the approved WhatsApp template on save." : whatsappTemplateOnSave ? "On save, your business number sends the approved WhatsApp template to this phone." : void 0;
  const resolvedFullName = form.values.fullName.trim() || [form.values.firstName, form.values.lastName].filter(Boolean).join(" ").trim();
  const hasDetectedName = Boolean(resolvedFullName);
  const isOptionalField = (field) => field.name === "firstName" || field.name === "lastName" || field.name.startsWith("secondary") || field.section === "extra";
  const shouldShowField = (field) => {
    if (!showAdvancedFields && isOptionalField(field)) {
      if (field.name === "firstName" || field.name === "lastName") {
        return !form.values.fullName.trim() || Boolean(form.values[field.name]);
      }
      return Boolean(form.values[field.name]);
    }
    return true;
  };
  const visibleFields = leadFields.filter(shouldShowField);
  leadFields.some(
    (field) => isOptionalField(field) && Boolean(form.values[field.name])
  );
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
  const updatePicker = (key, items) => {
    const next = { ...pickers, [key]: items };
    setPickers(next);
    applyPickerToForm(next);
  };
  const runExtraction = async (file) => {
    setIsExtracting(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSavedScanImage(dataUrl);
      const { contact, ocrWarning: warning } = await scanFileAndStore(file, dataUrl);
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
  const buildPayload = (eventOverride) => {
    const trimmedEvent = (eventOverride ?? readEventName()).trim();
    const existingEvent = loadEvents().find(
      (event) => event.name.toLowerCase() === trimmedEvent.toLowerCase()
    );
    return {
      fullName: resolvedFullName,
      firstName: form.values.firstName,
      lastName: form.values.lastName,
      designation: form.values.designation,
      company: form.values.companyName,
      phone: form.values.phoneNumber,
      secondaryPhone: form.values.secondaryPhoneNumber,
      email: form.values.emailAddress.trim() || form.values.secondaryEmailAddress.trim(),
      secondaryEmail: form.values.secondaryEmailAddress,
      website: form.values.website,
      secondaryWebsite: form.values.secondaryWebsite,
      address: form.values.address,
      secondaryAddress: form.values.secondaryAddress,
      socialLinks: form.values.socialLinks,
      gstNumber: form.values.gstNumber,
      notes: notes.trim(),
      eventName: trimmedEvent,
      eventId: existingEvent?.id
    };
  };
  const finishAfterSave = () => {
    sessionStorage.removeItem("latestScanResult");
    navigate({ to: "/contacts" });
  };
  const outreachSkipWhatsApp = (settingsSnapshot = loadUserSettings()) => !settingsSnapshot.whatsappNotificationsEnabled;
  const persistContact = async (payload, imageFile, existingId, merge = false) => {
    const imageDataUrl = upload.previewUrl || savedScanImage || void 0;
    const storageUp = await checkStorageHealth();
    const label = storageLabel();
    if (storageUp) {
      if (existingId) {
        const updatePayload = merge && duplicateMatch ? {
          ...payload,
          phone: payload.phone || String(duplicateMatch.contact.phone || ""),
          email: payload.email || String(duplicateMatch.contact.email || ""),
          website: payload.website || String(duplicateMatch.contact.website || ""),
          address: payload.address || String(duplicateMatch.contact.address || "")
        } : payload;
        await updateContact(existingId, updatePayload);
        if (!isOfflineMode() && navigator.onLine) {
          const settingsSnapshot2 = loadUserSettings();
          const skip = {
            skipWhatsApp: outreachSkipWhatsApp(settingsSnapshot2),
            skipEmail: !settingsSnapshot2.emailNotificationsEnabled || !pickPrimaryEmail(updatePayload)
          };
          try {
            const zohoResult = await syncContactToZohoStorage(
              existingId,
              skip,
              updatePayload
            );
            if (zohoResult.zohoLeadId) {
              notifyOutreachAfterSync(settingsSnapshot2, zohoResult);
            }
          } catch (zohoErr) {
            const msg = zohoErr instanceof Error ? zohoErr.message : "Zoho sync failed";
            error(`Zoho sync failed: ${msg}. Use Sync to Zoho on Contacts.`);
          }
        }
      } else {
        const settingsSnapshot2 = loadUserSettings();
        const mode2 = getConnectionMode();
        const saved2 = await saveContact(payload, imageDataUrl, {
          connectionMode: mode2,
          skipWhatsApp: outreachSkipWhatsApp(settingsSnapshot2),
          skipEmail: !settingsSnapshot2.emailNotificationsEnabled || !pickPrimaryEmail(payload)
        });
        saved2.id;
        if (saved2.queued) {
          info("Saved to queue. Will sync to Zoho CRM automatically when you're online.");
          sessionStorage.removeItem("latestScanResult");
          navigate({ to: "/queue" });
          return;
        }
        const zohoDoneOnSave = Boolean(saved2.zohoSynced) || Boolean(saved2.zohoLeadId) || Boolean(saved2.zohoError);
        if (zohoDoneOnSave) {
          if (saved2.zohoError) {
            success(`Saved to ${label}.`);
            error(`Zoho sync failed: ${saved2.zohoError}. Use Sync to Zoho on Contacts.`);
          } else if (saved2.alreadySynced) {
            success("Saved — contact is already in Zoho CRM.");
            notifyOutreachAfterSync(settingsSnapshot2, saved2);
          } else {
            success("Saved and synced to Zoho CRM.");
            notifyOutreachAfterSync(settingsSnapshot2, saved2);
          }
        } else if (saved2.queued) {
          info("Zoho sync failed — contact queued on device. Retry when online.");
        } else {
          success(`Saved to ${label}. Sync to Zoho from Contacts when online.`);
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
    await saveContact(payload, imageDataUrl, {
      connectionMode: mode,
      skipWhatsApp: outreachSkipWhatsApp(settingsSnapshot),
      skipEmail: !settingsSnapshot.emailNotificationsEnabled || !pickPrimaryEmail(payload)
    });
    info("Saved to browser queue. Will sync when storage is available.");
    sessionStorage.removeItem("latestScanResult");
    navigate({ to: "/queue" });
  };
  const executeSave = async (action = "new") => {
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
      payloadEventName: payload.eventName
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
  const groupedFields = {
    basic: visibleFields.filter((f) => f.section === "basic"),
    contact: visibleFields.filter((f) => f.section === "contact"),
    company: visibleFields.filter((f) => f.section === "company"),
    extra: visibleFields.filter((f) => f.section === "extra")
  };
  const visibleSections = Object.keys(groupedFields).filter(
    (section) => groupedFields[section].length > 0
  );
  const hasMultiValues = pickers.phones.length > 1 || pickers.emails.length > 1 || pickers.websites.length > 1 || pickers.addresses.length > 1 || pickers.social.length > 1;
  return /* @__PURE__ */ jsxs(PageContainer, { children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        className: "hidden",
        type: "file",
        accept: "image/png,image/jpeg",
        onChange: (e) => {
          const file = e.target.files?.[0];
          if (file) {
            upload.onFileSelect(file);
            runExtraction(file);
          }
        }
      }
    ),
    /* @__PURE__ */ jsx(
      Navbar,
      {
        title: "Review & Save Contact",
        subtitle: "Verify extracted fields, then save. In Online mode, contacts sync to Zoho automatically."
      }
    ),
    /* @__PURE__ */ jsx(
      AppLayout,
      {
        left: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm", children: [
            upload.previewUrl || savedScanImage ? /* @__PURE__ */ jsx(
              ImagePreview,
              {
                src: upload.previewUrl || savedScanImage,
                fileName: upload.file?.name || "Scanned card",
                onClear: () => {
                  upload.clear();
                  setSavedScanImage("");
                  sessionStorage.removeItem("latestScanImage");
                }
              }
            ) : /* @__PURE__ */ jsx(
              UploadZone,
              {
                isDragging,
                error: upload.error,
                onDragOver: (e) => {
                  e.preventDefault();
                  setIsDragging(true);
                },
                onDragLeave: (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                },
                onDrop: (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    upload.onFileSelect(file);
                    runExtraction(file);
                  }
                },
                onPick: () => inputRef.current?.click()
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-2", children: [
              /* @__PURE__ */ jsx(Button, { variantType: "secondary", className: "h-11 flex-1 rounded-sm", onClick: () => setCameraOpen(true), children: "Use camera" }),
              /* @__PURE__ */ jsx(Button, { variantType: "secondary", className: "h-11 flex-1 rounded-sm", onClick: () => navigate({ to: "/scan" }), children: "Retake scan" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm", children: [
            /* @__PURE__ */ jsx(
              EventNameCombobox,
              {
                ref: eventInputRef,
                value: eventName ?? "",
                onChange: (next) => {
                  const value = next ?? "";
                  eventNameRef.current = value;
                  setEventName(value);
                  if (value.trim()) setEventError(null);
                },
                error: eventError || void 0
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 border-t border-border/60 pt-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Extracted preview" }),
                isExtracting ? /* @__PURE__ */ jsx(LoadingSpinner, { label: "Extracting…" }) : null
              ] }),
              /* @__PURE__ */ jsx(OCRPreview, { values: form.values })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-5 border-t border-border/60 pt-5", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "contact-notes", className: "text-sm font-medium text-foreground", children: "Notes" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    id: "contact-notes",
                    value: notes,
                    onChange: (e) => handleNotesChange(e.target.value),
                    placeholder: "Type your notes here...",
                    maxLength: 2e3,
                    className: cn(
                      "min-h-32 resize-none rounded-sm border-border/60 bg-background pb-12 pl-3.5 pr-14 pt-3.5 text-sm leading-relaxed shadow-sm transition-[border-color,box-shadow]",
                      speech.listening && "border-red-300/80 ring-2 ring-red-200/60 dark:border-red-900/60 dark:ring-red-950/40"
                    )
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 rounded-b-sm bg-gradient-to-t from-background via-background/95 to-transparent px-3.5 pb-2.5 pt-6", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[11px] tabular-nums text-muted-foreground", children: speech.listening ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400", children: [
                    /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-sm bg-red-500" }),
                    "Listening…"
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    notes.length,
                    "/2000"
                  ] }) }),
                  speech.supported ? /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: handleNotesDictation,
                      "aria-pressed": speech.listening,
                      "aria-label": speech.listening ? "Stop dictating notes" : "Dictate notes",
                      className: cn(
                        "pointer-events-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border shadow-sm transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        speech.listening ? "border-red-200 bg-red-500 text-white hover:bg-red-600 dark:border-red-800 dark:bg-red-600 dark:hover:bg-red-500" : "border-border/70 bg-muted/80 text-muted-foreground hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                      ),
                      children: speech.listening ? /* @__PURE__ */ jsx(Square, { className: "h-3.5 w-3.5 fill-current" }) : /* @__PURE__ */ jsx(Mic, { className: "h-4 w-4" })
                    }
                  ) : null
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Notes are not filled from the card scan. Tap the mic to dictate; saved to Zoho Features below the event name." })
            ] }) })
          ] })
        ] }),
        right: /* @__PURE__ */ jsxs(Card, { className: "h-full rounded-sm", children: [
          hasMultiValues && /* @__PURE__ */ jsxs(FormSection, { title: "Select primary & secondary values", className: "mb-5", children: [
            /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs text-muted-foreground", children: "Check values to include. Mark one as Primary and optionally one as Secondary. Uncheck to discard." }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
              pickers.phones.length > 1 && /* @__PURE__ */ jsx(ExtractedValuePicker, { label: "Phone numbers", items: pickers.phones, onChange: (items) => updatePicker("phones", items) }),
              pickers.emails.length > 1 && /* @__PURE__ */ jsx(ExtractedValuePicker, { label: "Email addresses", items: pickers.emails, onChange: (items) => updatePicker("emails", items) }),
              pickers.websites.length > 1 && /* @__PURE__ */ jsx(ExtractedValuePicker, { label: "Websites", items: pickers.websites, onChange: (items) => updatePicker("websites", items) }),
              pickers.addresses.length > 1 && /* @__PURE__ */ jsx(ExtractedValuePicker, { label: "Addresses", items: pickers.addresses, onChange: (items) => updatePicker("addresses", items) }),
              pickers.social.length > 1 && /* @__PURE__ */ jsx(ExtractedValuePicker, { label: "Social media links", items: pickers.social, onChange: (items) => updatePicker("social", items) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(FormSection, { title: "Review fields", className: "mb-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 rounded-sm border border-sky-200/70 bg-sky-50/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/50", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-700 dark:text-slate-200", children: "Show optional fields" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variantType: showAdvancedFields ? "secondary" : "primary",
                  onClick: () => setShowAdvancedFields((prev) => !prev),
                  className: "h-10 rounded-sm px-5",
                  children: showAdvancedFields ? "Collapse optional fields" : "Show optional fields"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Tap the button to reveal extra fields only when needed, keeping the form clean and fast." })
          ] }) }),
          (ocrWarning || !hasDetectedName) && /* @__PURE__ */ jsx("div", { className: "mb-5 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100", children: ocrWarning ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium", children: "OCR could not read this card" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-amber-800/90 dark:text-amber-100/90", children: ocrWarning }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs opacity-90", children: "On Netlify, browser OCR runs automatically when the server cannot read the card. You can also edit all fields manually below." })
          ] }) : /* @__PURE__ */ jsx("p", { children: "No name detected from the scan. Type the name in Full Name (or First + Last Name) before saving." }) }),
          visibleSections.map((section, index) => /* @__PURE__ */ jsx(
            FormSection,
            {
              title: sectionMap[section],
              className: cn("pb-5", index > 0 && "border-t border-border/60 pt-5"),
              children: /* @__PURE__ */ jsx(FormGrid, { children: groupedFields[section].map((field) => /* @__PURE__ */ jsx(
                FormRow,
                {
                  className: field.component === "TextAreaInput" ? "md:col-span-2" : "",
                  children: /* @__PURE__ */ jsx(
                    FieldRenderer,
                    {
                      field,
                      value: form.values[field.name] || "",
                      error: form.errors[field.name],
                      confidence: field.confidenceKey ? confidence[field.confidenceKey] : void 0,
                      onChange: handleFormChange
                    }
                  )
                },
                field.name
              )) })
            },
            section
          )),
          /* @__PURE__ */ jsx("p", { className: "mb-1 mt-2 text-xs text-muted-foreground", children: "Save syncs to Zoho CRM when online. Event name and notes are stored in Zoho Features." }),
          /* @__PURE__ */ jsx(
            FormActions,
            {
              onReset: () => {
                sessionStorage.removeItem("latestScanResult");
                navigate({ to: "/scan" });
              },
              onSave: saveLead,
              saving: isSaving,
              saveHint
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsx(
      CameraCapture,
      {
        open: cameraOpen,
        onClose: () => setCameraOpen(false),
        onCapture: (file) => {
          upload.onFileSelect(file);
          runExtraction(file);
        }
      }
    ),
    /* @__PURE__ */ jsx(
      DuplicateResolutionModal,
      {
        open: showDuplicateModal,
        match: duplicateMatch,
        incoming: pendingPayloadRef.current ?? buildPayload(),
        onResolve: executeSave
      }
    )
  ] });
};
const SplitComponent = ReviewPage;
export {
  SplitComponent as component
};
