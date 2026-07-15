import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPage } from "@/pages/AuthPage";

export const Route = createFileRoute("/auth/$pathname")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      {
        title:
          params.pathname === "access-denied"
            ? "Access Denied · CardSync AI"
            : params.pathname === "forgot-password"
              ? "Reset password · CardSync AI"
              : "Sign in · CardSync AI",
      },
    ],
  }),
  beforeLoad: async ({ params }) => {
    if (params.pathname === "sign-out") {
      // Sign-out is handled by AuthContext logout, redirect to sign-in
      throw redirect({ to: "/auth/$pathname", params: { pathname: "sign-in" }, replace: true });
    }

    if (params.pathname === "reset-password") {
      throw redirect({ to: "/auth/$pathname", params: { pathname: "forgot-password" }, replace: true });
    }
  },
  component: AuthRoute,
});

function AuthRoute() {
  const { pathname } = Route.useParams();
  return <AuthPage pathname={pathname} />;
}
