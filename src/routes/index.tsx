import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · NameCardScan" },
      { name: "description", content: "Capture business cards with on-device OCR." },
      { property: "og:title", content: "Capture · NameCardScan" },
      { property: "og:description", content: "Upload or photograph a business card to extract contact details." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/scan", replace: true });
  },
});
