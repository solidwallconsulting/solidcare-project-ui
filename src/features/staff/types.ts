import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const staffRoles = [
  "nurse",
  "care_assistant",
  "anesthetist",
  "technician",
  "admin_staff",
] as const;

export const staffStatuses = ["active", "on_leave", "inactive"] as const;
export const shiftPreferences = ["morning", "evening", "night"] as const;

export type StaffRole = (typeof staffRoles)[number];
export type StaffStatus = (typeof staffStatuses)[number];
export type ShiftPreference = (typeof shiftPreferences)[number];

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  departmentId: string;
  status: StaffStatus;
  shiftPreference?: ShiftPreference;
  createdAt: string;
}

export interface StaffListQuery extends ListQuery {
  role?: StaffRole | "all";
  status?: StaffStatus | "all";
  departmentId?: string | "all";
}

export const staffMemberSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z
    .string()
    .min(8, "Numéro de téléphone invalide")
    .regex(/^[0-9+\s]+$/, "Chiffres, espaces et + uniquement"),
  role: z.enum(staffRoles),
  departmentId: z.string().min(1, "Sélectionnez un département"),
  status: z.enum(staffStatuses),
  shiftPreference: z.union([z.enum(shiftPreferences), z.literal("")]).optional(),
});

export type StaffFormValues = z.infer<typeof staffMemberSchema>;

export const staffRoleLabels: Record<StaffRole, string> = {
  nurse: "Infirmier(ère)",
  care_assistant: "Aide-soignant(e)",
  anesthetist: "Anesthésiste",
  technician: "Technicien(ne)",
  admin_staff: "Personnel administratif",
};

export const staffStatusLabels: Record<StaffStatus, string> = {
  active: "Actif",
  on_leave: "En congé",
  inactive: "Inactif",
};

export const shiftPreferenceLabels: Record<ShiftPreference, string> = {
  morning: "Matin",
  evening: "Après-midi",
  night: "Nuit",
};
