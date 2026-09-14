import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/components/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SolidCare — Votre clinique, parfaitement fluide" },
      {
        name: "description",
        content:
          "SolidCare est le système de gestion interne pour cliniques : patients, rendez-vous, consultations, départements, blocs et paiements.",
      },
      { property: "og:title", content: "SolidCare — Clinic Management System" },
      {
        property: "og:description",
        content: "Votre clinique, enfin parfaitement fluide.",
      },
    ],
  }),
  component: LandingRoute,
});

function LandingRoute() {
  return <LandingPage />;
}
