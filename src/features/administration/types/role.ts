export type AppRole = "admin" | "doctor" | "receptionist";

export const permissions = [
  "patients.read",
  "patients.create",
  "patients.update",
  "patients.delete",
  "appointments.read",
  "appointments.create",
  "appointments.update",
  "appointments.delete",
  "consultations.read",
  "consultations.create",
  "consultations.update",
  "prescriptions.read",
  "prescriptions.create",
  "payments.read",
  "payments.create",
  "administration.manage",
] as const;

export type Permission = (typeof permissions)[number];

export interface Role {
  id: string;
  key: AppRole;
  name: string;
  description: string;
  permissions: Permission[];
  usersCount: number;
}
