import { createFileRoute } from "@tanstack/react-router";
import { EquipmentDetailPage } from "@/features/equipment/pages/equipment-detail-page";

export const Route = createFileRoute("/_shell/equipment/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Matériel ${params.id} — SolidCare` }],
  }),
  component: EquipmentDetailRoute,
});

function EquipmentDetailRoute() {
  const { id } = Route.useParams();
  return <EquipmentDetailPage equipmentId={id} />;
}
