import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionsPage } from "@/features/prescriptions/pages/prescriptions-page";

export const Route = createFileRoute("/_shell/prescriptions")({
  head: () => ({
    meta: [
      { title: "Ordonnances — SolidCare" },
      { name: "description", content: "Gestion des ordonnances médicamenteuses." },
    ],
  }),
  component: PrescriptionsPage,
});
