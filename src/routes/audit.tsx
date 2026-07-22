import { createFileRoute } from "@tanstack/react-router";
import { AuditLogsPage } from "@/pages/AuditLogsPage";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Logs · NameCardScan" },
      { name: "description", content: "System-wide audit trail." },
    ],
  }),
  component: AuditLogsPage,
});
