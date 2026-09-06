import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";
import type { AppRole } from "./role";

export const appRoles = ["admin", "doctor", "receptionist"] as const;
export const userStatuses = ["active", "invited", "suspended"] as const;
export type UserStatus = (typeof userStatuses)[number];

export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AppRole;
  status: UserStatus;
  lastActiveAt: string;
}

export interface StaffUserListQuery extends ListQuery {
  role?: AppRole | "all";
  status?: UserStatus | "all";
}

export const staffUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .min(8, "Enter a valid phone number")
    .regex(/^[0-9+\s]+$/, "Phone number can only contain digits, spaces and +"),
  role: z.enum(appRoles),
  status: z.enum(userStatuses),
});

export type StaffUserFormValues = z.infer<typeof staffUserSchema>;

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  receptionist: "Receptionist",
};

export const userStatusLabels: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};
