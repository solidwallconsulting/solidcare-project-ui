import { createFileRoute } from "@tanstack/react-router";
import { DepartmentsPage } from "@/features/departments/pages/departments-page";

export const Route = createFileRoute("/_shell/departments/")({
  head: () => ({
    meta: [
      { title: "Départements — SolidCare" },
      {
        name: "description",
        content: "Organisation des départements cliniques, chefs et équipes médicales.",
      },
    ],
  }),
  component: DepartmentsPage,
});
