import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/wards")({
  component: WardsLayout,
});

function WardsLayout() {
  return <Outlet />;
}
