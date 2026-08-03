import { createFileRoute } from "@tanstack/react-router";
import { EventManagementPage } from "@/pages/EventManagementPage";

export const Route = createFileRoute("/event-management")({
  head: () => ({
    meta: [
      { title: "Event Management · NameCardScan" },
      {
        name: "description",
        content: "Create and manage events across the platform.",
      },
    ],
  }),
  component: EventManagementPage,
});
