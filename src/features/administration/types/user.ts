import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";
import type { AppRole } from "./role";

export const appRoles = [
  "admin",
  "department_head",
  "team_leader",
  "doctor",
  "nurse",
  "receptionist",
] as const;
export const userStatuses = ["active", "invited", "suspended"] as const;
export type UserStatus = (typeof userStatuses)[number];

export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AppRole;
  departmentId?: string;
  status: UserStatus;
  lastActiveAt: string;
}

export interface StaffUserListQuery extends ListQuery {
  role?: AppRole | "all";
  status?: UserStatus | "all";
}

export const staffUserSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z
    .string()
    .min(8, "Numéro de téléphone invalide")
    .regex(/^[0-9+\s]+$/, "Chiffres, espaces et + uniquement"),
  role: z.enum(appRoles),
  departmentId: z.string().optional(),
  status: z.enum(userStatuses),
});

export type StaffUserFormValues = z.infer<typeof staffUserSchema>;

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrateur",
  department_head: "Chef de département",
  team_leader: "Chef d'équipe",
  doctor: "Médecin",
  nurse: "Infirmier / Infirmière",
  receptionist: "Réceptionniste",
};

export const userStatusLabels: Record<UserStatus, string> = {
  active: "Actif",
  invited: "Invité",
  suspended: "Suspendu",
};
