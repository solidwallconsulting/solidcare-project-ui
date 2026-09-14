import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/page-container";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { staffApi, staffKeys } from "@/features/staff/api";
import { StaffFormDialog } from "@/features/staff/components/staff-form-dialog";
import { StaffPlanningSheet } from "@/features/staff/components/staff-planning-sheet";
import {
  shiftPreferenceLabels,
  staffRoleLabels,
  staffStatusLabels,
  type ShiftPreference,
  type StaffFormValues,
  type StaffStatus,
} from "@/features/staff/types";
import { shiftsApi } from "@/features/planning/api";
import { shiftStatusLabels, shiftTypeLabels } from "@/features/planning/types";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDate, fullName } from "@/shared/utils/format";

const statusTone: Record<StaffStatus, StatusTone> = {
  active: "success",
  on_leave: "warning",
  inactive: "danger",
};

const shiftTone: Record<string, StatusTone> = {
  scheduled: "info",
  completed: "success",
  cancelled: "danger",
};

export function StaffDetailPage({ staffId }: { staffId: string }) {
  const queryClient = useQueryClient();
  const { departmentName } = useLookups();
  const [formOpen, setFormOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);

  const memberQuery = useQuery({
    queryKey: staffKeys.detail(staffId),
    queryFn: () => staffApi.get(staffId),
  });

  const shiftsQuery = useQuery({
    queryKey: ["staff", staffId, "shifts"],
    queryFn: async () => {
      const shifts = await shiftsApi.peekAll();
      return shifts
        .filter((item) => item.staffId === staffId || item.resourceId === staffId)
        .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
    },
    enabled: Boolean(memberQuery.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: StaffFormValues) => {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        departmentId: values.departmentId,
        status: values.status,
        createdAt: memberQuery.data?.createdAt ?? new Date().toISOString().slice(0, 10),
        ...(values.shiftPreference
          ? { shiftPreference: values.shiftPreference as ShiftPreference }
          : {}),
      };
      return staffApi.update(staffId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
      void queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) });
      toast.success("Profil mis à jour");
      setFormOpen(false);
    },
    onError: () => toast.error("Impossible de mettre à jour le profil"),
  });

  if (memberQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (memberQuery.isError || !memberQuery.data) {
    return (
      <PageContainer className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/staff">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <ErrorState
          description="Ce membre est introuvable."
          onRetry={() => void memberQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const member = memberQuery.data;
  const shifts = shiftsQuery.data ?? [];

  return (
    <PageContainer className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
              <Link to="/staff" aria-label="Retour au personnel">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold tracking-[-0.02em]">
                  {fullName(member.firstName, member.lastName)}
                </h1>
                <StatusBadge label={staffStatusLabels[member.status]} tone={statusTone[member.status]} />
              </div>
              <p className="mt-0.5 text-sm text-foreground">
                {staffRoleLabels[member.role]} ·{" "}
                {member.shiftPreference
                  ? shiftPreferenceLabels[member.shiftPreference]
                  : "Vacation non définie"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground">
                <Link
                  to="/departments/$id"
                  params={{ id: member.departmentId }}
                  className="font-medium text-primary hover:underline"
                >
                  {departmentName(member.departmentId)}
                </Link>
                <span>{member.phone}</span>
                <span>{member.email}</span>
                <span>
                  {shifts.length} vacation{shifts.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 pl-10 lg:pl-0">
            <Button variant="outline" onClick={() => setPlanningOpen(true)}>
              <CalendarRange className="size-4" />
              Planning
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Pencil className="size-4" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <h2 className="font-display text-sm font-semibold">Vacations ({shifts.length})</h2>
          <Button variant="outline" size="sm" onClick={() => setPlanningOpen(true)}>
            <CalendarRange className="size-4" />
            Voir le planning
          </Button>
        </header>
        {shiftsQuery.isLoading ? (
          <div className="p-3">
            <LoadingState />
          </div>
        ) : shifts.length === 0 ? (
          <div className="p-3">
            <EmptyState title="Aucune vacation." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {shifts.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setPlanningOpen(true)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-foreground">
                      {formatDate(item.date)} · {item.startTime}–{item.endTime} ·{" "}
                      {shiftTypeLabels[item.shift]}
                    </span>
                  </span>
                  <StatusBadge label={shiftStatusLabels[item.status]} tone={shiftTone[item.status] ?? "info"} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={member}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <StaffPlanningSheet open={planningOpen} member={member} onOpenChange={setPlanningOpen} />
    </PageContainer>
  );
}
