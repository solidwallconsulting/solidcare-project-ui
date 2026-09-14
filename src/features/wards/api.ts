import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { bedSeed, wardRoomSeed } from "./mock-data";
import type { Bed, BedListQuery, WardRoom, WardRoomListQuery } from "./types";

export const wardsRepository = new MockRepository<WardRoom>(wardRoomSeed, "ward", [
  "code",
  "floor",
  "notes",
]);

export const bedsRepository = new MockRepository<Bed>(bedSeed, "bed", ["code", "notes"]);

export const wardsApi = createResourceApi<WardRoom, WardRoomListQuery>(
  "/wards",
  wardsRepository,
  {
    filter: (item, query) => {
      const statusOk = !query.status || query.status === "all" || item.status === query.status;
      const depOk =
        !query.departmentId ||
        query.departmentId === "all" ||
        item.departmentId === query.departmentId;
      const typeOk =
        !query.roomType || query.roomType === "all" || item.roomType === query.roomType;
      return statusOk && depOk && typeOk;
    },
  },
);

export const bedsApi = createResourceApi<Bed, BedListQuery>("/beds", bedsRepository, {
  filter: (item, query) => {
    const statusOk = !query.status || query.status === "all" || item.status === query.status;
    const roomOk =
      !query.wardRoomId || query.wardRoomId === "all" || item.wardRoomId === query.wardRoomId;
    return statusOk && roomOk;
  },
});

export const wardKeys = {
  all: ["wards"] as const,
  list: (query: WardRoomListQuery) => ["wards", "list", query] as const,
  detail: (id: string) => ["wards", "detail", id] as const,
  options: ["wards", "options"] as const,
};

export const bedKeys = {
  all: ["beds"] as const,
  list: (query: BedListQuery) => ["beds", "list", query] as const,
  detail: (id: string) => ["beds", "detail", id] as const,
  options: ["beds", "options"] as const,
};
