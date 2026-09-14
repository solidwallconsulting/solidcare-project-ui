import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { planningEventSeed, shiftAssignmentSeed } from "./mock-data";
import type {
  PlanningEvent,
  PlanningEventListQuery,
  ShiftAssignment,
  ShiftListQuery,
} from "./types";

export const shiftsRepository = new MockRepository<ShiftAssignment>(
  shiftAssignmentSeed,
  "shf",
  ["title", "date", "resourceType"],
);

export const planningEventsRepository = new MockRepository<PlanningEvent>(
  planningEventSeed,
  "pev",
  ["title", "date", "notes"],
);

export const shiftsApi = createResourceApi<ShiftAssignment, ShiftListQuery>(
  "/planning/shifts",
  shiftsRepository,
  {
    filter: (item, query) => {
      const dateOk = !query.date || item.date === query.date;
      const typeOk =
        !query.resourceType ||
        query.resourceType === "all" ||
        item.resourceType === query.resourceType;
      const shiftOk = !query.shift || query.shift === "all" || item.shift === query.shift;
      const statusOk = !query.status || query.status === "all" || item.status === query.status;
      return dateOk && typeOk && shiftOk && statusOk;
    },
  },
);

export const planningEventsApi = createResourceApi<PlanningEvent, PlanningEventListQuery>(
  "/planning/events",
  planningEventsRepository,
  {
    filter: (item, query) => {
      const dateOk = !query.date || item.date === query.date;
      const statusOk = !query.status || query.status === "all" || item.status === query.status;
      return dateOk && statusOk;
    },
  },
);

export const planningKeys = {
  all: ["planning"] as const,
  shifts: (query?: ShiftListQuery) => ["planning", "shifts", query] as const,
  events: (query?: PlanningEventListQuery) => ["planning", "events", query] as const,
};
