import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/pages/UsersPage";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User Management · NameCardScan" },
      {
        name: "description",
        content: "Invite and manage users across companies.",
      },
    ],
  }),
  component: UsersPage,
});
  