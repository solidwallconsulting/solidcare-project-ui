import { createFileRoute } from "@tanstack/react-router";
import { MaintenanceDetailPage } from "@/features/maintenance/pages/maintenance-detail-page";

export const Route = createFileRoute("/_shell/maintenance/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Ticket ${params.id} — SolidCare` }],
  }),
  component: MaintenanceDetailRoute,
});

function MaintenanceDetailRoute() {
  const { id } = Route.useParams();
  return <MaintenanceDetailPage ticketId={id} />;
}
