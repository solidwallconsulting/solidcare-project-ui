import { Link } from "@tanstack/react-router";
import { BedDouble, DoorOpen, Stethoscope, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { EmptyState } from "@/shared/components/feedback/states";
import { hospitalizationStatusLabels } from "@/features/hospitalizations/types";
import { roomStatusLabels } from "@/features/rooms/types";
import { fullName } from "@/shared/utils/format";
import type { DashboardData } from "./use-dashboard-data";

export function DepartmentDashboard({ data }: { data: DashboardData }) {
  const doctors = data.doctors.filter((doctor) => doctor.status === "available");
  const rooms = data.rooms;
  const hospitalizations = data.hospitalizations.filter((item) => item.status === "admitted");

  const stats = [
    {
      label: "Médecins disponibles",
      value: String(doctors.length),
      hint: `${data.doctors.length} au total`,
      icon: Stethoscope,
    },
    {
      label: "Salles",
      value: String(rooms.length),
      hint: `${rooms.filter((room) => room.status === "available").length} disponibles`,
      icon: DoorOpen,
    },
    {
      label: "Hospitalisations",
      value: String(hospitalizations.length),
      hint: "Patients en cours",
      icon: BedDouble,
    },
    {
      label: "Équipe médicale",
      value: String(data.doctors.length),
      hint: "Département / équipe",
      icon: Users,
    },
  ];

  return (
    <>
      <PageHeader
        title="Tableau de bord département"
        description="Focus équipe, salles et hospitalisations."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card bg-card">
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <stat.icon className="size-4" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Médecins</CardTitle>
            <Link to="/doctors" className="text-sm font-medium text-primary hover:underline">
              Voir
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.doctors.slice(0, 6).map((doctor) => (
                <li key={doctor.id} className="flex justify-between gap-2 py-2 text-sm">
                  <span>Dr. {fullName(doctor.firstName, doctor.lastName)}</span>
                  <span className="text-muted-foreground">{doctor.specialty}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Salles</CardTitle>
            <Link to="/rooms" className="text-sm font-medium text-primary hover:underline">
              Voir
            </Link>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <EmptyState title="Aucune salle" />
            ) : (
              <ul className="divide-y divide-border">
                {rooms.slice(0, 6).map((room) => (
                  <li key={room.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="text-sm">{room.name}</span>
                    <StatusBadge
                      label={roomStatusLabels[room.status]}
                      tone={
                        room.status === "available"
                          ? "success"
                          : room.status === "occupied"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Hospitalisations en cours</CardTitle>
          <Link to="/hospitalizations" className="text-sm font-medium text-primary hover:underline">
            Voir
          </Link>
        </CardHeader>
        <CardContent>
          {hospitalizations.length === 0 ? (
            <EmptyState title="Aucune hospitalisation" />
          ) : (
            <ul className="divide-y divide-border">
              {hospitalizations.slice(0, 8).map((item) => {
                const patient = data.patients.find((p) => p.id === item.patientId);
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="text-sm font-medium">
                        {patient ? fullName(patient.firstName, patient.lastName) : item.reference}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                    <StatusBadge label={hospitalizationStatusLabels[item.status]} tone="info" />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
