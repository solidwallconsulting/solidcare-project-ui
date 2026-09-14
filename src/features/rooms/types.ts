import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const roomTypes = [
  "consultation",
  "care",
  "exam",
  "ultrasound",
  "radiology",
  "operating",
  "recovery",
] as const;
export type RoomType = (typeof roomTypes)[number];

export const roomStatuses = [
  "available",
  "occupied",
  "reserved",
  "in_surgery",
  "sterilizing",
  "maintenance",
] as const;
export type RoomStatus = (typeof roomStatuses)[number];

export interface Room {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  floor: string;
  capacity: number;
  roomType: RoomType;
  status: RoomStatus;
  notes: string;
  createdAt: string;
}

export interface RoomListQuery extends ListQuery {
  status?: RoomStatus | "all";
  departmentId?: string | "all";
  roomType?: RoomType | "all";
}

export const roomSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  code: z.string().min(2, "Le code est requis"),
  departmentId: z.string().min(1, "Sélectionnez un département"),
  floor: z.string().min(1, "Étage requis"),
  capacity: z.coerce.number().min(1).max(20),
  roomType: z.enum(roomTypes),
  status: z.enum(roomStatuses),
  notes: z.string().max(240),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

export const roomStatusLabels: Record<RoomStatus, string> = {
  available: "Disponible",
  occupied: "Occupée",
  reserved: "Réservée",
  in_surgery: "En intervention",
  sterilizing: "Stérilisation",
  maintenance: "Maintenance",
};

export const roomTypeLabels: Record<RoomType, string> = {
  consultation: "Consultation",
  care: "Soins",
  exam: "Examen",
  ultrasound: "Échographie",
  radiology: "Radiologie",
  operating: "Bloc opératoire",
  recovery: "Réveil",
};
