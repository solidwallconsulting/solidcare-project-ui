import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/staff")({
  component: StaffLayout,
});

function StaffLayout() {
  return <Outlet />;
}
