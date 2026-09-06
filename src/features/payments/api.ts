import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { paymentSeed } from "./mock-data";
import type { Payment, PaymentListQuery } from "./types";

export const paymentsRepository = new MockRepository<Payment>(paymentSeed, "pay", [
  "reference",
  "notes",
]);

export const paymentsApi = createResourceApi<Payment, PaymentListQuery>(
  "/payments",
  paymentsRepository,
  {
    filter: (payment, query) => {
      const statusOk = !query.status || query.status === "all" || payment.status === query.status;
      const methodOk = !query.method || query.method === "all" || payment.method === query.method;
      const patientOk = !query.patientId || payment.patientId === query.patientId;
      return statusOk && methodOk && patientOk;
    },
  },
);

export const paymentKeys = {
  all: ["payments"] as const,
  list: (query: PaymentListQuery) => ["payments", "list", query] as const,
  detail: (id: string) => ["payments", "detail", id] as const,
};
