import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const appointmentStatuses = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const appointmentTypes = ["consultation", "follow_up", "check_up", "emergency"] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];
export type AppointmentType = (typeof appointmentTypes)[number];

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startsAt: string;
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  room: string;
}

export interface AppointmentListQuery extends ListQuery {
  status?: AppointmentStatus | "all";
  doctorId?: string | "all";
  patientId?: string;
  date?: string;
}

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  startsAt: z.string().min(1, "Pick a date and time"),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Enter a duration" })
    .min(10, "Minimum duration is 10 minutes")
    .max(180, "Maximum duration is 180 minutes"),
  type: z.enum(appointmentTypes),
  status: z.enum(appointmentStatuses),
  reason: z.string().min(3, "Describe the reason briefly").max(200, "Reason is too long"),
  room: z.string().max(20, "Room label is too long"),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const appointmentTypeLabels: Record<AppointmentType, string> = {
  consultation: "Consultation",
  follow_up: "Follow-up",
  check_up: "Check-up",
  emergency: "Emergency",
};
