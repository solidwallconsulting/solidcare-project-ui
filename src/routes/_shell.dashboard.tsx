import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CreditCard, Stethoscope, Users } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { LoadingState, EmptyState } from "@/shared/components/feedback/states";
import { patientsApi } from "@/features/patients/api";
import { appointmentsApi } from "@/features/appointments/api";
import { consultationsApi } from "@/features/consultations/api";
import { paymentsApi } from "@/features/payments/api";
import { doctorsApi } from "@/features/doctors/api";
import { appointmentStatusLabels, appointmentTypeLabels } from "@/features/appointments/types";
import { formatCurrency, formatDate, formatDateTime, fullName } from "@/shared/utils/format";
import { appointmentStatusTone } from "@/features/appointments/status-tone";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SolidCare" },
      {
        name: "description",
        content: "Daily clinic overview: appointments, patients, consultations and revenue.",
      },
      { property: "og:title", content: "Dashboard — SolidCare" },
      { property: "og:description", content: "Daily clinic overview at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const [patients, appointments, consultations, payments, doctors] = await Promise.all([
        patientsApi.peekAll(),
        appointmentsApi.peekAll(),
        consultationsApi.peekAll(),
        paymentsApi.peekAll(),
        doctorsApi.peekAll(),
      ]);
      return { patients, appointments, consultations, payments, doctors };
    },
  });

  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Loading your clinic overview…" />
        <LoadingState />
      </PageContainer>
    );
  }

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
      label: "Active patients",
      value: String(activePatients),
      hint: `${data.patients.length} total records`,
      icon: Users,
    },
    {
      label: "Appointments",
      value: String(data.appointments.length),
      hint: `${upcoming.length} coming up`,
      icon: CalendarDays,
    },
    {
      label: "Consultations",
      value: String(data.consultations.length),
      hint: `${data.consultations.filter((item) => item.status === "draft").length} still draft`,
      icon: Stethoscope,
    },
    {
      label: "Collected revenue",
      value: formatCurrency(revenue),
      hint: `${formatCurrency(pendingAmount)} pending`,
      icon: CreditCard,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="A snapshot of clinic activity built on demo data."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card">
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
        <Card className="shadow-card lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Collected revenue by day</CardTitle>
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

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Appointments per doctor</CardTitle>
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

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Upcoming appointments</CardTitle>
          <Link to="/appointments" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming appointments" />
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
                      Room {appointment.room}
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
    </PageContainer>
  );
}
