/** Shared navigation and product copy (sidebar, page titles, document meta). */
export const PRODUCT_TAGLINE = "Intelligent lead capture";

export const NAV_SECTION_LABEL = "Menu";

export const NAV = {
  capture: { label: "Capture a card", path: "/scan" as const },
  contacts: { label: "Contacts List", path: "/contacts" as const },
  events: { label: "Events", path: "/events" as const },
  syncQueue: { label: "Offline Queue System", path: "/queue" as const },
  preferences: { label: "Settings & Preferences", path: "/settings" as const },
} as const;

export const PAGE = {
  capture: {
    title: "Capture a card",
    description:
      "Upload or photograph a business card. On-device OCR extracts contact details in seconds.",
  },
  contacts: {
    title: "Contact Lists",
    description: "Search, filter, and manage every lead saved on this device.",
  },
  events: {
    title: "Events",
    description: "Open an event folder to see leads and sync stats for that event.",
  },
  syncQueue: {
    title: "Sync queue",
    description:
      "Review cards awaiting save. Offline captures are held here until you are back online.",
  },
  preferences: {
    title: "Preferences",
    description: "Profile, notifications, legal policies, cookies, and device data.",
  },
} as const;
