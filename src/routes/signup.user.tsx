import { createFileRoute } from "@tanstack/react-router";
import { UserSignupPage } from "@/pages/signup/UserSignupPage";

export const Route = createFileRoute("/signup/user")({
  head: () => ({
    meta: [{ title: "User signup · NameCardScan" }],
  }),
  component: UserSignupPage,
});
