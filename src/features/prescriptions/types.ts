import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const prescriptionStatuses = ["active", "completed", "cancelled"] as const;
export type PrescriptionStatus = (typeof prescriptionStatuses)[number];

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  durationDays: number;
}

export interface Prescription {
  id: string;
  reference: string;
  patientId: string;
  doctorId: string;
  consultationId: string;
  issuedAt: string;
  items: PrescriptionItem[];
  instructions: string;
  status: PrescriptionStatus;
}

export interface PrescriptionListQuery extends ListQuery {
  status?: PrescriptionStatus | "all";
  doctorId?: string | "all";
  patientId?: string;
}

export const prescriptionItemSchema = z.object({
  medication: z.string().min(2, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  durationDays: z.coerce
    .number({ invalid_type_error: "Enter a duration" })
    .min(1, "At least 1 day")
    .max(365, "Duration is too long"),
});

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  consultationId: z.string(),
  issuedAt: z.string().min(1, "Pick an issue date"),
  items: z.array(prescriptionItemSchema).min(1, "Add at least one medication"),
  instructions: z.string().max(400, "Instructions are too long"),
  status: z.enum(prescriptionStatuses),
});

export type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

export const prescriptionStatusLabels: Record<PrescriptionStatus, string> = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};
