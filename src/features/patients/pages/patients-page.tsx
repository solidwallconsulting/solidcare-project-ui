import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  Ellipsis,
  FolderOpen,
  LayoutGrid,
  List,
  Pencil,
  Phone,
  Plus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { ErrorState, EmptyState } from "@/shared/components/feedback/states";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { FilterSelect } from "@/shared/components/forms/filter-select";
import { SearchInput } from "@/shared/components/forms/search-input";
import { patientsApi, patientKeys } from "@/features/patients/api";
import { PatientFormDialog } from "@/features/patients/components/patient-form-dialog";
import type { Patient, PatientFormValues, PatientStatus } from "@/features/patients/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculateAge, formatDate, fullName, initials } from "@/shared/utils/format";
import { nextReference, todayIsoDate, toggleSort } from "@/shared/utils/resource-helpers";

const PAGE_SIZE = 10;
type PatientView = "table" | "cards";

function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return (
    <StatusBadge
      label={status === "active" ? "Actif" : "Archivé"}
      tone={status === "active" ? "success" : "neutral"}
    />
  );
}

function PatientActionMenu({
  patient,
  onView,
  onEdit,
  onStatusChange,
}: {
  patient: Patient;
  onView: () => void;
  onEdit: () => void;
  onStatusChange: () => void;
}) {
  const isArchived = patient.status === "archived";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions pour ${fullName(patient.firstName, patient.lastName)}`}
          onClick={(event) => event.stopPropagation()}
        >
          <Ellipsis className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={onView}>
          <FolderOpen className="size-4" aria-hidden="true" />
          Voir le dossier
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="size-4" aria-hidden="true" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onStatusChange}>
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

function PatientAvatar({ patient }: { patient: Patient }) {
  return (
    <Avatar className="size-9 border border-primary/15 bg-primary/10">
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {initials(patient.firstName, patient.lastName)}
      </AvatarFallback>
    </Avatar>
  );
}

function PatientListSkeleton({ view }: { view: PatientView }) {
  if (view === "table") {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="h-11 border-b bg-muted/40" />
        <div className="space-y-0 divide-y">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex h-[72px] items-center gap-5 px-4">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <Skeleton className="h-8 w-[22%]" />
              <Skeleton className="h-5 w-[16%]" />
              <Skeleton className="h-5 w-[12%]" />
              <Skeleton className="h-5 w-[9%]" />
              <Skeleton className="ml-auto h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

function PatientPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pages = Array.from({ length: safeTotalPages }, (_, index) => index + 1).filter(
    (pageNumber) =>
      safeTotalPages <= 5 ||
      pageNumber === 1 ||
      pageNumber === safeTotalPages ||
      Math.abs(pageNumber - page) <= 1,
  );

  return (
    <nav
      aria-label="Pagination des patients"
      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm tabular-nums text-muted-foreground">
        {from}–{to} sur {total}
      </p>
      <div className="flex items-center gap-1.5" aria-label="Pages">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Page précédente"
        >
          Précédent
        </Button>
        <div className="flex items-center gap-1" aria-label="Numéros de page">
          {pages.map((pageNumber, index) => (
            <span key={pageNumber} className="flex items-center gap-1">
              {index > 0 && pageNumber - pages[index - 1] > 1 ? (
                <span aria-hidden="true" className="px-1 text-sm text-muted-foreground">
                  …
                </span>
              ) : null}
              <Button
                variant={pageNumber === page ? "default" : "ghost"}
                size="sm"
                className="min-w-8 px-2"
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === page ? "page" : undefined}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            </span>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Page suivante"
        >
          Suivant
        </Button>
      </div>
    </nav>
  );
}

export function PatientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PatientStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<PatientView>("table");
  const [sort, setSort] = useState<{ sortBy?: string; sortDir: "asc" | "desc" }>({
    sortBy: "lastName",
    sortDir: "asc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | undefined>();

  useEffect(() => {
    if (isMobile) setView("cards");
  }, [isMobile]);

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  };

  const listQuery = useQuery({
    queryKey: patientKeys.list(query),
    queryFn: () => patientsApi.list(query),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      if (editing) return patientsApi.update(editing.id, values);
      return patientsApi.create({
        ...values,
        reference: nextReference("P"),
        createdAt: todayIsoDate(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      toast.success(editing ? "Patient mis à jour" : "Patient créé");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer le patient"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status: nextStatus }: { id: string; status: PatientStatus }) =>
      patientsApi.update(id, { status: nextStatus }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      toast.success(variables.status === "archived" ? "Patient archivé" : "Patient réactivé");
    },
    onError: () => toast.error("Impossible de modifier le statut du patient"),
  });

  const patients = listQuery.data?.items ?? [];
  const openPatient = (patient: Patient) =>
    void navigate({ to: "/patients/$id", params: { id: patient.id } });
  const editPatient = (patient: Patient) => {
    setEditing(patient);
    setFormOpen(true);
  };
  const togglePatientStatus = (patient: Patient) =>
    statusMutation.mutate({
      id: patient.id,
      status: patient.status === "active" ? "archived" : "active",
    });

  return (
    <PageContainer className="flex min-h-[calc(100dvh-3.5rem)] flex-col space-y-0 pb-4 lg:py-6">
      <PageHeader
        title="Patients"
        description="Dossiers patients de la clinique (données démo)."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nouveau patient
          </Button>
        }
      />

      <div className="mt-6 rounded-lg border border-border bg-card p-3 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            className="sm:max-w-md lg:flex-1"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Rechercher par nom, ID ou téléphone…"
            label="Rechercher un patient par nom, identifiant ou téléphone"
          />
          <div className="flex items-center gap-2 sm:justify-between lg:justify-end">
            <FilterSelect
              label="Filtrer par statut"
              value={status}
              onChange={(value) => {
                setStatus(value as PatientStatus | "all");
                setPage(1);
              }}
              allLabel="Tous les statuts"
              options={[
                { value: "active", label: "Actif" },
                { value: "archived", label: "Archivé" },
              ]}
              className="min-w-44 flex-1 sm:flex-none"
            />
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(nextView) => {
                if (nextView) setView(nextView as PatientView);
              }}
              variant="outline"
              size="sm"
              aria-label="Mode d'affichage des patients"
              className="shrink-0 rounded-md border border-input p-0.5 shadow-sm"
            >
              <ToggleGroupItem
                value="table"
                aria-label="Vue tableau"
                title="Vue tableau"
                className="gap-1.5 px-2 sm:px-2.5"
              >
                <List aria-hidden="true" />
                <span className="hidden sm:inline">Tableau</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="cards"
                aria-label="Vue cartes"
                title="Vue cartes"
                className="gap-1.5 px-2 sm:px-2.5"
              >
                <LayoutGrid aria-hidden="true" />
                <span className="hidden sm:inline">Cartes</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <section
        aria-label="Liste des patients"
        className="mt-4 flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card"
      >
        <div className="min-h-0 flex-1 p-0">
          {listQuery.isLoading ? (
            <div className="p-4">
              <PatientListSkeleton view={view} />
            </div>
          ) : null}
          {listQuery.isError ? (
            <div className="p-4">
              <ErrorState
                title="Impossible de charger les patients"
                description="Les dossiers n’ont pas pu être chargés. Réessayez dans un instant."
                onRetry={() => void listQuery.refetch()}
              />
            </div>
          ) : null}
          {!listQuery.isLoading && !listQuery.isError && patients.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title={
                  search || status !== "all" ? "Aucun patient trouvé" : "Aucun patient enregistré"
                }
                description={
                  search || status !== "all"
                    ? "Essayez de modifier votre recherche ou vos filtres."
                    : "Créez un premier dossier patient pour commencer."
                }
                action={
                  search || status !== "all" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setStatus("all");
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : null}
          {!listQuery.isLoading && !listQuery.isError && patients.length > 0 && view === "table" ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="h-11 bg-muted/40 hover:bg-muted/40">
                    <SortableHead
                      label="Patient"
                      sortKey="lastName"
                      sort={sort}
                      onSortChange={(key) => {
                        setSort((current) => toggleSort(current, key));
                        setPage(1);
                      }}
                    />
                    <TableHead>Téléphone</TableHead>
                    <SortableHead
                      label="Ville"
                      sortKey="city"
                      sort={sort}
                      onSortChange={(key) => {
                        setSort((current) => toggleSort(current, key));
                        setPage(1);
                      }}
                    />
                    <TableHead className="hidden text-right lg:table-cell">Âge</TableHead>
                    <TableHead>Statut</TableHead>
                    <SortableHead
                      label="Créé le"
                      sortKey="createdAt"
                      sort={sort}
                      className="hidden lg:table-cell"
                      onSortChange={(key) => {
                        setSort((current) => toggleSort(current, key));
                        setPage(1);
                      }}
                    />
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id} className="h-[72px] hover:bg-accent/45">
                      <TableCell className="py-3 pl-4">
                        <div className="flex min-w-[13rem] items-center gap-3">
                          <PatientAvatar patient={patient} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openPatient(patient)}
                              className="block max-w-full truncate text-left font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {fullName(patient.firstName, patient.lastName)}
                            </button>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {patient.reference}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{patient.phone}</TableCell>
                      <TableCell>{patient.city}</TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">
                        {calculateAge(patient.dateOfBirth)} ans
                      </TableCell>
                      <TableCell>
                        <PatientStatusBadge status={patient.status} />
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap lg:table-cell">
                        {formatDate(patient.createdAt)}
                      </TableCell>
                      <TableCell className="pr-3 text-right">
                        <PatientActionMenu
                          patient={patient}
                          onView={() => openPatient(patient)}
                          onEdit={() => editPatient(patient)}
                          onStatusChange={() => togglePatientStatus(patient)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
          {!listQuery.isLoading && !listQuery.isError && patients.length > 0 && view === "cards" ? (
            <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {patients.map((patient) => (
                <article
                  key={patient.id}
                  className="flex min-h-[218px] flex-col rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-accent/20"
                >
                  <div className="flex items-start gap-3">
                    <PatientAvatar patient={patient} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openPatient(patient)}
                        className="block max-w-full truncate text-left font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {fullName(patient.firstName, patient.lastName)}
                      </button>
                      <p className="mt-0.5 text-xs text-muted-foreground">{patient.reference}</p>
                    </div>
                    <PatientActionMenu
                      patient={patient}
                      onView={() => openPatient(patient)}
                      onEdit={() => editPatient(patient)}
                      onStatusChange={() => togglePatientStatus(patient)}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <PatientStatusBadge status={patient.status} />
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {calculateAge(patient.dateOfBirth)} ans
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t pt-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-muted-foreground">Téléphone</dt>
                      <dd className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate">
                        <Phone className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        {patient.phone}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-muted-foreground">Ville</dt>
                      <dd className="mt-0.5 truncate">{patient.city}</dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-xs font-medium text-muted-foreground">Créé le</dt>
                      <dd className="mt-0.5 flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-primary" aria-hidden="true" />
                        {formatDate(patient.createdAt)}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto w-full"
                    onClick={() => openPatient(patient)}
                  >
                    <FolderOpen className="size-4" aria-hidden="true" />
                    Voir le dossier
                  </Button>
                </article>
              ))}
            </div>
          ) : null}
        </div>
        {listQuery.data && !listQuery.isError ? (
          <div className="mt-auto border-t bg-muted/20">
            <PatientPagination
              page={listQuery.data.page}
              totalPages={listQuery.data.totalPages}
              total={listQuery.data.total}
              pageSize={listQuery.data.pageSize}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editing}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />
    </PageContainer>
  );
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSortChange,
  className,
}: {
  label: string;
  sortKey: string;
  sort: { sortBy?: string; sortDir: "asc" | "desc" };
  onSortChange: (key: string) => void;
  className?: string;
}) {
  const active = sort.sortBy === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSortChange(sortKey)}
        className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <span className="text-xs" aria-hidden="true">
          {active ? (sort.sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
        <span className="sr-only">
          {active
            ? `, tri ${sort.sortDir === "asc" ? "croissant" : "décroissant"}`
            : ", activer le tri"}
        </span>
      </button>
    </TableHead>
  );
}
