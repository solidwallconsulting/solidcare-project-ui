import { createFileRoute } from "@tanstack/react-router";
import { WardsPage } from "@/features/wards/pages/wards-page";

export const Route = createFileRoute("/_shell/wards/")({
  head: () => ({
    meta: [{ title: "Chambres & lits — SolidCare" }],
  }),
  component: WardsPage,
});
