import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · NameCardScan" },
      { name: "description", content: "Manage your NameCardScan subscription and storage." },
      { property: "og:title", content: "Subscription · NameCardScan" },
      { property: "og:description", content: "Plan, storage, and upgrades for your workspace." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/subscription", replace: true });
  },
});
