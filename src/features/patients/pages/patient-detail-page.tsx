import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Clock3,
  Ellipsis,
  FileText,
  FolderOpen,
  HeartPulse,
  Mail,
  MapPin,
  MessageSquarePlus,
  Pencil,
  Phone,
  Plus,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/shared/components/layout/page-container";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState } from "@/shared/components/feedback/states";
import { patientsApi, patientKeys } from "@/features/patients/api";
import { PatientFormDialog } from "@/features/patients/components/patient-form-dialog";
import type { Patient, PatientFormValues } from "@/features/patients/types";
import { appointmentsApi } from "@/features/appointments/api";
import { appointmentStatusLabels, appointmentTypeLabels } from "@/features/appointments/types";
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
  initials,
} from "@/shared/utils/format";

type TimelineItem = {
  id: string;
  at: string;
  kind: "appointment" | "consultation" | "prescription" | "payment" | "hospitalization" | "exam";
  title: string;
  detail: string;
};

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

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

  if (patientQuery.isLoading) return <PatientDetailSkeleton />;

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <PageContainer className="space-y-5">
        <BackToPatients />
        <ErrorState
          title="Patient introuvable"
          description="Le dossier patient demandé n'existe pas ou n'est plus disponible."
          onRetry={() => void patientQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const patient = patientQuery.data;
  const history = historyQuery.data;
  const patientName = fullName(patient.firstName, patient.lastName);

  return (
    <PageContainer className="space-y-5 lg:space-y-6">
      <BackToPatients />

      <PatientDetailHeader patient={patient} onEdit={() => setFormOpen(true)} />
      <PatientSummary patient={patient} />

      <Tabs defaultValue="overview" className="space-y-5">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="h-10 w-max min-w-full justify-start gap-1 rounded-lg bg-muted p-1 sm:w-auto">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="personal">Informations personnelles</TabsTrigger>
            <TabsTrigger value="medical">Historique médical</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-5">
              <SectionHeading
                eyebrow="Suivi du dossier"
                title="Vue d'ensemble"
                description="Les informations les plus utiles pour la prise en charge de ce patient."
              />
              <OverviewSummary patient={patient} />
              <OverviewConsultations
                loading={historyQuery.isLoading}
                consultations={history?.consultations ?? []}
                doctorName={doctorName}
              />
              <OverviewDocuments />
              <OverviewNotes patient={patient} />
            </div>
            <QuickActions onEdit={() => setFormOpen(true)} />
          </div>
        </TabsContent>

        <TabsContent value="personal">
          <PersonalInformation patient={patient} />
        </TabsContent>

        <TabsContent value="medical">
          <MedicalHistory patient={patient} timeline={timeline} loading={historyQuery.isLoading} />
        </TabsContent>

        <TabsContent value="consultations">
          <ConsultationHistory
            consultations={history?.consultations ?? []}
            loading={historyQuery.isLoading}
            doctorName={doctorName}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsPanel />
        </TabsContent>

        <TabsContent value="notes">
          <NotesPanel patient={patient} />
        </TabsContent>
      </Tabs>

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={patient}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />

      <span className="sr-only">Dossier de {patientName}</span>
    </PageContainer>
  );
}

function BackToPatients() {
  return (
    <Link
      to="/patients"
      className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Retour aux patients
    </Link>
  );
}

function PatientDetailHeader({ patient, onEdit }: { patient: Patient; onEdit: () => void }) {
  const isArchived = patient.status === "archived";
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="size-16 shrink-0 border border-primary/20 bg-primary/10 sm:size-[4.5rem]">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials(patient.firstName, patient.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {fullName(patient.firstName, patient.lastName)}
              </h1>
              <PatientStatus status={patient.status} />
            </div>
            <p className="text-sm text-muted-foreground">Dossier patient · {patient.reference}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <QuickInfo icon={CalendarDays} value={`${calculateAge(patient.dateOfBirth)} ans`} />
              <QuickInfo icon={MapPin} value={patient.city} />
              <QuickInfo icon={Phone} value={patient.phone} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden="true" />
            Modifier
          </Button>
          <Button
            onClick={() => toast.info("La création de consultation sera disponible prochainement.")}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nouvelle consultation
          </Button>
          <PatientMoreMenu isArchived={isArchived} />
        </div>
      </div>
    </section>
  );
}

