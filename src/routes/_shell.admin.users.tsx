import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/administration/pages/users-page";

export const Route = createFileRoute("/_shell/admin/users")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — SolidCare" },
      { name: "description", content: "Comptes staff internes." },
    ],
  }),
  component: UsersPage,
});
