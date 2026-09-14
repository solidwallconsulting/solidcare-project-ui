import { createFileRoute } from "@tanstack/react-router";
import { HospitalizationsPage } from "@/features/hospitalizations/pages/hospitalizations-page";

export const Route = createFileRoute("/_shell/hospitalizations")({
  head: () => ({
    meta: [
      { title: "Hospitalisations — SolidCare" },
      { name: "description", content: "Admissions, transferts et sorties." },
    ],
  }),
  component: HospitalizationsPage,
});
