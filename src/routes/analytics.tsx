import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "@/pages/InsightsPage";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Insights · NameCardScan" },
      { name: "description", content: "Contact capture analytics and team performance." },
    ],
  }),
  component: InsightsPage,
});
