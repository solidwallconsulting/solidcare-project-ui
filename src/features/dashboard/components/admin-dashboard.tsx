import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BedDouble,
  CalendarDays,
  CreditCard,
  Hospital,
  Plus,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { EmptyState } from "@/shared/components/feedback/states";
import { appointmentStatusLabels, appointmentTypeLabels } from "@/features/appointments/types";
import { appointmentStatusTone } from "@/features/appointments/status-tone";
import { formatCurrency, formatDate, formatDateTime, fullName } from "@/shared/utils/format";
import type { DashboardData } from "./use-dashboard-data";

export function AdminDashboard({ data }: { data: DashboardData }) {
  const activePatients = data.patients.filter((patient) => patient.status === "active").length;
  const upcoming = [...data.appointments]
    .filter((appointment) => ["scheduled", "confirmed"].includes(appointment.status))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 6);
  const revenue = data.payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);
  const pendingAmount = data.payments
    .filter((payment) => payment.status === "pending")
    .reduce((total, payment) => total + payment.amount, 0);
  const beds = data.beds;
  const occupiedBeds = beds.filter((bed) => bed.status === "occupied").length;
  const bedOccupancy = beds.length ? Math.round((occupiedBeds / beds.length) * 100) : 0;
  const operatingRooms = data.rooms.filter((room) => room.roomType === "operating");
  const orsBusy = operatingRooms.filter((item) => item.status === "in_surgery").length;
  const unreadAlerts = data.alerts.filter((alert) => !alert.read).length;

  const doctorName = (id: string) => {
    const doctor = data.doctors.find((item) => item.id === id);
    return doctor ? `Dr. ${fullName(doctor.firstName, doctor.lastName)}` : "—";
  };
  const patientName = (id: string) => {
    const patient = data.patients.find((item) => item.id === id);
    return patient ? fullName(patient.firstName, patient.lastName) : "—";
  };

  const revenueByDay = Object.entries(
    data.payments
      .filter((payment) => payment.status === "paid")
      .reduce<Record<string, number>>((accumulator, payment) => {
        const day = payment.paidAt.slice(0, 10);
        accumulator[day] = (accumulator[day] ?? 0) + payment.amount;
        return accumulator;
      }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, amount]) => ({ day: formatDate(day), amount }));

  const appointmentsByDoctor = data.doctors.map((doctor) => ({
    name: `Dr. ${doctor.lastName}`,
    appointments: data.appointments.filter((appointment) => appointment.doctorId === doctor.id)
      .length,
  }));

  const stats = [
    {
      label: "Patients actifs",
      value: String(activePatients),
      hint: `${data.patients.length} dossiers`,
      icon: Users,
    },
    {
      label: "Occupation lits",
      value: `${bedOccupancy}%`,
      hint: `${occupiedBeds}/${beds.length} lits`,
      icon: BedDouble,
    },
    {
      label: "Blocs en cours",
      value: String(orsBusy),
      hint: `${operatingRooms.length} salles bloc`,
      icon: Hospital,
    },
    {
      label: "Recettes",
      value: formatCurrency(revenue),
      hint: `${formatCurrency(pendingAmount)} en attente`,
      icon: CreditCard,
    },
    {
      label: "Alertes",
      value: String(unreadAlerts),
      hint: `${data.alerts.length} au total`,
      icon: AlertTriangle,
    },
  ];

  const quickActions = [
    { label: "Nouveau patient", to: "/patients", icon: UserRound },
    { label: "Nouveau RDV", to: "/appointments", icon: CalendarDays },
    { label: "Nouvelle consultation", to: "/consultations", icon: Stethoscope },
    { label: "Nouveau paiement", to: "/payments", icon: CreditCard },
  ] as const;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue administrateur — activité, capacité et alertes."
        actions={
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.to} variant="outline" size="sm" asChild>
                <Link to={action.to}>
                  <Plus className="size-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card bg-card">
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 truncate text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{stat.hint}</p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <stat.icon className="size-4" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="shadow-card bg-card lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Recettes encaissées par jour</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={48} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rendez-vous par médecin</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsByDoctor} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={32} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--foreground)",
                  }}
                />
                <Bar dataKey="appointments" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card bg-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Prochains rendez-vous</CardTitle>
          <Link to="/appointments" className="text-sm font-medium text-primary hover:underline">
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <EmptyState title="Aucun rendez-vous à venir" />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((appointment) => (
                <li
                  key={appointment.id}
                  className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {patientName(appointment.patientId)} · {appointmentTypeLabels[appointment.type]}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(appointment.startsAt)} · {doctorName(appointment.doctorId)} ·
                      Salle {appointment.room}
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
    </>
  );
}
