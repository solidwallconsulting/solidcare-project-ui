import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/departments")({
  component: DepartmentsLayout,
});

function DepartmentsLayout() {
  return <Outlet />;
}
