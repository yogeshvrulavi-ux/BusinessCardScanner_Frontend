import { createFileRoute } from "@tanstack/react-router";
import { RegisterInvitePage } from "@/pages/RegisterInvitePage";

type RegisterSearch = {
  token?: string;
};

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Register · NameCardScan" },
      { name: "description", content: "Accept your invitation and create your account." },
    ],
  }),
  component: RegisterInvitePage,
});
