import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/equipment")({
  component: EquipmentLayout,
});

function EquipmentLayout() {
  return <Outlet />;
}
