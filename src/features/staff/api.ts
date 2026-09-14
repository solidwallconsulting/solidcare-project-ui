import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { staffSeed } from "./mock-data";
import type { StaffListQuery, StaffMember } from "./types";

export const staffRepository = new MockRepository<StaffMember>(staffSeed, "stf", [
  "firstName",
  "lastName",
  "email",
  "phone",
  "role",
]);

export const staffApi = createResourceApi<StaffMember, StaffListQuery>("/staff", staffRepository, {
  filter: (member, query) => {
    const roleOk = !query.role || query.role === "all" || member.role === query.role;
    const statusOk = !query.status || query.status === "all" || member.status === query.status;
    const depOk =
      !query.departmentId ||
      query.departmentId === "all" ||
      member.departmentId === query.departmentId;
    return roleOk && statusOk && depOk;
  },
});

export const staffKeys = {
  all: ["staff"] as const,
  list: (query: StaffListQuery) => ["staff", "list", query] as const,
  detail: (id: string) => ["staff", "detail", id] as const,
  options: ["staff", "options"] as const,
};
