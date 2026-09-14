import { Link } from "@tanstack/react-router";
import { BedDouble, CalendarDays, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { EmptyState } from "@/shared/components/feedback/states";
import { appointmentStatusLabels, appointmentTypeLabels } from "@/features/appointments/types";
import { appointmentStatusTone } from "@/features/appointments/status-tone";
import { formatDateTime, fullName } from "@/shared/utils/format";
import type { DashboardData } from "./use-dashboard-data";

const TODAY = "2026-09-10";

export function ReceptionistDashboard({ data }: { data: DashboardData }) {
  const todayAppointments = data.appointments.filter((item) => item.startsAt.startsWith(TODAY));
  const admissions = data.hospitalizations.filter((item) =>
    item.admittedAt.startsWith(TODAY),
  );
  const availableBeds = data.beds.filter((bed) => bed.status === "available");

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
      label: "Admissions",
      value: String(admissions.length),
      icon: UserPlus,
    },
    {
      label: "Lits disponibles",
      value: String(availableBeds.length),
      icon: BedDouble,
    },
    {
      label: "Patients actifs",
      value: String(data.patients.filter((p) => p.status === "active").length),
      icon: Users,
    },
  ];

  return (
    <>
      <PageHeader
        title="Accueil"
        description="Rendez-vous du jour, admissions et disponibilité des lits."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/patients">Nouveau patient</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/appointments">Nouveau RDV</Link>
            </Button>
          </div>
        }
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
            <CardTitle className="text-base">Rendez-vous aujourd'hui</CardTitle>
            <Link to="/appointments" className="text-sm font-medium text-primary hover:underline">
              Voir
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <EmptyState title="Aucun rendez-vous" />
            ) : (
              <ul className="divide-y divide-border">
                {todayAppointments.slice(0, 8).map((appointment) => (
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lits disponibles</CardTitle>
            <Link to="/wards" className="text-sm font-medium text-primary hover:underline">
              Chambres & lits
            </Link>
          </CardHeader>
          <CardContent>
            {availableBeds.length === 0 ? (
              <EmptyState title="Aucun lit libre" />
            ) : (
              <ul className="divide-y divide-border">
                {availableBeds.slice(0, 8).map((bed) => (
                  <li key={bed.id} className="flex justify-between py-2 text-sm">
                    <span>{bed.code}</span>
                    <StatusBadge label="Disponible" tone="success" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
