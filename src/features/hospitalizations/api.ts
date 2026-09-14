import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { hospitalizationSeed } from "./mock-data";
import type { Hospitalization, HospitalizationListQuery } from "./types";

export const hospitalizationsRepository = new MockRepository<Hospitalization>(
  hospitalizationSeed,
  "hosp",
  ["reference", "reason", "notes"],
);

export const hospitalizationsApi = createResourceApi<Hospitalization, HospitalizationListQuery>(
  "/hospitalizations",
  hospitalizationsRepository,
  {
    filter: (item, query) => {
      const statusOk = !query.status || query.status === "all" || item.status === query.status;
      const depOk =
        !query.departmentId ||
        query.departmentId === "all" ||
        item.departmentId === query.departmentId;
      const patientOk = !query.patientId || item.patientId === query.patientId;
      return statusOk && depOk && patientOk;
    },
  },
);

export const hospitalizationKeys = {
  all: ["hospitalizations"] as const,
  list: (query: HospitalizationListQuery) => ["hospitalizations", "list", query] as const,
  detail: (id: string) => ["hospitalizations", "detail", id] as const,
};
