import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/operating-rooms")({
  component: OperatingRoomsRedirect,
});

function OperatingRoomsRedirect() {
  return <Navigate to="/rooms" replace />;
}
