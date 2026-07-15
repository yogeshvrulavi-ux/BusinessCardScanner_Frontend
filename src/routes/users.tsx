import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/pages/UsersPage";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users · CardSync AI" },
      {
        name: "description",
        content: "Manage users across companies.",
      },
    ],
  }),
  component: UsersPage,
});
