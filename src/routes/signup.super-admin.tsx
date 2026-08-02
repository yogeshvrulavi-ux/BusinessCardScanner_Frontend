import { createFileRoute } from "@tanstack/react-router";
import { SuperAdminSignupPage } from "@/pages/signup/SuperAdminSignupPage";

export const Route = createFileRoute("/signup/super-admin")({
  head: () => ({
    meta: [{ title: "Super Admin signup · NameCardScan" }],
  }),
  component: SuperAdminSignupPage,
});
