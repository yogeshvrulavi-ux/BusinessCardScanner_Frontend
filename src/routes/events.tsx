import { createFileRoute } from "@tanstack/react-router";
import { EventsPage } from "@/pages/EventsPage";
import { AuthGate } from "@/components/auth/AuthGate";
import { z } from "zod";

const eventsSearchSchema = z.object({
  event: z.string().optional().catch(""),
});

export const Route = createFileRoute("/events")({
  validateSearch: eventsSearchSchema,
  head: () => ({
    meta: [
      { title: "Events · CardSync AI" },
      {
        name: "description",
        content: "Browse event folders and view leads collected at each event.",
      },
    ],
  }),
  component: EventsRoutePage,
});

function EventsRoutePage() {
  return (
    <AuthGate allowedRoles={["ADMIN", "USER"]}>
      <EventsPage />
    </AuthGate>
  );
}
