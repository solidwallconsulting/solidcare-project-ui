import { createFileRoute } from "@tanstack/react-router";
import { RoomsPage } from "@/features/rooms/pages/rooms-page";

export const Route = createFileRoute("/_shell/rooms/")({
  head: () => ({
    meta: [
      { title: "Salles — SolidCare" },
      { name: "description", content: "Salles de consultation et d'examen." },
    ],
  }),
  component: RoomsPage,
});
