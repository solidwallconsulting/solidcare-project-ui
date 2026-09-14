import { createFileRoute } from "@tanstack/react-router";
import { DoctorsPage } from "@/features/doctors/pages/doctors-page";

export const Route = createFileRoute("/_shell/doctors/")({
  head: () => ({
    meta: [
      { title: "Médecins — SolidCare" },
      { name: "description", content: "Équipe médicale et disponibilités." },
    ],
  }),
  component: DoctorsPage,
});
