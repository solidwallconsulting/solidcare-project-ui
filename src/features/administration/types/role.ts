export type AppRole =
  | "admin"
  | "department_head"
  | "team_leader"
  | "doctor"
  | "nurse"
  | "receptionist";

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
  "examinations.read",
  "examinations.create",
  "examinations.update",
  "hospitalizations.read",
  "hospitalizations.create",
  "hospitalizations.update",
  "payments.read",
  "payments.create",
  "departments.read",
  "departments.manage",
  "rooms.read",
  "rooms.manage",
  "wards.read",
  "wards.manage",
  "operating_rooms.read",
  "operating_rooms.manage",
  "equipment.read",
  "equipment.manage",
  "maintenance.read",
  "maintenance.manage",
  "planning.read",
  "planning.manage",
  "staff.read",
  "staff.manage",
  "administration.manage",
  "audit.read",
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
