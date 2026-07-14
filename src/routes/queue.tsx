import { createFileRoute } from "@tanstack/react-router";
import { QueuePage } from "@/pages/QueuePage";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Sync queue · CardSync AI" },
      {
        name: "description",
        content: "Review and save contacts captured offline or awaiting sync on this device.",
      },
    ],
  }),
  component: QueuePage,
});
