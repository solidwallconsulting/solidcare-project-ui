import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { doctorSeed } from "./mock-data";
import type { Doctor, DoctorListQuery } from "./types";

export const doctorsRepository = new MockRepository<Doctor>(doctorSeed, "doc", [
  "firstName",
  "lastName",
  "specialty",
  "licenseNumber",
  "email",
]);

export const doctorsApi = createResourceApi<Doctor, DoctorListQuery>("/doctors", doctorsRepository, {
  filter: (doctor, query) => {
    const specialtyOk =
      !query.specialty || query.specialty === "all" || doctor.specialty === query.specialty;
    const statusOk = !query.status || query.status === "all" || doctor.status === query.status;
    const departmentOk =
      !query.departmentId ||
      query.departmentId === "all" ||
      doctor.departmentId === query.departmentId;
    return specialtyOk && statusOk && departmentOk;
  },
});

export const doctorKeys = {
  all: ["doctors"] as const,
  list: (query: DoctorListQuery) => ["doctors", "list", query] as const,
  detail: (id: string) => ["doctors", "detail", id] as const,
  options: ["doctors", "options"] as const,
};
