import { createFileRoute } from "@tanstack/react-router";
import { InvitationsPage } from "@/pages/InvitationsPage";

export const Route = createFileRoute("/invitations")({
  head: () => ({
    meta: [
      { title: "Invitations · CardSync AI" },
      { name: "description", content: "Manage invitation-based onboarding." },
    ],
  }),
  component: InvitationsPage,
});
