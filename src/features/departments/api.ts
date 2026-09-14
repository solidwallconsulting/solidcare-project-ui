import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { departmentSeed } from "./mock-data";
import type { Department, DepartmentListQuery } from "./types";

export const departmentsRepository = new MockRepository<Department>(departmentSeed, "dep", [
  "name",
  "code",
  "description",
]);

export const departmentsApi = createResourceApi<Department, DepartmentListQuery>(
  "/departments",
  departmentsRepository,
  {
    filter: (item, query) =>
      !query.status || query.status === "all" ? true : item.status === query.status,
  },
);

export const departmentKeys = {
  all: ["departments"] as const,
  list: (query: DepartmentListQuery) => ["departments", "list", query] as const,
  detail: (id: string) => ["departments", "detail", id] as const,
  options: ["departments", "options"] as const,
};
