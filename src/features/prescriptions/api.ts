import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { prescriptionSeed } from "./mock-data";
import type { Prescription, PrescriptionListQuery } from "./types";

export const prescriptionsRepository = new MockRepository<Prescription>(prescriptionSeed, "prx", [
  "reference",
  "instructions",
]);

export const prescriptionsApi = createResourceApi<Prescription, PrescriptionListQuery>(
  "/prescriptions",
  prescriptionsRepository,
  {
    filter: (prescription, query) => {
      const statusOk =
        !query.status || query.status === "all" || prescription.status === query.status;
      const doctorOk =
        !query.doctorId || query.doctorId === "all" || prescription.doctorId === query.doctorId;
      const patientOk = !query.patientId || prescription.patientId === query.patientId;
      return statusOk && doctorOk && patientOk;
    },
  },
);

export const prescriptionKeys = {
  all: ["prescriptions"] as const,
  list: (query: PrescriptionListQuery) => ["prescriptions", "list", query] as const,
  detail: (id: string) => ["prescriptions", "detail", id] as const,
};
