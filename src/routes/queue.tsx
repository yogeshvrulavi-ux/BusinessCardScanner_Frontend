import { createFileRoute } from "@tanstack/react-router";
import { QueuePage } from "@/pages/QueuePage";
import { AuthGate } from "@/components/auth/AuthGate";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Sync queue · NameCardScan" },
      {
        name: "description",
        content: "Review and save contacts captured offline or awaiting sync on this device.",
      },
    ],
  }),
  component: QueueRoutePage,
});

function QueueRoutePage() {
  return (
    <AuthGate allowedRoles={["SUPER_ADMIN", "ADMIN", "USER"]}>
      <QueuePage />
    </AuthGate>
  );
}
