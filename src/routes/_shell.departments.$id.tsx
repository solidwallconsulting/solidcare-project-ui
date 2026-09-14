import { createFileRoute } from "@tanstack/react-router";
import { DepartmentDetailPage } from "@/features/departments/pages/department-detail-page";

export const Route = createFileRoute("/_shell/departments/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Département ${params.id} — SolidCare` }],
  }),
  component: DepartmentDetailRoute,
});

function DepartmentDetailRoute() {
  const { id } = Route.useParams();
  return <DepartmentDetailPage departmentId={id} />;
}
