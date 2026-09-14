import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const examTypes = ["lab", "ultrasound", "xray", "ct", "mri", "other"] as const;
export type ExamType = (typeof examTypes)[number];

export const examPriorities = ["normal", "high", "urgent"] as const;
export type ExamPriority = (typeof examPriorities)[number];

export const examStatuses = [
  "requested",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type ExamStatus = (typeof examStatuses)[number];

export interface ExamRequest {
  id: string;
  reference: string;
  patientId: string;
  doctorId: string;
  consultationId?: string;
  examType: ExamType;
  title: string;
  reason: string;
  priority: ExamPriority;
  status: ExamStatus;
  requestedAt: string;
  scheduledAt?: string;
  resultNotes?: string;
  resultAvailableAt?: string;
}

export interface ExamListQuery extends ListQuery {
  status?: ExamStatus | "all";
  examType?: ExamType | "all";
  priority?: ExamPriority | "all";
  patientId?: string | "all";
}

export const examSchema = z.object({
  patientId: z.string().min(1, "Sélectionnez un patient"),
  doctorId: z.string().min(1, "Sélectionnez un médecin"),
  consultationId: z.string().optional(),
  examType: z.enum(examTypes),
  title: z.string().min(2, "Titre requis"),
  reason: z.string().min(3, "Motif requis"),
  priority: z.enum(examPriorities),
  status: z.enum(examStatuses),
  requestedAt: z.string().min(1, "Date requise"),
  scheduledAt: z.string().optional(),
  resultNotes: z.string().max(500).optional(),
});

export type ExamFormValues = z.infer<typeof examSchema>;

/** Alias pour le dialog / exports historiques. */
export const examRequestSchema = examSchema;
export type ExamRequestFormValues = ExamFormValues;

export const examTypeLabels: Record<ExamType, string> = {
  lab: "Laboratoire",
  ultrasound: "Échographie",
  xray: "Radiographie",
  ct: "Scanner",
  mri: "IRM",
  other: "Autre",
};

export const examPriorityLabels: Record<ExamPriority, string> = {
  normal: "Normale",
  high: "Élevée",
  urgent: "Urgente",
};

export const examStatusLabels: Record<ExamStatus, string> = {
  requested: "Demandé",
  scheduled: "Planifié",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};
