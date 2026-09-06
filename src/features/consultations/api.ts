import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { consultationSeed } from "./mock-data";
import type { Consultation, ConsultationListQuery } from "./types";

export const consultationsRepository = new MockRepository<Consultation>(consultationSeed, "cns", [
  "diagnosis",
  "symptoms",
  "treatment",
]);

export const consultationsApi = createResourceApi<Consultation, ConsultationListQuery>(
  "/consultations",
  consultationsRepository,
  {
    filter: (consultation, query) => {
      const statusOk =
        !query.status || query.status === "all" || consultation.status === query.status;
      const doctorOk =
        !query.doctorId || query.doctorId === "all" || consultation.doctorId === query.doctorId;
      const patientOk = !query.patientId || consultation.patientId === query.patientId;
      return statusOk && doctorOk && patientOk;
    },
  },
);

export const consultationKeys = {
  all: ["consultations"] as const,
  list: (query: ConsultationListQuery) => ["consultations", "list", query] as const,
  detail: (id: string) => ["consultations", "detail", id] as const,
};
