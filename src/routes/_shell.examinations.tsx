import { createFileRoute } from "@tanstack/react-router";
import { ExaminationsPage } from "@/features/examinations/pages/examinations-page";

export const Route = createFileRoute("/_shell/examinations")({
  head: () => ({
    meta: [
      { title: "Examens — SolidCare" },
      { name: "description", content: "Demandes d'analyses et d'imagerie." },
    ],
  }),
  component: ExaminationsPage,
});
