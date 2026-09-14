import { createFileRoute } from "@tanstack/react-router";
import { EquipmentPage } from "@/features/equipment/pages/equipment-page";

export const Route = createFileRoute("/_shell/equipment/")({
  head: () => ({
    meta: [
      { title: "Matériel — SolidCare" },
      { name: "description", content: "Inventaire du matériel médical." },
    ],
  }),
  component: EquipmentPage,
});
