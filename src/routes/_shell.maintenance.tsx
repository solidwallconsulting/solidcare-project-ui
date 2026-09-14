import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/maintenance")({
  component: MaintenanceLayout,
});

function MaintenanceLayout() {
  return <Outlet />;
}
