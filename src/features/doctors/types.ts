import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const specialties = [
  "General medicine",
  "Cardiology",
  "Dermatology",
  "Paediatrics",
  "Gynaecology",
  "Orthopaedics",
  "Ophthalmology",
  "Dentistry",
] as const;

export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const doctorStatuses = ["available", "on_leave", "inactive"] as const;

export type Specialty = (typeof specialties)[number];
export type Weekday = (typeof weekdays)[number];
export type DoctorStatus = (typeof doctorStatuses)[number];

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: Specialty;
  licenseNumber: string;
  phone: string;
  email: string;
  consultationFee: number;
  availableDays: Weekday[];
  status: DoctorStatus;
  room: string;
  /** Département clinique (vide si non assigné). */
  departmentId: string;
}

export interface DoctorListQuery extends ListQuery {
  specialty?: Specialty | "all";
  status?: DoctorStatus | "all";
  departmentId?: string | "all";
}

export const doctorSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  specialty: z.enum(specialties),
  licenseNumber: z.string().min(4, "License number must be at least 4 characters"),
  phone: z
    .string()
    .min(8, "Enter a valid phone number")
    .regex(/^[0-9+\s]+$/, "Phone number can only contain digits, spaces and +"),
  email: z.string().email("Enter a valid email address"),
  consultationFee: z.coerce
    .number({ invalid_type_error: "Enter a fee amount" })
    .min(0, "Fee cannot be negative")
    .max(2000, "Fee looks too high"),
  availableDays: z.array(z.enum(weekdays)).min(1, "Select at least one working day"),
  status: z.enum(doctorStatuses),
  room: z.string().max(20, "Room label is too long"),
  departmentId: z.string(),
});

export type DoctorFormValues = z.infer<typeof doctorSchema>;

export const doctorStatusLabels: Record<DoctorStatus, string> = {
  available: "Disponible",
  on_leave: "En congé",
  inactive: "Inactif",
};

export const specialtyLabels: Record<Specialty, string> = {
  "General medicine": "Médecine générale",
  Cardiology: "Cardiologie",
  Dermatology: "Dermatologie",
  Paediatrics: "Pédiatrie",
  Gynaecology: "Gynécologie",
  Orthopaedics: "Orthopédie",
  Ophthalmology: "Ophtalmologie",
  Dentistry: "Dentisterie",
};

export const weekdayLabels: Record<Weekday, string> = {
  Mon: "Lun",
  Tue: "Mar",
  Wed: "Mer",
  Thu: "Jeu",
  Fri: "Ven",
  Sat: "Sam",
};
