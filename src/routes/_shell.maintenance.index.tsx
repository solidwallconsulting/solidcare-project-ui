import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "@/features/maintenance/pages/maintenance-page";

export const Route = createFileRoute("/_shell/maintenance/")({
  head: () => ({
    meta: [
      { title: "Maintenance — SolidCare" },
      { name: "description", content: "Tickets de maintenance du matériel médical." },
    ],
  }),
  component: MaintenancePage,
});
