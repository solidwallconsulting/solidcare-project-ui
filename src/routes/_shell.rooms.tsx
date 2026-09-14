import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/rooms")({
  component: RoomsLayout,
});

function RoomsLayout() {
  return <Outlet />;
}
