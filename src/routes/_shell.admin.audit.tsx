import { createFileRoute } from "@tanstack/react-router";
import { AuditPage } from "@/features/audit/pages/audit-page";

export const Route = createFileRoute("/_shell/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit — SolidCare" },
      { name: "description", content: "Journal d'audit des actions sensibles." },
    ],
  }),
  component: AuditPage,
});
