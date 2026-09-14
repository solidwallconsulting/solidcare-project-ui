export type {
  Department,
  DepartmentFormValues,
  DepartmentListQuery,
  DepartmentStatus,
} from "./types";
export {
  departmentSchema,
  departmentStatuses,
  departmentStatusLabels,
  departmentRoleLabels,
} from "./types";
export { departmentsApi, departmentKeys, departmentsRepository } from "./api";
export { departmentSeed } from "./mock-data";
export { DepartmentFormDialog } from "./components/department-form-dialog";
export { DepartmentsPage } from "./pages/departments-page";
export { DepartmentDetailPage } from "./pages/department-detail-page";
