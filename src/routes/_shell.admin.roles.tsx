import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/features/administration/pages/roles-page";

export const Route = createFileRoute("/_shell/admin/roles")({
  head: () => ({
    meta: [
      { title: "Rôles — SolidCare" },
      { name: "description", content: "Rôles et permissions du staff." },
    ],
  }),
  component: RolesPage,
});
