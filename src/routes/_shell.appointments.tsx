import { createFileRoute } from "@tanstack/react-router";
import { AppointmentsPage } from "@/features/appointments/pages/appointments-page";

export const Route = createFileRoute("/_shell/appointments")({
  head: () => ({
    meta: [
      { title: "Rendez-vous — SolidCare" },
      { name: "description", content: "Planification interne des rendez-vous patients." },
    ],
  }),
  component: AppointmentsPage,
});