function PatientMoreMenu({ isArchived }: { isArchived: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Plus d'actions sur le dossier">
          <Ellipsis className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => toast.info("La création de notes sera disponible prochainement.")}
        >
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          Ajouter une note
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => toast.info("La gestion des documents sera disponible prochainement.")}
        >
          <FileText className="size-4" aria-hidden="true" />
          Ajouter un document
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            toast.info(
              isArchived
                ? "Le dossier peut être réactivé depuis Modifier."
                : "Le dossier peut être archivé depuis Modifier.",
            )
          }
        >
          {isArchived ? (
            <ArchiveRestore className="size-4" aria-hidden="true" />
          ) : (
            <Archive className="size-4" aria-hidden="true" />
          )}
          {isArchived ? "Réactiver" : "Archiver"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PatientSummary({ patient }: { patient: Patient }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            Informations essentielles
          </p>
          <h2 className="mt-1 text-lg font-semibold">Résumé du dossier</h2>
        </div>
        <p className="text-xs text-muted-foreground">Créé le {formatDate(patient.createdAt)}</p>
      </div>
      <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryField
          label="Nom complet"
          value={fullName(patient.firstName, patient.lastName)}
          icon={UserRound}
        />
        <SummaryField
          label="Date de naissance"
          value={`${formatDate(patient.dateOfBirth)} · ${calculateAge(patient.dateOfBirth)} ans`}
          icon={CalendarDays}
        />
        <SummaryField
          label="Sexe"
          value={patient.gender === "female" ? "Femme" : "Homme"}
          icon={UserRound}
        />
        <SummaryField
          label="Statut"
          value={<PatientStatus status={patient.status} />}
          icon={Activity}
        />
        <SummaryField label="Téléphone" value={patient.phone} icon={Phone} />
        <SummaryField label="E-mail" value={patient.email || "Non renseigné"} icon={Mail} />
        <SummaryField label="Ville" value={patient.city} icon={MapPin} />
        <SummaryField label="Adresse" value={patient.address || "Non renseignée"} icon={MapPin} />
      </dl>
    </section>
  );
}

function SummaryField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon: IconType;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5 text-primary" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function QuickInfo({ icon: Icon, value }: { icon: IconType; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 text-primary" aria-hidden="true" />
      {value}
    </span>
  );
}

