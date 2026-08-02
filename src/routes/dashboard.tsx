import { createFileRoute, redirect } from "@tanstack/react-router";

/** Dashboard removed — Subscription is the post-login home. */
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/subscription", replace: true });
  },
});
