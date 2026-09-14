import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const wardRoomTypes = ["single", "double", "suite", "icu"] as const;
export type WardRoomType = (typeof wardRoomTypes)[number];

export const wardRoomStatuses = ["available", "occupied", "partial", "maintenance"] as const;
export type WardRoomStatus = (typeof wardRoomStatuses)[number];

export const bedStatuses = ["available", "occupied", "reserved", "cleaning", "maintenance"] as const;
export type BedStatus = (typeof bedStatuses)[number];

export interface WardRoom {
  id: string;
  code: string;
  floor: string;
  departmentId: string;
  roomType: WardRoomType;
  bedCount: number;
  status: WardRoomStatus;
  notes: string;
  createdAt: string;
}

export interface Bed {
  id: string;
  code: string;
  wardRoomId: string;
  status: BedStatus;
  patientId?: string;
  notes: string;
}

export interface WardRoomListQuery extends ListQuery {
  status?: WardRoomStatus | "all";
  departmentId?: string | "all";
  roomType?: WardRoomType | "all";
}

export interface BedListQuery extends ListQuery {
  status?: BedStatus | "all";
  wardRoomId?: string | "all";
}

export const wardRoomSchema = z.object({
  code: z.string().min(2, "Le code est requis"),
  floor: z.string().min(1, "Étage requis"),
  departmentId: z.string().min(1, "Sélectionnez un département"),
  roomType: z.enum(wardRoomTypes),
  bedCount: z.coerce.number().min(1).max(8),
  status: z.enum(wardRoomStatuses),
  notes: z.string().max(240),
});

export type WardRoomFormValues = z.infer<typeof wardRoomSchema>;

export const bedSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  wardRoomId: z.string().min(1, "Sélectionnez une chambre"),
  status: z.enum(bedStatuses),
  patientId: z.string().optional(),
  notes: z.string().max(240),
});

export type BedFormValues = z.infer<typeof bedSchema>;

export const wardRoomTypeLabels: Record<WardRoomType, string> = {
  single: "Simple",
  double: "Double",
  suite: "Suite",
  icu: "Soins intensifs",
};

export const wardRoomStatusLabels: Record<WardRoomStatus, string> = {
  available: "Disponible",
  occupied: "Occupée",
  partial: "Partielle",
  maintenance: "Maintenance",
};

export const bedStatusLabels: Record<BedStatus, string> = {
  available: "Disponible",
  occupied: "Occupé",
  reserved: "Réservé",
  cleaning: "Nettoyage",
  maintenance: "Maintenance",
};
