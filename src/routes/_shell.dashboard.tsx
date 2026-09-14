import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BedDouble,
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  HeartPulse,
  Plus,
  Stethoscope,
  UserRound,
  Users,
  Wrench,
  FlaskConical,
  CalendarRange,
  type LucideIcon,
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
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { LoadingState, EmptyState } from "@/shared/components/feedback/states";
import { useAuth } from "@/app/providers/auth-provider";
import { roleLabels } from "@/features/administration/types/user";
import type { AppRole } from "@/features/administration/types/role";
import { patientsApi } from "@/features/patients/api";
import { appointmentsApi } from "@/features/appointments/api";
import { consultationsApi } from "@/features/consultations/api";
import { paymentsApi } from "@/features/payments/api";
import { doctorsApi } from "@/features/doctors/api";
import { hospitalizationsApi } from "@/features/hospitalizations/api";
import { examinationsApi } from "@/features/examinations/api";
import { bedsApi } from "@/features/wards/api";
import { equipmentApi } from "@/features/equipment/api";
import { maintenanceApi } from "@/features/maintenance/api";
import { alertsApi } from "@/features/alerts/api";
import { shiftsApi } from "@/features/planning/api";
import { prescriptionsApi } from "@/features/prescriptions/api";
import { appointmentStatusLabels, appointmentTypeLabels } from "@/features/appointments/types";
import { formatCurrency, formatDate, formatDateTime, fullName } from "@/shared/utils/format";
import { appointmentStatusTone } from "@/features/appointments/status-tone";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — SolidCare" },
      {
        name: "description",
        content: "Vue d'ensemble adaptée au rôle : patients, soins, lits et opérations.",
      },
      { property: "og:title", content: "Tableau de bord — SolidCare" },
      { property: "og:description", content: "Activité quotidienne de la clinique." },
    ],
  }),
  component: DashboardPage,
});

type Kpi = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

type QuickAction = { label: string; to: string; icon: LucideIcon };

