import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Preferences · CardSync AI" },
      {
        name: "description",
        content: "Profile, notifications, terms, privacy, cookies, and device data for your workspace.",
      },
      { property: "og:title", content: "Preferences · CardSync AI" },
      { property: "og:description", content: "Configure your CardSync AI workspace." },
    ],
  }),
  component: SettingsPage,
});
