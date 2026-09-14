import { Link } from "@tanstack/react-router";
import { CalendarDays, Hospital, Stethoscope, BedDouble } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { EmptyState } from "@/shared/components/feedback/states";
import { appointmentStatusLabels, appointmentTypeLabels } from "@/features/appointments/types";
import { appointmentStatusTone } from "@/features/appointments/status-tone";
import { formatDateTime, fullName } from "@/shared/utils/format";
import type { DashboardData } from "./use-dashboard-data";

const TODAY = "2026-09-10";

export function DoctorDashboard({ data }: { data: DashboardData }) {
  const doctorId = data.doctors[0]?.id;
  const todayAppointments = data.appointments.filter(
    (item) =>
      item.startsAt.startsWith(TODAY) &&
      (!doctorId || item.doctorId === doctorId) &&
      ["scheduled", "confirmed"].includes(item.status),
  );
  const consultationsCount = data.consultations.filter(
    (item) => !doctorId || item.doctorId === doctorId,
  ).length;
  const hospitalized = data.hospitalizations.filter((item) => item.status === "admitted");
  const nextOr = data.shifts
    .filter(
      (item) =>
        item.date === TODAY &&
        item.resourceType === "operating_room" &&
        item.status === "scheduled" &&
        (!doctorId || item.doctorId === doctorId),
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  const patientName = (id: string) => {
    const patient = data.patients.find((item) => item.id === id);
    return patient ? fullName(patient.firstName, patient.lastName) : "—";
  };

  const stats = [
    {
      label: "RDV du jour",
      value: String(todayAppointments.length),
      icon: CalendarDays,
    },
    {
      label: "Consultations",
      value: String(consultationsCount),
      icon: Stethoscope,
    },
    {
      label: "Patients hospitalisés",
      value: String(hospitalized.length),
      icon: BedDouble,
    },
    {
      label: "Prochain bloc",
      value: nextOr ? nextOr.startTime : "—",
      icon: Hospital,
    },
  ];

  return (
    <>
      <PageHeader
        title="Mon espace"
        description="Votre journée clinique : rendez-vous, consultations et blocs."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card bg-card">
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <stat.icon className="size-4" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Rendez-vous du jour</CardTitle>
            <Link to="/appointments" className="text-sm font-medium text-primary hover:underline">
              Planning
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <EmptyState title="Aucun rendez-vous aujourd'hui" />
            ) : (
              <ul className="divide-y divide-border">
                {todayAppointments.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {patientName(appointment.patientId)} ·{" "}
                        {appointmentTypeLabels[appointment.type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(appointment.startsAt)} · Salle {appointment.room}
                      </p>
                    </div>
                    <StatusBadge
                      label={appointmentStatusLabels[appointment.status]}
                      tone={appointmentStatusTone[appointment.status]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card bg-card">
          <CardHeader>
            <CardTitle className="text-base">Prochain bloc opératoire</CardTitle>
          </CardHeader>
          <CardContent>
            {!nextOr ? (
              <EmptyState title="Aucun bloc planifié" />
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">{nextOr.title}</p>
                <p className="text-sm text-muted-foreground">
                  {nextOr.startTime}–{nextOr.endTime} · {nextOr.date}
                </p>
                <Link to="/planning" className="text-sm font-medium text-primary hover:underline">
                  Ouvrir le planning
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
