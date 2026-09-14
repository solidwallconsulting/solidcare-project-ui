import { createFileRoute } from "@tanstack/react-router";
import { PlanningPage } from "@/features/planning/pages/planning-page";

export const Route = createFileRoute("/_shell/planning")({
  head: () => ({
    meta: [
      { title: "Planning — SolidCare" },
      { name: "description", content: "Centre de planning : médecins, salles, blocs et shifts." },
    ],
  }),
  component: PlanningPage,
});
