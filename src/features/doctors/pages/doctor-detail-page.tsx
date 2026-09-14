import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/page-container";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { doctorsApi, doctorKeys } from "@/features/doctors/api";
import { DoctorFormDialog } from "@/features/doctors/components/doctor-form-dialog";
import { DoctorPlanningSheet } from "@/features/doctors/components/doctor-planning-sheet";
import {
  doctorStatusLabels,
  specialtyLabels,
  weekdayLabels,
  type DoctorStatus,
  type DoctorFormValues,
} from "@/features/doctors/types";
import { appointmentsApi } from "@/features/appointments/api";
import {
  appointmentStatusLabels,
  appointmentTypeLabels,
} from "@/features/appointments/types";
import { appointmentStatusTone } from "@/features/appointments/status-tone";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatCurrency, formatDateTime, fullName } from "@/shared/utils/format";

const statusTone: Record<DoctorStatus, StatusTone> = {
  available: "success",
  on_leave: "warning",
  inactive: "danger",
};

export function DoctorDetailPage({ doctorId }: { doctorId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { patientName, departmentName } = useLookups();
  const [formOpen, setFormOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);

  const doctorQuery = useQuery({
    queryKey: doctorKeys.detail(doctorId),
    queryFn: () => doctorsApi.get(doctorId),
  });

  const relatedQuery = useQuery({
    queryKey: ["doctors", doctorId, "related"],
    queryFn: async () => {
      const appointments = await appointmentsApi.peekAll();
      const mine = appointments
        .filter((item) => item.doctorId === doctorId)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
      return {
        appointments: mine,
        patientIds: [...new Set(mine.map((item) => item.patientId))],
      };
    },
    enabled: Boolean(doctorQuery.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: DoctorFormValues) => doctorsApi.update(doctorId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: doctorKeys.all });
      void queryClient.invalidateQueries({ queryKey: doctorKeys.detail(doctorId) });
      toast.success("Profil médecin mis à jour");
      setFormOpen(false);
    },
    onError: () => toast.error("Impossible de mettre à jour le profil"),
  });

  if (doctorQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (doctorQuery.isError || !doctorQuery.data) {
    return (
      <PageContainer className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/doctors">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <ErrorState
          description="Ce médecin est introuvable."
          onRetry={() => void doctorQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const doctor = doctorQuery.data;
  const appointments = relatedQuery.data?.appointments ?? [];
  const patientIds = relatedQuery.data?.patientIds ?? [];

  return (
    <PageContainer className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
              <Link to="/doctors" aria-label="Retour aux médecins">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold tracking-[-0.02em]">
                  Dr. {fullName(doctor.firstName, doctor.lastName)}
                </h1>
                <StatusBadge label={doctorStatusLabels[doctor.status]} tone={statusTone[doctor.status]} />
              </div>
              <p className="mt-0.5 text-sm text-foreground">
                {specialtyLabels[doctor.specialty]} · {doctor.licenseNumber} ·{" "}
                {formatCurrency(doctor.consultationFee)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground">
                {doctor.departmentId ? (
                  <Link
                    to="/departments/$id"
                    params={{ id: doctor.departmentId }}
                    className="font-medium text-primary hover:underline"
                  >
                    {departmentName(doctor.departmentId)}
                  </Link>
                ) : (
                  <span>Sans département</span>
                )}
                <span>{doctor.phone}</span>
                <span>{doctor.email}</span>
                <span>{doctor.room ? `Salle ${doctor.room}` : "Salle non renseignée"}</span>
                <span>{doctor.availableDays.map((day) => weekdayLabels[day]).join(" · ")}</span>
                <span>
                  {appointments.length} RDV · {patientIds.length} patient{patientIds.length > 1 ? "s" : ""}
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
          <h2 className="font-display text-sm font-semibold">Rendez-vous ({appointments.length})</h2>
          <Button variant="outline" size="sm" onClick={() => setPlanningOpen(true)}>
            <CalendarRange className="size-4" />
            Voir le planning
          </Button>
        </header>
        {relatedQuery.isLoading ? (
          <div className="p-3">
            <LoadingState />
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-3">
            <EmptyState title="Aucun rendez-vous." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {appointments.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/appointments" })}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {patientName(item.patientId)} · {appointmentTypeLabels[item.type]}
                    </span>
                    <span className="block truncate text-xs text-foreground">
                      {formatDateTime(item.startsAt)} · {item.durationMinutes} min · salle {item.room || "—"}
                    </span>
                    {item.reason ? (
                      <span className="mt-0.5 block truncate text-xs text-foreground">{item.reason}</span>
                    ) : null}
                  </span>
                  <StatusBadge
                    label={appointmentStatusLabels[item.status]}
                    tone={appointmentStatusTone[item.status]}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="border-b border-border px-3 py-2">
          <h2 className="font-display text-sm font-semibold">Patients ({patientIds.length})</h2>
        </header>
        {patientIds.length === 0 ? (
          <div className="p-3">
            <EmptyState title="Aucun patient lié." />
          </div>
        ) : (
          <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {patientIds.map((id) => (
              <li key={id} className="bg-card">
                <Link
                  to="/patients/$id"
                  params={{ id }}
                  className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent/50"
                >
                  {patientName(id)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DoctorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        doctor={doctor}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <DoctorPlanningSheet open={planningOpen} doctor={doctor} onOpenChange={setPlanningOpen} />
    </PageContainer>
  );
}
