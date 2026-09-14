import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const departmentStatuses = ["active", "inactive"] as const;
export type DepartmentStatus = (typeof departmentStatuses)[number];

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headDoctorId: string;
  teamLeaderId: string;
  doctorIds: string[];
  floor: string;
  phone: string;
  status: DepartmentStatus;
  createdAt: string;
}

export interface DepartmentListQuery extends ListQuery {
  status?: DepartmentStatus | "all";
}

export const departmentSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  code: z.string().min(2, "Le code est requis").max(12, "Code trop long"),
  description: z.string().max(400, "Description trop longue"),
  headDoctorId: z.string().min(1, "Sélectionnez un chef de département"),
  teamLeaderId: z.string().min(1, "Sélectionnez un chef d'équipe"),
  doctorIds: z.array(z.string()),
  floor: z.string().min(1, "Étage requis"),
  phone: z.string().min(8, "Téléphone invalide"),
  status: z.enum(departmentStatuses),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;

export const departmentStatusLabels: Record<DepartmentStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
};

export const departmentRoleLabels = {
  head: "Chef de département",
  teamLeader: "Chef d'équipe",
  doctor: "Médecin",
} as const;
