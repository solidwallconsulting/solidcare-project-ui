import { createFileRoute } from "@tanstack/react-router";
import { AlertsPage } from "@/features/alerts/pages/alerts-page";

export const Route = createFileRoute("/_shell/alerts")({
  head: () => ({
    meta: [
      { title: "Alertes — SolidCare" },
      { name: "description", content: "Centre d'alertes opérationnelles." },
    ],
  }),
  component: AlertsPage,
});
