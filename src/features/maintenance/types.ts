import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const maintenancePriorities = ["low", "medium", "high"] as const;
export type MaintenancePriority = (typeof maintenancePriorities)[number];

export const maintenanceStatuses = ["open", "in_progress", "resolved", "cancelled"] as const;
export type MaintenanceStatus = (typeof maintenanceStatuses)[number];

export interface MaintenanceTicket {
  id: string;
  reference: string;
  equipmentId: string;
  roomId?: string;
  problem: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  technicianName: string;
  createdAt: string;
  resolvedAt?: string;
  notes: string;
}

export interface MaintenanceListQuery extends ListQuery {
  status?: MaintenanceStatus | "all";
  priority?: MaintenancePriority | "all";
  equipmentId?: string | "all";
}

export const maintenanceSchema = z.object({
  equipmentId: z.string().min(1, "Sélectionnez un équipement"),
  roomId: z.string().optional(),
  problem: z.string().min(5, "Décrivez le problème"),
  priority: z.enum(maintenancePriorities),
  status: z.enum(maintenanceStatuses),
  technicianName: z.string().min(2, "Nom du technicien requis"),
  notes: z.string().max(240),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export const maintenancePriorityLabels: Record<MaintenancePriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};

export const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  cancelled: "Annulé",
};
