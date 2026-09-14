import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { operatingRoomSeed } from "./mock-data";
import type { OperatingRoom, OperatingRoomListQuery } from "./types";

export const operatingRoomsRepository = new MockRepository<OperatingRoom>(
  operatingRoomSeed,
  "or",
  ["name", "code", "equipmentSummary"],
);

export const operatingRoomsApi = createResourceApi<OperatingRoom, OperatingRoomListQuery>(
  "/operating-rooms",
  operatingRoomsRepository,
  {
    filter: (item, query) => {
      const statusOk = !query.status || query.status === "all" || item.status === query.status;
      const depOk =
        !query.departmentId ||
        query.departmentId === "all" ||
        item.departmentId === query.departmentId;
      return statusOk && depOk;
    },
  },
);

export const operatingRoomKeys = {
  all: ["operating-rooms"] as const,
  list: (query: OperatingRoomListQuery) => ["operating-rooms", "list", query] as const,
  detail: (id: string) => ["operating-rooms", "detail", id] as const,
  options: ["operating-rooms", "options"] as const,
};
