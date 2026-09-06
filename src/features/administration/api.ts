import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { roleSeed, staffUserSeed } from "./mock-data";
import type { Role } from "./types/role";
import type { StaffUser, StaffUserListQuery } from "./types/user";

export const staffUsersRepository = new MockRepository<StaffUser>(staffUserSeed, "usr", [
  "firstName",
  "lastName",
  "email",
]);

export const staffUsersApi = createResourceApi<StaffUser, StaffUserListQuery>(
  "/users",
  staffUsersRepository,
  {
    filter: (user, query) => {
      const roleOk = !query.role || query.role === "all" || user.role === query.role;
      const statusOk = !query.status || query.status === "all" || user.status === query.status;
      return roleOk && statusOk;
    },
  },
);

export const rolesRepository = new MockRepository<Role>(roleSeed, "rol", ["name", "description"]);
export const rolesApi = createResourceApi<Role>("/roles", rolesRepository);

export const administrationKeys = {
  users: (query: StaffUserListQuery) => ["users", "list", query] as const,
  usersAll: ["users"] as const,
  roles: ["roles"] as const,
};
