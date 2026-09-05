import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const genders = ["female", "male"] as const;
export const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const patientStatuses = ["active", "archived"] as const;

export type Gender = (typeof genders)[number];
export type BloodGroup = (typeof bloodGroups)[number];
export type PatientStatus = (typeof patientStatuses)[number];

export interface Patient {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  bloodGroup: BloodGroup;
  insurance: string;
  allergies: string;
  notes: string;
  status: PatientStatus;
  createdAt: string;
}

export interface PatientListQuery extends ListQuery {
  status?: PatientStatus | "all";
}

export const patientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.enum(genders),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => new Date(value) <= new Date(), "Date of birth cannot be in the future"),
  phone: z
    .string()
    .min(8, "Enter a valid phone number")
    .regex(/^[0-9+\s]+$/, "Phone number can only contain digits, spaces and +"),
  email: z.string().email("Enter a valid email address").or(z.literal("")),
  city: z.string().min(2, "City is required"),
  address: z.string().max(160, "Address is too long"),
  bloodGroup: z.enum(bloodGroups),
  insurance: z.string().max(80, "Insurance name is too long"),
  allergies: z.string().max(240, "Keep allergies under 240 characters"),
  notes: z.string().max(400, "Keep notes under 400 characters"),
  status: z.enum(patientStatuses),
});

export type PatientFormValues = z.infer<typeof patientSchema>;
