import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CreditCard, Pill, Stethoscope, Users, UserRoundCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { LoadingState } from "@/shared/components/feedback/states";
import { patientsApi } from "@/features/patients/api";
import { appointmentsApi } from "@/features/appointments/api";
import { consultationsApi } from "@/features/consultations/api";
import { doctorsApi } from "@/features/doctors/api";
import { prescriptionsApi } from "@/features/prescriptions/api";
import { paymentsApi } from "@/features/payments/api";
import { formatCurrency } from "@/shared/utils/format";

export function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "overview"],
    queryFn: async () => {
      const [patients, appointments, consultations, doctors, prescriptions, payments] =
        await Promise.all([
          patientsApi.peekAll(),
          appointmentsApi.peekAll(),
          consultationsApi.peekAll(),
          doctorsApi.peekAll(),
          prescriptionsApi.peekAll(),
          paymentsApi.peekAll(),
        ]);
      return { patients, appointments, consultations, doctors, prescriptions, payments };
    },
  });

  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageHeader title="Rapports" description="Chargement des indicateurs…" />
        <LoadingState />
      </PageContainer>
    );
  }

  const activePatients = data.patients.filter((item) => item.status === "active").length;
  const completedAppointments = data.appointments.filter(
    (item) => item.status === "completed",
  ).length;
  const paidRevenue = data.payments
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingRevenue = data.payments
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);
  const activePrescriptions = data.prescriptions.filter(
    (item) => item.status === "active",
  ).length;
  const availableDoctors = data.doctors.filter((item) => item.status === "available").length;

  const stats = [
    {
      label: "Patients actifs",
      value: String(activePatients),
      hint: `${data.patients.length} dossiers au total`,
      icon: Users,
    },
    {
      label: "Rendez-vous terminés",
      value: String(completedAppointments),
      hint: `${data.appointments.length} planifiés`,
      icon: CalendarDays,
    },
    {
      label: "Consultations",
      value: String(data.consultations.length),
      hint: `${data.consultations.filter((item) => item.status === "draft").length} brouillons`,
      icon: Stethoscope,
    },
    {
      label: "Médecins disponibles",
      value: String(availableDoctors),
      hint: `${data.doctors.length} dans l'équipe`,
      icon: UserRoundCog,
    },
    {
      label: "Ordonnances actives",
      value: String(activePrescriptions),
      hint: `${data.prescriptions.length} émises`,
      icon: Pill,
    },
    {
      label: "Recettes encaissées",
      value: formatCurrency(paidRevenue),
      hint: `${formatCurrency(pendingRevenue)} en attente`,
      icon: CreditCard,
    },
  ];

  const appointmentsByStatus = Object.entries(
    data.appointments.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {}),
  );

  const paymentsByMethod = Object.entries(
    data.payments.reduce<Record<string, number>>((acc, item) => {
      acc[item.method] = (acc[item.method] ?? 0) + item.amount;
      return acc;
    }, {}),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Rapports"
        description="Indicateurs opérationnels construits à partir des données démo."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card">
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div className="min-w-0">
                <p className="text-sm text-foreground/70">{stat.label}</p>
                <p className="mt-1 truncate text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 truncate text-xs text-foreground/70">{stat.hint}</p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <stat.icon className="size-4" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Rendez-vous par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {appointmentsByStatus.map(([status, count]) => (
                <li
                  key={status}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="capitalize text-foreground">{status.replace("_", " ")}</span>
                  <span className="font-medium text-foreground">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Montants par méthode</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {paymentsByMethod.map(([method, amount]) => (
                <li
                  key={method}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="capitalize text-foreground">{method}</span>
                  <span className="font-medium text-foreground">{formatCurrency(amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
