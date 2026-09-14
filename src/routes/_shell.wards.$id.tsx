import { createFileRoute } from "@tanstack/react-router";
import { WardDetailPage } from "@/features/wards/pages/ward-detail-page";

export const Route = createFileRoute("/_shell/wards/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Chambre ${params.id} — SolidCare` }],
  }),
  component: WardDetailRoute,
});

function WardDetailRoute() {
  const { id } = Route.useParams();
  return <WardDetailPage wardId={id} />;
}
