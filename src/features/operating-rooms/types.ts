import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const orStatuses = ["available", "in_surgery", "sterilizing", "maintenance"] as const;
export const operatingRoomStatuses = orStatuses;
export type OperatingRoomStatus = (typeof orStatuses)[number];

export interface OperatingRoom {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  floor: string;
  tables: number;
  status: OperatingRoomStatus;
  equipmentSummary: string;
  notes: string;
  createdAt: string;
}

export interface OperatingRoomListQuery extends ListQuery {
  status?: OperatingRoomStatus | "all";
  departmentId?: string | "all";
}

export const operatingRoomSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  code: z.string().min(2, "Le code est requis"),
  departmentId: z.string().min(1, "Sélectionnez un département"),
  floor: z.string().min(1, "Étage requis"),
  tables: z.coerce.number().min(1).max(4),
  status: z.enum(orStatuses),
  equipmentSummary: z.string().max(240),
  notes: z.string().max(240),
});

export type OperatingRoomFormValues = z.infer<typeof operatingRoomSchema>;

export const operatingRoomStatusLabels: Record<OperatingRoomStatus, string> = {
  available: "Disponible",
  in_surgery: "En intervention",
  sterilizing: "Stérilisation",
  maintenance: "Maintenance",
};
