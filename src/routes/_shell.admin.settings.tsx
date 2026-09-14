import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/administration/pages/settings-page";

export const Route = createFileRoute("/_shell/admin/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — SolidCare" },
      { name: "description", content: "Paramètres de la clinique." },
    ],
  }),
  component: SettingsPage,
});
