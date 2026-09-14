import { createFileRoute } from "@tanstack/react-router";
import { PatientDetailPage } from "@/features/patients/pages/patient-detail-page";

export const Route = createFileRoute("/_shell/patients/$id")({
  head: () => ({
    meta: [
      { title: "Dossier patient — SolidCare" },
      { name: "description", content: "Dossier patient complet : historique clinique et administratif." },
    ],
  }),
  component: PatientDetailRoute,
});

function PatientDetailRoute() {
  const { id } = Route.useParams();
  return <PatientDetailPage patientId={id} />;
}
