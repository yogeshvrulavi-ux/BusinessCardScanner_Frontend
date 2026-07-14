import { createFileRoute } from "@tanstack/react-router";
import { ScanPage } from "@/pages/ScanPage";

function ScanRoutePending() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6 px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10">
      <div className="h-28 rounded-2xl bg-muted/50" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-96 rounded-2xl bg-muted/50 lg:col-span-3" />
        <div className="h-96 rounded-2xl bg-muted/50 lg:col-span-2" />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/scan")({
  pendingMs: 0,
  pendingComponent: ScanRoutePending,
  head: () => ({
    meta: [
      { title: "Capture a card · CardSync AI" },
      {
        name: "description",
        content:
          "Photograph or upload a business card. On-device OCR extracts contact details in seconds.",
      },
      { property: "og:title", content: "Capture a card · CardSync AI" },
      {
        property: "og:description",
        content: "Turn business cards into structured leads with intelligent on-device capture.",
      },
    ],
  }),
  component: ScanPage,
});
