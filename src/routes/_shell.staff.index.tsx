import { createFileRoute } from "@tanstack/react-router";
import { StaffPage } from "@/features/staff/pages/staff-page";

export const Route = createFileRoute("/_shell/staff/")({
  head: () => ({
    meta: [
      { title: "Personnel soignant — SolidCare" },
      { name: "description", content: "Équipe soignante, rôles et vacations." },
    ],
  }),
  component: StaffPage,
});
