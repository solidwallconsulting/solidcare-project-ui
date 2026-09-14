import { createFileRoute } from "@tanstack/react-router";
import { ConsultationsPage } from "@/features/consultations/pages/consultations-page";

export const Route = createFileRoute("/_shell/consultations")({
  head: () => ({
    meta: [
      { title: "Consultations — SolidCare" },
      { name: "description", content: "Notes de consultation et constantes vitales." },
    ],
  }),
  component: ConsultationsPage,
});
