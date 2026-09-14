import { createFileRoute } from "@tanstack/react-router";
import { PaymentsPage } from "@/features/payments/pages/payments-page";

export const Route = createFileRoute("/_shell/payments")({
  head: () => ({
    meta: [
      { title: "Paiements — SolidCare" },
      { name: "description", content: "Encaissements et règlements patients." },
    ],
  }),
  component: PaymentsPage,
});
