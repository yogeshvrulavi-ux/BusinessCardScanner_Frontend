import { createFileRoute } from "@tanstack/react-router";
import { AdminSignupPage } from "@/pages/signup/AdminSignupPage";

export const Route = createFileRoute("/signup/admin")({
  head: () => ({
    meta: [{ title: "Admin signup · NameCardScan" }],
  }),
  component: AdminSignupPage,
});
