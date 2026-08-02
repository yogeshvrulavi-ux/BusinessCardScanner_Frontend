import { createFileRoute } from "@tanstack/react-router";
import { SignupHubPage } from "@/pages/signup/SignupHubPage";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Sign up · NameCardScan" }],
  }),
  component: SignupHubPage,
});
