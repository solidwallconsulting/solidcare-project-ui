import { createFileRoute } from "@tanstack/react-router";
import { PatientsPage } from "@/features/patients/pages/patients-page";

export const Route = createFileRoute("/_shell/patients")({
  head: () => ({
    meta: [
      { title: "Patients — SolidCare" },
      { name: "description", content: "Gestion des dossiers patients de la clinique." },
    ],
  }),
  component: PatientsPage,
});