function PatientStatus({ status }: { status: Patient["status"] }) {
  return (
    <StatusBadge
      label={status === "active" ? "Actif" : "Archivé"}
      tone={status === "active" ? "success" : "neutral"}
    />
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function OverviewSummary({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MetricCard
        icon={HeartPulse}
        label="Groupe sanguin"
        value={patient.bloodGroup}
        detail={patient.insurance || "Assurance non renseignée"}
      />
      <MetricCard
        icon={Activity}
        label="Allergies"
        value={patient.allergies || "Aucune connue"}
        detail="À vérifier avec le patient"
      />
      <MetricCard
        icon={ClipboardList}
        label="Pathologies chroniques"
        value={patient.chronicConditions || "Aucune renseignée"}
        detail="Données du dossier"
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: IconType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {label}
      </div>
      <p className="mt-4 truncate text-sm font-semibold text-foreground">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function QuickActions({ onEdit }: { onEdit: () => void }) {
  return (
    <aside className="h-fit rounded-lg border border-border bg-card p-4 shadow-card lg:sticky lg:top-20">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Activity className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Actions rapides</h2>
          <p className="text-xs text-muted-foreground">Gérer ce dossier</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden="true" />
          Modifier le patient
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => toast.info("La création de consultation sera disponible prochainement.")}
        >
          <Stethoscope className="size-4" aria-hidden="true" />
          Ajouter une consultation
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => toast.info("La création de notes sera disponible prochainement.")}
        >
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          Ajouter une note
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => toast.info("L'ajout de documents sera disponible prochainement.")}
        >
          <FileText className="size-4" aria-hidden="true" />
          Ajouter un document
        </Button>
      </div>
    </aside>
  );
}

function OverviewConsultations({
  consultations,
  loading,
  doctorName,
}: {
  consultations: Array<{
    id: string;
    date: string;
    diagnosis: string;
    doctorId: string;
    status: "draft" | "finalised";
  }>;
  loading: boolean;
  doctorName: (id: string) => string;
}) {
  return (
    <section className="space-y-3">
      <SectionHeading
        title="Dernières consultations"
        description="Les derniers éléments de suivi enregistrés dans le dossier."
      />
      {loading ? <DetailRowsSkeleton rows={2} /> : null}
      {!loading && consultations.length === 0 ? (
        <EmptyState
          title="Aucune consultation"
          description="Aucune consultation n'est encore enregistrée pour ce patient."
        />
      ) : null}
      {!loading && consultations.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-card">
          <ul className="divide-y divide-border">
            {consultations.slice(0, 3).map((consultation) => (
              <li
                key={consultation.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Stethoscope className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {consultation.diagnosis || "Consultation sans diagnostic"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatDate(consultation.date)} · {doctorName(consultation.doctorId)}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  label={consultationStatusLabels[consultation.status]}
                  tone={consultation.status === "finalised" ? "success" : "warning"}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function OverviewDocuments() {
  return (
    <section className="space-y-3">
      <SectionHeading
        title="Documents récents"
        description="Les documents associés à ce dossier apparaîtront ici."
      />
      <EmptyState
        title="Aucun document"
        description="Aucun document n'est encore disponible pour ce patient."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("L'ajout de documents sera disponible prochainement.")}
          >
            <FileText className="size-4" aria-hidden="true" />
            Ajouter un document
          </Button>
        }
      />
    </section>
  );
}

function OverviewNotes({ patient }: { patient: Patient }) {
  return (
    <section className="space-y-3">
      <SectionHeading
        title="Notes récentes"
        description="Les notes utiles à la coordination des soins."
      />
      {patient.notes ? (
        <NoteCard note={patient.notes} date={patient.updatedAt} />
      ) : (
        <EmptyState
          title="Aucune note"
          description="Aucune note n'est encore enregistrée pour ce patient."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("La création de notes sera disponible prochainement.")}
            >
              <MessageSquarePlus className="size-4" aria-hidden="true" />
              Ajouter une note
            </Button>
          }
        />
      )}
    </section>
  );
}

function PersonalInformation({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <InformationSection title="Identité" icon={UserRound}>
        <DetailField label="Prénom" value={patient.firstName} />
        <DetailField label="Nom" value={patient.lastName} />
        <DetailField label="Sexe" value={patient.gender === "female" ? "Femme" : "Homme"} />
        <DetailField
          label="Date de naissance"
          value={`${formatDate(patient.dateOfBirth)} · ${calculateAge(patient.dateOfBirth)} ans`}
        />
      </InformationSection>
      <InformationSection title="Coordonnées" icon={Phone}>
        <DetailField label="Téléphone" value={patient.phone} />
        <DetailField label="E-mail" value={patient.email || "Non renseigné"} />
        <DetailField label="Ville" value={patient.city} />
        <DetailField label="Adresse" value={patient.address || "Non renseignée"} />
      </InformationSection>
      <InformationSection title="Contact d'urgence" icon={HeartPulse}>
        <DetailField label="Nom" value={patient.emergencyContactName || "Non renseigné"} />
        <DetailField label="Téléphone" value={patient.emergencyContactPhone || "Non renseigné"} />
      </InformationSection>
      <InformationSection title="Dossier administratif" icon={FolderOpen}>
        <DetailField label="Référence" value={patient.reference} />
        <DetailField label="Statut" value={<PatientStatus status={patient.status} />} />
        <DetailField label="Créé le" value={formatDate(patient.createdAt)} />
        <DetailField label="Mis à jour le" value={formatDate(patient.updatedAt)} />
      </InformationSection>
    </div>
  );
}

function MedicalHistory({
  patient,
  timeline,
  loading,
}: {
  patient: Patient;
  timeline: TimelineItem[];
  loading: boolean;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <SectionHeading
          title="Historique médical"
          description="Les informations cliniques saisies dans le dossier patient."
        />
        <InformationSection title="Antécédents et suivi" icon={HeartPulse}>
          <DetailField label="Allergies" value={patient.allergies || "Aucune connue"} />
          <DetailField
            label="Pathologies chroniques"
            value={patient.chronicConditions || "Aucune renseignée"}
          />
          <DetailField label="Groupe sanguin" value={patient.bloodGroup} />
          <DetailField label="Assurance" value={patient.insurance || "Non renseignée"} />
          <div className="sm:col-span-2">
            <DetailField
              label="Antécédents médicaux"
              value={patient.medicalHistory || "Aucun antécédent renseigné"}
            />
          </div>
        </InformationSection>
      </div>
      <TimelinePanel timeline={timeline} loading={loading} />
    </div>
  );
}

function ConsultationHistory({
  consultations,
  loading,
  doctorName,
}: {
  consultations: Array<{
    id: string;
    date: string;
    diagnosis: string;
    doctorId: string;
    symptoms: string;
    status: "draft" | "finalised";
  }>;
  loading: boolean;
  doctorName: (id: string) => string;
}) {
  if (loading) return <DetailRowsSkeleton rows={4} />;
  if (consultations.length === 0)
    return (
      <EmptyState
        title="Aucune consultation"
        description="Aucune consultation n'est encore enregistrée pour ce patient."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("La création de consultation sera disponible prochainement.")}
          >
            <Plus className="size-4" aria-hidden="true" />
            Ajouter une consultation
          </Button>
        }
      />
    );
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Consultations"
        description="L'historique des consultations enregistrées pour ce dossier."
      />
      <ul className="divide-y divide-border rounded-lg border border-border bg-card shadow-card">
        {consultations.map((consultation) => (
          <li
            key={consultation.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex min-w-0 gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Stethoscope className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">
                  {consultation.diagnosis || "Consultation sans diagnostic"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(consultation.date)} · {doctorName(consultation.doctorId)}
                </p>
                {consultation.symptoms ? (
                  <p className="mt-2 text-sm text-foreground/80">{consultation.symptoms}</p>
                ) : null}
              </div>
            </div>
            <StatusBadge
              label={consultationStatusLabels[consultation.status]}
              tone={consultation.status === "finalised" ? "success" : "warning"}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TimelinePanel({ timeline, loading }: { timeline: TimelineItem[]; loading: boolean }) {
  return (
    <section className="h-fit rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Clock3 className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Activité récente</h2>
          <p className="text-xs text-muted-foreground">Chronologie du dossier</p>
        </div>
      </div>
      <div className="mt-5">
        {loading ? <DetailRowsSkeleton rows={3} /> : null}
        {!loading && timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement clinique disponible.</p>
        ) : null}
        {!loading && timeline.length > 0 ? (
          <ol className="relative space-y-5 border-l border-border pl-5">
            {timeline.slice(0, 6).map((item) => (
              <li key={`${item.kind}-${item.id}`} className="relative">
                <span className="absolute top-1.5 -left-[1.35rem] size-2.5 rounded-full bg-primary ring-4 ring-card" />
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}

function DocumentsPanel() {
  return (
    <div className="space-y-4">
      <SectionHeading
        title="Documents"
        description="Centralisez les documents utiles au suivi de ce patient."
      />
      <EmptyState
        title="Aucun document"
        description="Les documents associés au dossier seront affichés ici."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("L'ajout de documents sera disponible prochainement.")}
          >
            <FileText className="size-4" aria-hidden="true" />
            Ajouter un document
          </Button>
        }
      />
    </div>
  );
}

function NotesPanel({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      <SectionHeading
        title="Notes"
        description="Les informations de coordination saisies pour ce dossier."
      />
      {patient.notes ? (
        <NoteCard note={patient.notes} date={patient.updatedAt} />
      ) : (
        <EmptyState
          title="Aucune note"
          description="Aucune note n'est encore enregistrée pour ce patient."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("La création de notes sera disponible prochainement.")}
            >
              <MessageSquarePlus className="size-4" aria-hidden="true" />
              Ajouter une note
            </Button>
          }
        />
      )}
    </div>
  );
}

function NoteCard({ note, date }: { note: string; date: string }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <MessageSquarePlus className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold">Note du dossier</h3>
            <span className="text-xs text-muted-foreground">Mise à jour le {formatDate(date)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-foreground/80">{note}</p>
        </div>
      </div>
    </article>
  );
}

function InformationSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: IconType;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function DetailRowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="size-9 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <PageContainer className="space-y-5 lg:space-y-6">
      <Skeleton className="h-5 w-36" />
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <Skeleton className="h-5 w-48" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </section>
      <Skeleton className="h-10 w-full max-w-3xl" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <DetailRowsSkeleton rows={3} />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </PageContainer>
  );
}
