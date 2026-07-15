import { createFileRoute } from "@tanstack/react-router";
import { CompaniesPage } from "@/pages/CompaniesPage";

export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Companies · CardSync AI" },
      {
        name: "description",
        content: "Manage companies and their admin accounts.",
      },
    ],
  }),
  component: CompaniesPage,
});
