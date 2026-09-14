import type { ListQuery } from "@/shared/api/api-types";

export interface AuditEvent {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  detail: string;
}

export type AuditListQuery = ListQuery;
