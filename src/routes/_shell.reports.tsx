import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/features/reports/pages/reports-page";

export const Route = createFileRoute("/_shell/reports")({
  head: () => ({
    meta: [
      { title: "Rapports — SolidCare" },
      { name: "description", content: "Indicateurs opérationnels de la clinique." },
    ],
  }),
  component: ReportsPage,
});
