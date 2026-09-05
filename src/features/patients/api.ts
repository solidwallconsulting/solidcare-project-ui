import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { patientSeed } from "./mock-data";
import type { Patient, PatientListQuery } from "./types";

export const patientsRepository = new MockRepository<Patient>(patientSeed, "pat", [
  "firstName",
  "lastName",
  "reference",
  "phone",
  "email",
  "city",
]);

export const patientsApi = createResourceApi<Patient, PatientListQuery>(
  "/patients",
  patientsRepository,
  {
    filter: (patient, query) =>
      !query.status || query.status === "all" ? true : patient.status === query.status,
  },
);

export const patientKeys = {
  all: ["patients"] as const,
  list: (query: PatientListQuery) => ["patients", "list", query] as const,
  detail: (id: string) => ["patients", "detail", id] as const,
  options: ["patients", "options"] as const,
};
