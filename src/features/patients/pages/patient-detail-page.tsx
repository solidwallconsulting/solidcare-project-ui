import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { patientsApi, patientKeys } from "@/features/patients/api";
import { PatientFormDialog } from "@/features/patients/components/patient-form-dialog";
import type { PatientFormValues } from "@/features/patients/types";
import { appointmentsApi } from "@/features/appointments/api";
import {
  appointmentStatusLabels,
  appointmentTypeLabels,
} from "@/features/appointments/types";
import { appointmentStatusTone } from "@/features/appointments/status-tone";
import { consultationsApi } from "@/features/consultations/api";
import { consultationStatusLabels } from "@/features/consultations/types";
import { prescriptionsApi } from "@/features/prescriptions/api";
import { prescriptionStatusLabels } from "@/features/prescriptions/types";
import { paymentsApi } from "@/features/payments/api";
import { paymentMethodLabels, paymentStatusLabels } from "@/features/payments/types";
import { hospitalizationsApi } from "@/features/hospitalizations/api";
import { hospitalizationStatusLabels } from "@/features/hospitalizations/types";
import { examinationsApi } from "@/features/examinations/api";
import { examStatusLabels, examTypeLabels } from "@/features/examinations/types";
import { useLookups } from "@/shared/hooks/use-lookups";
import {
  calculateAge,
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
} from "@/shared/utils/format";

type TimelineItem = {
  id: string;
  at: string;
  kind: "appointment" | "consultation" | "prescription" | "payment" | "hospitalization" | "exam";
  title: string;
  detail: string;
};

