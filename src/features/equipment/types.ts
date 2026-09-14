import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const equipmentCategories = [
  "Imagerie",
  "Monitoring",
  "Chirurgical",
  "Mobilier",
  "Autre",
] as const;
export const equipmentStatuses = ["available", "in_use", "maintenance", "retired"] as const;

export type EquipmentCategory = (typeof equipmentCategories)[number];
export type EquipmentStatus = (typeof equipmentStatuses)[number];

export interface Equipment {
  id: string;
  name: string;
  reference: string;
  category: EquipmentCategory;
  departmentId: string;
  roomId: string;
  serialNumber: string;
  status: EquipmentStatus;
  purchaseDate: string;
  lastMaintenanceAt: string;
  nextMaintenanceAt: string;
  notes: string;
}

export interface EquipmentListQuery extends ListQuery {
  status?: EquipmentStatus | "all";
  category?: EquipmentCategory | "all";
  departmentId?: string | "all";
}

export const equipmentSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  reference: z.string().min(2, "La référence est requise"),
  category: z.enum(equipmentCategories),
  departmentId: z.string().min(1, "Sélectionnez un département"),
  roomId: z.string(),
  serialNumber: z.string().min(2, "N° de série requis"),
  status: z.enum(equipmentStatuses),
  purchaseDate: z.string().min(1, "Date d'achat requise"),
  lastMaintenanceAt: z.string(),
  nextMaintenanceAt: z.string(),
  notes: z.string().max(240),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export const equipmentStatusLabels: Record<EquipmentStatus, string> = {
  available: "Disponible",
  in_use: "En service",
  maintenance: "Maintenance",
  retired: "Retiré",
};
