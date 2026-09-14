import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { maintenanceSeed } from "./mock-data";
import type { MaintenanceListQuery, MaintenanceTicket } from "./types";

export const maintenanceRepository = new MockRepository<MaintenanceTicket>(
  maintenanceSeed,
  "mnt",
  ["reference", "problem", "technicianName", "notes"],
);

export const maintenanceApi = createResourceApi<MaintenanceTicket, MaintenanceListQuery>(
  "/maintenance",
  maintenanceRepository,
  {
    filter: (item, query) => {
      const statusOk = !query.status || query.status === "all" || item.status === query.status;
      const priorityOk =
        !query.priority || query.priority === "all" || item.priority === query.priority;
      const equipOk =
        !query.equipmentId ||
        query.equipmentId === "all" ||
        item.equipmentId === query.equipmentId;
      return statusOk && priorityOk && equipOk;
    },
  },
);

export const maintenanceKeys = {
  all: ["maintenance"] as const,
  list: (query: MaintenanceListQuery) => ["maintenance", "list", query] as const,
  detail: (id: string) => ["maintenance", "detail", id] as const,
  options: ["maintenance", "options"] as const,
};
