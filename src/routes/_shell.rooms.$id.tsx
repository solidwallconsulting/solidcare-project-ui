import { createFileRoute } from "@tanstack/react-router";
import { RoomDetailPage } from "@/features/rooms/pages/room-detail-page";

export const Route = createFileRoute("/_shell/rooms/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Salle ${params.id} — SolidCare` }],
  }),
  component: RoomDetailRoute,
});

function RoomDetailRoute() {
  const { id } = Route.useParams();
  return <RoomDetailPage roomId={id} />;
}