function DashboardPage() {
  const { user } = useAuth();
  const role: AppRole = user?.role ?? "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "overview", role],
    queryFn: async () => {
      const [
        patients,
        appointments,
        consultations,
        payments,
        doctors,
        hospitalizations,
        examinations,
        beds,
        equipment,
        maintenance,
        alerts,
        shifts,
        prescriptions,
      ] = await Promise.all([
        patientsApi.peekAll(),
        appointmentsApi.peekAll(),
        consultationsApi.peekAll(),
        paymentsApi.peekAll(),
        doctorsApi.peekAll(),
        hospitalizationsApi.peekAll(),
        examinationsApi.peekAll(),
        bedsApi.peekAll(),
        equipmentApi.peekAll(),
        maintenanceApi.peekAll(),
        alertsApi.peekAll(),
        shiftsApi.peekAll(),
        prescriptionsApi.peekAll(),
      ]);
      return {
        patients,
        appointments,
        consultations,
        payments,
        doctors,
        hospitalizations,
        examinations,
        beds,
        equipment,
        maintenance,
        alerts,
        shifts,
        prescriptions,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageHeader title="Tableau de bord" description="Chargement de la vue d'ensemble…" />
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
  const admitted = data.hospitalizations.filter((item) => item.status === "admitted").length;
  const freeBeds = data.beds.filter((bed) => bed.status === "available").length;
  const openMaintenance = data.maintenance.filter(
    (item) => item.status === "open" || item.status === "in_progress",
  ).length;
  const unreadAlerts = data.alerts.filter((item) => !item.read).length;
  const todayShifts = data.shifts.filter((item) => item.date === "2026-09-10").length;
  const pendingExams = data.examinations.filter((item) =>
    ["requested", "scheduled", "in_progress"].includes(item.status),
  ).length;
  const equipMaintenance = data.equipment.filter((item) => item.status === "maintenance").length;

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

  const kpisByRole: Record<AppRole, Kpi[]> = {
    admin: [
      {
        label: "Patients actifs",
        value: String(activePatients),
        hint: `${data.patients.length} dossiers au total`,
        icon: Users,
      },
      {
        label: "Rendez-vous",
        value: String(data.appointments.length),
        hint: `${upcoming.length} à venir`,
        icon: CalendarDays,
      },
      {
        label: "Hospitalisations",
        value: String(admitted),
        hint: `${freeBeds} lits libres`,
        icon: HeartPulse,
      },
      {
        label: "Recettes encaissées",
        value: formatCurrency(revenue),
        hint: `${formatCurrency(pendingAmount)} en attente`,
        icon: CreditCard,
      },
    ],
    department_head: [
      {
        label: "Lits libres",
        value: String(freeBeds),
        hint: `${data.beds.length} lits au total`,
        icon: BedDouble,
      },
      {
        label: "Patients hospitalisés",
        value: String(admitted),
        hint: `${data.hospitalizations.length} dossiers`,
        icon: HeartPulse,
      },
      {
        label: "Matériel en maintenance",
        value: String(equipMaintenance),
        hint: `${data.equipment.length} équipements`,
        icon: Wrench,
      },
      {
        label: "Alertes non lues",
        value: String(unreadAlerts),
        hint: `${data.alerts.length} alertes`,
        icon: Bell,
      },
    ],
    doctor: [
      {
        label: "RDV à venir",
        value: String(upcoming.length),
        hint: `${data.appointments.length} au total`,
        icon: CalendarDays,
      },
      {
        label: "Consultations",
        value: String(data.consultations.length),
        hint: `${data.consultations.filter((item) => item.status === "draft").length} brouillons`,
        icon: Stethoscope,
      },
      {
        label: "Examens en cours",
        value: String(pendingExams),
        hint: `${data.examinations.length} demandes`,
        icon: FlaskConical,
      },
      {
        label: "Ordonnances",
        value: String(data.prescriptions.length),
        hint: "Prescriptions actives",
        icon: ClipboardList,
      },
    ],
    nurse: [
      {
        label: "Patients hospitalisés",
        value: String(admitted),
        hint: "À surveiller aujourd'hui",
        icon: HeartPulse,
      },
      {
        label: "Lits disponibles",
        value: String(freeBeds),
        hint: `${data.beds.filter((b) => b.status === "occupied").length} occupés`,
        icon: BedDouble,
      },
      {
        label: "Vacations du jour",
        value: String(todayShifts),
        hint: "Planning soignant",
        icon: CalendarRange,
      },
      {
        label: "Alertes",
        value: String(unreadAlerts),
        hint: "Incidents ouverts",
        icon: Bell,
      },
    ],
    receptionist: [
      {
        label: "RDV à venir",
        value: String(upcoming.length),
        hint: "Accueil & confirmation",
        icon: CalendarDays,
      },
      {
        label: "Patients actifs",
        value: String(activePatients),
        hint: `${data.patients.length} dossiers`,
        icon: Users,
      },
      {
        label: "Paiements en attente",
        value: formatCurrency(pendingAmount),
        hint: `${data.payments.filter((p) => p.status === "pending").length} factures`,
        icon: CreditCard,
      },
      {
        label: "Examens planifiés",
        value: String(data.examinations.filter((e) => e.status === "scheduled").length),
        hint: "À orienter",
        icon: FlaskConical,
      },
    ],
    team_leader: [
      {
        label: "Vacations du jour",
        value: String(todayShifts),
        hint: "Équipes planifiées",
        icon: CalendarRange,
      },
      {
        label: "Tickets maintenance",
        value: String(openMaintenance),
        hint: "Ouverts / en cours",
        icon: ClipboardList,
      },
      {
        label: "Lits libres",
        value: String(freeBeds),
        hint: "Occupation des chambres",
        icon: BedDouble,
      },
      {
        label: "Alertes critiques",
        value: String(data.alerts.filter((a) => a.severity === "critical" && !a.read).length),
        hint: `${unreadAlerts} non lues`,
        icon: Bell,
      },
    ],
  };

  const actionsByRole: Record<AppRole, QuickAction[]> = {
    admin: [
      { label: "Nouveau patient", to: "/patients", icon: UserRound },
      { label: "Nouveau RDV", to: "/appointments", icon: CalendarDays },
      { label: "Hospitalisation", to: "/hospitalizations", icon: HeartPulse },
      { label: "Alertes", to: "/alerts", icon: Bell },
    ],
    department_head: [
      { label: "Chambres & lits", to: "/wards", icon: BedDouble },
      { label: "Planning", to: "/planning", icon: CalendarRange },
      { label: "Matériel", to: "/equipment", icon: Wrench },
      { label: "Alertes", to: "/alerts", icon: Bell },
    ],
    doctor: [
      { label: "Consultations", to: "/consultations", icon: Stethoscope },
      { label: "Examens", to: "/examinations", icon: FlaskConical },
      { label: "Ordonnances", to: "/prescriptions", icon: ClipboardList },
      { label: "RDV", to: "/appointments", icon: CalendarDays },
    ],
    nurse: [
      { label: "Hospitalisations", to: "/hospitalizations", icon: HeartPulse },
      { label: "Chambres & lits", to: "/wards", icon: BedDouble },
      { label: "Planning", to: "/planning", icon: CalendarRange },
      { label: "Alertes", to: "/alerts", icon: Bell },
    ],
    receptionist: [
      { label: "Nouveau patient", to: "/patients", icon: UserRound },
      { label: "Nouveau RDV", to: "/appointments", icon: CalendarDays },
      { label: "Paiements", to: "/payments", icon: CreditCard },
      { label: "Examens", to: "/examinations", icon: FlaskConical },
    ],
    team_leader: [
      { label: "Planning", to: "/planning", icon: CalendarRange },
      { label: "Maintenance", to: "/maintenance", icon: ClipboardList },
      { label: "Personnel", to: "/staff", icon: Users },
      { label: "Alertes", to: "/alerts", icon: Bell },
    ],
  };

  const stats = kpisByRole[role];
  const quickActions = actionsByRole[role];

  return (
    <PageContainer>
      <PageHeader
        title="Tableau de bord"
        description={`Vue ${roleLabels[role].toLowerCase()} — activité clinique (données de démonstration).`}
        actions={
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.to + action.label} variant="outline" size="sm" asChild>
                <Link to={action.to}>
                  <Plus className="size-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {(role === "admin" || role === "receptionist") && (
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
      )}

      <Card className="shadow-card bg-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">
            {role === "nurse" || role === "department_head" || role === "team_leader"
              ? "Alertes récentes"
              : "Prochains rendez-vous"}
          </CardTitle>
          <Link
            to={
              role === "nurse" || role === "department_head" || role === "team_leader"
                ? "/alerts"
                : "/appointments"
            }
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          {role === "nurse" || role === "department_head" || role === "team_leader" ? (
            data.alerts.length === 0 ? (
              <EmptyState title="Aucune alerte" />
            ) : (
              <ul className="divide-y divide-border">
                {[...data.alerts]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 6)
                  .map((alert) => (
                    <li
                      key={alert.id}
                      className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{alert.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDateTime(alert.createdAt)} · {alert.module}
                        </p>
                      </div>
                      <StatusBadge
                        label={alert.read ? "Lu" : "Non lu"}
                        tone={
                          alert.severity === "critical"
                            ? "danger"
                            : alert.severity === "warning"
                              ? "warning"
                              : "info"
                        }
                      />
                    </li>
                  ))}
              </ul>
            )
          ) : upcoming.length === 0 ? (
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
                      {patientName(appointment.patientId)} ·{" "}
                      {appointmentTypeLabels[appointment.type]}
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
    </PageContainer>
  );
}
