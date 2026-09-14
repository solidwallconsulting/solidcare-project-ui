import type { ListQuery } from "@/shared/api/api-types";

export const alertSeverities = ["critical", "warning", "info"] as const;
export type AlertSeverity = (typeof alertSeverities)[number];

export interface ClinicAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  module: string;
  createdAt: string;
  read: boolean;
}

export interface AlertListQuery extends ListQuery {
  severity?: AlertSeverity | "all";
  read?: "all" | "unread" | "read";
}

export const alertSeverityLabels: Record<AlertSeverity, string> = {
  critical: "Critique",
  warning: "Avertissement",
  info: "Information",
};
