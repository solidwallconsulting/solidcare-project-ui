import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/doctors")({
  component: DoctorsLayout,
});

function DoctorsLayout() {
  return <Outlet />;
}