export function PatientDetailPage({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const { doctorName } = useLookups();
  const [formOpen, setFormOpen] = useState(false);

  const patientQuery = useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: () => patientsApi.get(patientId),
  });

  const historyQuery = useQuery({
    queryKey: ["patients", patientId, "history"],
    queryFn: async () => {
      const [appointments, consultations, prescriptions, payments, hospitalizations, examinations] =
        await Promise.all([
          appointmentsApi.peekAll(),
          consultationsApi.peekAll(),
          prescriptionsApi.peekAll(),
          paymentsApi.peekAll(),
          hospitalizationsApi.peekAll(),
          examinationsApi.peekAll(),
        ]);
      return {
        appointments: appointments.filter((item) => item.patientId === patientId),
        consultations: consultations.filter((item) => item.patientId === patientId),
        prescriptions: prescriptions.filter((item) => item.patientId === patientId),
        payments: payments.filter((item) => item.patientId === patientId),
        hospitalizations: hospitalizations.filter((item) => item.patientId === patientId),
        examinations: examinations.filter((item) => item.patientId === patientId),
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: PatientFormValues) => patientsApi.update(patientId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      void queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) });
      toast.success("Dossier mis à jour");
      setFormOpen(false);
    },
    onError: () => toast.error("Impossible de mettre à jour le dossier"),
  });

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!historyQuery.data) return [];
    const items: TimelineItem[] = [
      ...historyQuery.data.appointments.map((item) => ({
        id: item.id,
        at: item.startsAt,
        kind: "appointment" as const,
        title: `Rendez-vous · ${appointmentTypeLabels[item.type]}`,
        detail: `${formatDateTime(item.startsAt)} · ${doctorName(item.doctorId)} · ${appointmentStatusLabels[item.status]}`,
      })),
      ...historyQuery.data.consultations.map((item) => ({
        id: item.id,
        at: item.date,
        kind: "consultation" as const,
        title: `Consultation · ${item.diagnosis || "Sans diagnostic"}`,
        detail: `${formatDate(item.date)} · ${doctorName(item.doctorId)} · ${consultationStatusLabels[item.status]}`,
      })),
      ...historyQuery.data.prescriptions.map((item) => ({
        id: item.id,
        at: item.issuedAt,
        kind: "prescription" as const,
        title: `Ordonnance · ${item.reference}`,
        detail: `${formatDate(item.issuedAt)} · ${item.items.length} médicament(s) · ${prescriptionStatusLabels[item.status]}`,
      })),
      ...historyQuery.data.payments.map((item) => ({
        id: item.id,
        at: item.paidAt,
        kind: "payment" as const,
        title: `Paiement · ${formatCurrency(item.amount)}`,
        detail: `${formatDate(item.paidAt)} · ${paymentMethodLabels[item.method]} · ${paymentStatusLabels[item.status]}`,
      })),
      ...historyQuery.data.hospitalizations.map((item) => ({
        id: item.id,
        at: item.admittedAt,
        kind: "hospitalization" as const,
        title: `Hospitalisation · ${item.reference}`,
        detail: `${formatDate(item.admittedAt)} · ${item.reason} · ${hospitalizationStatusLabels[item.status]}`,
      })),
      ...historyQuery.data.examinations.map((item) => ({
        id: item.id,
        at: item.requestedAt,
        kind: "exam" as const,
        title: `Examen · ${item.title}`,
        detail: `${formatDate(item.requestedAt)} · ${examTypeLabels[item.examType]} · ${examStatusLabels[item.status]}`,
      })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at));
  }, [historyQuery.data, doctorName]);

  if (patientQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Dossier patient" description="Chargement…" />
        <LoadingState />
      </PageContainer>
    );
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <PageContainer>
        <PageHeader title="Dossier patient" />
        <ErrorState
          title="Patient introuvable"
          description="Ce dossier n'existe pas ou n'a pas pu être chargé."
          onRetry={() => void patientQuery.refetch()}
        />
        <Button asChild variant="outline">
          <Link to="/patients">
            <ArrowLeft className="size-4" />
            Retour aux patients
          </Link>
        </Button>
      </PageContainer>
    );
  }

  const patient = patientQuery.data;
  const history = historyQuery.data;

  return (
    <PageContainer>
      <PageHeader
        title={fullName(patient.firstName, patient.lastName)}
        description={`Réf. médicale ${patient.reference}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/patients">
                <ArrowLeft className="size-4" />
                Patients
              </Link>
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Pencil className="size-4" />
              Modifier
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Sexe" value={patient.gender === "female" ? "Femme" : "Homme"} />
            <InfoRow
              label="Naissance"
              value={`${formatDate(patient.dateOfBirth)} (${calculateAge(patient.dateOfBirth)} ans)`}
            />
            <InfoRow
              label="Statut"
              value={
                <StatusBadge
                  label={patient.status === "active" ? "Actif" : "Archivé"}
                  tone={patient.status === "active" ? "success" : "neutral"}
                />
              }
            />
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Téléphone" value={patient.phone} />
            <InfoRow label="Email" value={patient.email || "—"} />
            <InfoRow label="Ville" value={patient.city} />
            <InfoRow label="Adresse" value={patient.address || "—"} />
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Résumé clinique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Groupe sanguin" value={patient.bloodGroup} />
            <InfoRow label="Allergies" value={patient.allergies || "Aucune connue"} />
            <InfoRow label="Assurance" value={patient.insurance || "—"} />
            <InfoRow label="Notes" value={patient.notes || "—"} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="hospitalizations">Hospitalisations</TabsTrigger>
          <TabsTrigger value="examinations">Examens</TabsTrigger>
          <TabsTrigger value="prescriptions">Ordonnances</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {historyQuery.isLoading ? (
            <LoadingState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Rendez-vous" value={history?.appointments.length ?? 0} />
              <StatCard label="Consultations" value={history?.consultations.length ?? 0} />
              <StatCard label="Hospitalisations" value={history?.hospitalizations.length ?? 0} />
              <StatCard label="Examens" value={history?.examinations.length ?? 0} />
              <StatCard label="Ordonnances" value={history?.prescriptions.length ?? 0} />
              <StatCard label="Paiements" value={history?.payments.length ?? 0} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="appointments">
          <HistoryList
            empty="Aucun rendez-vous"
            loading={historyQuery.isLoading}
            items={(history?.appointments ?? []).map((item) => ({
              id: item.id,
              title: appointmentTypeLabels[item.type],
              meta: `${formatDateTime(item.startsAt)} · ${doctorName(item.doctorId)} · Salle ${item.room}`,
              badge: (
                <StatusBadge
                  label={appointmentStatusLabels[item.status]}
                  tone={appointmentStatusTone[item.status]}
                />
              ),
            }))}
          />
        </TabsContent>

        <TabsContent value="consultations">
          <HistoryList
            empty="Aucune consultation"
            loading={historyQuery.isLoading}
            items={(history?.consultations ?? []).map((item) => ({
              id: item.id,
              title: item.diagnosis,
              meta: `${formatDate(item.date)} · ${doctorName(item.doctorId)} · ${item.symptoms}`,
              badge: (
                <StatusBadge
                  label={consultationStatusLabels[item.status]}
                  tone={item.status === "finalised" ? "success" : "warning"}
                />
              ),
            }))}
          />
        </TabsContent>

        <TabsContent value="hospitalizations">
          <HistoryList
            empty="Aucune hospitalisation"
            loading={historyQuery.isLoading}
            items={(history?.hospitalizations ?? []).map((item) => ({
              id: item.id,
              title: `${item.reference} · ${item.reason}`,
              meta: `${formatDateTime(item.admittedAt)}${item.dischargedAt ? ` → ${formatDateTime(item.dischargedAt)}` : ""} · ${doctorName(item.doctorId)}`,
              badge: (
                <StatusBadge
                  label={hospitalizationStatusLabels[item.status]}
                  tone={
                    item.status === "admitted"
                      ? "primary"
                      : item.status === "discharged"
                        ? "success"
                        : "warning"
                  }
                />
              ),
            }))}
          />
        </TabsContent>

        <TabsContent value="examinations">
          <HistoryList
            empty="Aucun examen"
            loading={historyQuery.isLoading}
            items={(history?.examinations ?? []).map((item) => ({
              id: item.id,
              title: item.title,
              meta: `${formatDateTime(item.requestedAt)} · ${examTypeLabels[item.examType]} · ${doctorName(item.doctorId)}`,
              badge: (
                <StatusBadge
                  label={examStatusLabels[item.status]}
                  tone={
                    item.status === "completed"
                      ? "success"
                      : item.status === "cancelled"
                        ? "danger"
                        : item.status === "in_progress"
                          ? "warning"
                          : "primary"
                  }
                />
              ),
            }))}
          />
        </TabsContent>

        <TabsContent value="prescriptions">
          <HistoryList
            empty="Aucune ordonnance"
            loading={historyQuery.isLoading}
            items={(history?.prescriptions ?? []).map((item) => ({
              id: item.id,
              title: item.reference,
              meta: `${formatDate(item.issuedAt)} · ${item.items.map((med) => med.medication).join(", ")}`,
              badge: (
                <StatusBadge
                  label={prescriptionStatusLabels[item.status]}
                  tone={
                    item.status === "active"
                      ? "primary"
                      : item.status === "completed"
                        ? "success"
                        : "danger"
                  }
                />
              ),
            }))}
          />
        </TabsContent>

        <TabsContent value="payments">
          <HistoryList
            empty="Aucun paiement"
            loading={historyQuery.isLoading}
            items={(history?.payments ?? []).map((item) => ({
              id: item.id,
              title: `${item.reference} · ${formatCurrency(item.amount)}`,
              meta: `${formatDate(item.paidAt)} · ${paymentMethodLabels[item.method]}`,
              badge: (
                <StatusBadge
                  label={paymentStatusLabels[item.status]}
                  tone={
                    item.status === "paid"
                      ? "success"
                      : item.status === "pending"
                        ? "warning"
                        : "neutral"
                  }
                />
              ),
            }))}
          />
        </TabsContent>

        <TabsContent value="timeline">
          {historyQuery.isLoading ? (
            <LoadingState />
          ) : timeline.length === 0 ? (
            <EmptyState title="Historique vide" description="Aucun événement pour ce patient." />
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-6">
              {timeline.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="relative">
                  <span className="absolute top-1.5 -left-[1.55rem] size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-foreground/70">{item.detail}</p>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={patient}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />
    </PageContainer>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
      <dt className="text-foreground/70">{label}</dt>
      <dd className="min-w-0 text-foreground">{value}</dd>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-6">
        <p className="text-sm text-foreground/70">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function HistoryList({
  items,
  empty,
  loading,
}: {
  items: Array<{ id: string; title: string; meta: string; badge: React.ReactNode }>;
  empty: string;
  loading?: boolean;
}) {
  if (loading) return <LoadingState />;
  if (items.length === 0) return <EmptyState title={empty} />;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
            <p className="truncate text-xs text-foreground/70">{item.meta}</p>
          </div>
          {item.badge}
        </li>
      ))}
    </ul>
  );
}
