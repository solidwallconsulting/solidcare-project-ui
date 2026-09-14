import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const planningResourceTypes = ["doctor", "nurse", "room", "operating_room"] as const;
export const shiftTypes = ["morning", "evening", "night"] as const;
export const shiftStatuses = ["scheduled", "completed", "cancelled"] as const;
export const planningEventStatuses = ["scheduled", "in_progress", "completed", "cancelled"] as const;

export type PlanningResourceType = (typeof planningResourceTypes)[number];
export type ShiftType = (typeof shiftTypes)[number];
export type ShiftStatus = (typeof shiftStatuses)[number];
export type PlanningEventStatus = (typeof planningEventStatuses)[number];

export interface ShiftAssignment {
  id: string;
  staffId?: string;
  doctorId?: string;
  resourceType: PlanningResourceType;
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  shift: ShiftType;
  title: string;
  status: ShiftStatus;
}

export interface PlanningEvent {
  id: string;
  title: string;
  doctorId: string;
  roomId?: string;
  operatingRoomId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: PlanningEventStatus;
  notes: string;
}

export interface ShiftListQuery extends ListQuery {
  date?: string;
  resourceType?: PlanningResourceType | "all";
  shift?: ShiftType | "all";
  status?: ShiftStatus | "all";
}

export interface PlanningEventListQuery extends ListQuery {
  date?: string;
  status?: PlanningEventStatus | "all";
}

export const shiftTypeLabels: Record<ShiftType, string> = {
  morning: "Matin",
  evening: "Après-midi",
  night: "Nuit",
};

export const shiftStatusLabels: Record<ShiftStatus, string> = {
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const resourceTypeLabels: Record<PlanningResourceType, string> = {
  doctor: "Médecin",
  nurse: "Infirmier(ère)",
  room: "Salle",
  operating_room: "Bloc",
};

export const planningEventStatusLabels: Record<PlanningEventStatus, string> = {
  scheduled: "Planifié",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const shiftAssignmentSchema = z
  .object({
    staffId: z.string().optional(),
    doctorId: z.string().optional(),
    resourceType: z.enum(planningResourceTypes),
    resourceId: z.string().min(1),
    date: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    shift: z.enum(shiftTypes),
    title: z.string().min(2),
    status: z.enum(shiftStatuses),
  })
  .refine((value) => Boolean(value.staffId || value.doctorId), {
    message: "Associez un médecin ou un membre du personnel",
    path: ["staffId"],
  });

export type ShiftAssignmentFormValues = z.infer<typeof shiftAssignmentSchema>;
