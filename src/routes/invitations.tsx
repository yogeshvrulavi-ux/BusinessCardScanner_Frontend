import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Standalone Invitation Management was removed as a duplicate of
 * Admin Management / User Management invite actions.
 * Deep links to /invitations land on User Management.
 * Invitation APIs remain available for InviteUserModal.
 */
export const Route = createFileRoute("/invitations")({
  beforeLoad: () => {
    throw redirect({ to: "/users" });
  },
});
