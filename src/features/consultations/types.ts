import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const consultationStatuses = ["draft", "finalised"] as const;
export type ConsultationStatus = (typeof consultationStatuses)[number];

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  temperature: number;
  bloodPressure: string;
  weight: number;
  followUpDate: string;
  status: ConsultationStatus;
}

export interface ConsultationListQuery extends ListQuery {
  status?: ConsultationStatus | "all";
  doctorId?: string | "all";
  patientId?: string;
}

export const consultationSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  appointmentId: z.string(),
  date: z.string().min(1, "Pick a consultation date"),
  symptoms: z.string().min(3, "Describe the symptoms").max(400, "Symptoms text is too long"),
  diagnosis: z.string().min(3, "Enter a diagnosis").max(300, "Diagnosis is too long"),
  treatment: z.string().max(400, "Treatment plan is too long"),
  temperature: z.coerce
    .number({ invalid_type_error: "Enter a temperature" })
    .min(30, "Temperature seems too low")
    .max(45, "Temperature seems too high"),
  bloodPressure: z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, "Use the format 120/80")
    .or(z.literal("")),
  weight: z.coerce
    .number({ invalid_type_error: "Enter a weight" })
    .min(1, "Weight seems too low")
    .max(400, "Weight seems too high"),
  followUpDate: z.string(),
  status: z.enum(consultationStatuses),
});

export type ConsultationFormValues = z.infer<typeof consultationSchema>;

export const consultationStatusLabels: Record<ConsultationStatus, string> = {
  draft: "Draft",
  finalised: "Finalised",
};
