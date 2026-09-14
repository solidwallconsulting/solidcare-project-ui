import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { roomSeed } from "./mock-data";
import type { Room, RoomListQuery } from "./types";

export const roomsRepository = new MockRepository<Room>(roomSeed, "room", [
  "name",
  "code",
  "notes",
]);

export const roomsApi = createResourceApi<Room, RoomListQuery>("/rooms", roomsRepository, {
  filter: (item, query) => {
    const statusOk = !query.status || query.status === "all" || item.status === query.status;
    const depOk =
      !query.departmentId || query.departmentId === "all" || item.departmentId === query.departmentId;
    const typeOk = !query.roomType || query.roomType === "all" || item.roomType === query.roomType;
    return statusOk && depOk && typeOk;
  },
});

export const roomKeys = {
  all: ["rooms"] as const,
  list: (query: RoomListQuery) => ["rooms", "list", query] as const,
  detail: (id: string) => ["rooms", "detail", id] as const,
  options: ["rooms", "options"] as const,
};
