import { createFileRoute } from "@tanstack/react-router";
import { DoctorDetailPage } from "@/features/doctors/pages/doctor-detail-page";

export const Route = createFileRoute("/_shell/doctors/$id")({
  head: () => ({
    meta: [
      { title: "Profil médecin — SolidCare" },
      { name: "description", content: "Profil médecin, planning et patients vus." },
    ],
  }),
  component: DoctorDetailRoute,
});

function DoctorDetailRoute() {
  const { id } = Route.useParams();
  return <DoctorDetailPage doctorId={id} />;
}
