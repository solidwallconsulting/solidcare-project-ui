import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { auditEventSeed } from "./mock-data";
import type { AuditEvent, AuditListQuery } from "./types";

export const auditRepository = new MockRepository<AuditEvent>(auditEventSeed, "aud", [
  "actorName",
  "action",
  "entityType",
  "detail",
]);

export const auditApi = createResourceApi<AuditEvent, AuditListQuery>(
  "/admin/audit",
  auditRepository,
);

export const auditKeys = {
  all: ["audit"] as const,
  list: (query: AuditListQuery) => ["audit", "list", query] as const,
};
