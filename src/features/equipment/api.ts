import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { equipmentSeed } from "./mock-data";
import type { Equipment, EquipmentListQuery } from "./types";

export const equipmentRepository = new MockRepository<Equipment>(equipmentSeed, "eq", [
  "name",
  "reference",
  "serialNumber",
]);

export const equipmentApi = createResourceApi<Equipment, EquipmentListQuery>(
  "/equipment",
  equipmentRepository,
  {
    filter: (item, query) => {
      const statusOk = !query.status || query.status === "all" || item.status === query.status;
      const catOk = !query.category || query.category === "all" || item.category === query.category;
      const depOk =
        !query.departmentId ||
        query.departmentId === "all" ||
        item.departmentId === query.departmentId;
      return statusOk && catOk && depOk;
    },
  },
);

export const equipmentKeys = {
  all: ["equipment"] as const,
  list: (query: EquipmentListQuery) => ["equipment", "list", query] as const,
  detail: (id: string) => ["equipment", "detail", id] as const,
};
