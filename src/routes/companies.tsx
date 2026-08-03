import { createFileRoute } from "@tanstack/react-router";
import { CompaniesPage } from "@/pages/CompaniesPage";

export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Manage Team · NameCardScan" },
      {
        name: "description",
        content: "Invite and manage company Admins.",
      },
    ],
  }),
  component: CompaniesPage,
});
