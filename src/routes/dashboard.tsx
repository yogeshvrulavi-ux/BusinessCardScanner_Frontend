import { createFileRoute, redirect } from "@tanstack/react-router";

/** Dashboard removed — Capture is the post-login home. */
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/scan", replace: true });
  },
});
