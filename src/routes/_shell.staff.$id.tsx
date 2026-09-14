import { createFileRoute } from "@tanstack/react-router";
import { StaffDetailPage } from "@/features/staff/pages/staff-detail-page";

export const Route = createFileRoute("/_shell/staff/$id")({
  head: () => ({
    meta: [
      { title: "Profil personnel — SolidCare" },
      { name: "description", content: "Profil soignant, vacations et planning." },
    ],
  }),
  component: StaffDetailRoute,
});

function StaffDetailRoute() {
  const { id } = Route.useParams();
  return <StaffDetailPage staffId={id} />;
}
