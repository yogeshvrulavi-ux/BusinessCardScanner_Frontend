import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionPage } from "@/pages/SubscriptionPage";

export const Route = createFileRoute("/subscription")({
  head: () => ({
    meta: [
      { title: "Subscription · NameCardScan" },
      {
        name: "description",
        content: "Compare Freemium, Starter, Builder, Growth, and Enterprise plans.",
      },
    ],
  }),
  component: SubscriptionPage,
});
