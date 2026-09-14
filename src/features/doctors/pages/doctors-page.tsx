import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, MoreHorizontal, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/shared/components/layout/page-container";
import { SearchInput } from "@/shared/components/forms/search-input";
import { FilterSelect } from "@/shared/components/forms/filter-select";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { DataTablePagination } from "@/shared/components/data-table/data-table";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatCurrency, fullName } from "@/shared/utils/format";
import { cn } from "@/lib/utils";
import { doctorsApi, doctorKeys } from "@/features/doctors/api";
import { DoctorFormDialog } from "@/features/doctors/components/doctor-form-dialog";
import { DoctorPlanningSheet } from "@/features/doctors/components/doctor-planning-sheet";
import {
  doctorStatuses,
  doctorStatusLabels,
  specialties,
  specialtyLabels,
  weekdayLabels,
  type Doctor,
  type DoctorFormValues,
  type DoctorStatus,
  type Specialty,
} from "@/features/doctors/types";

const DEFAULT_PAGE_SIZE = 10;

const statusTone: Record<DoctorStatus, StatusTone> = {
  available: "success",
  on_leave: "warning",
  inactive: "danger",
};

export function DoctorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { departmentName, departmentOptions } = useLookups();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DoctorStatus | "all">("all");
  const [specialty, setSpecialty] = useState<Specialty | "all">("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | undefined>();
  const [toDelete, setToDelete] = useState<Doctor | undefined>();
  const [planningDoctor, setPlanningDoctor] = useState<Doctor | undefined>();

  const listQuery = useQuery({
    queryKey: doctorKeys.list({
      page,
      pageSize,
      status,
      specialty,
      departmentId,
      sortBy: "lastName",
      sortDir: "asc",
      ...(search ? { search } : {}),
    }),
    queryFn: () =>
      doctorsApi.list({
        page,
        pageSize,
        status,
        specialty,
        departmentId,
        sortBy: "lastName",
        sortDir: "asc",
        ...(search ? { search } : {}),
      }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: doctorKeys.all });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: DoctorFormValues) => {
      if (editing) return doctorsApi.update(editing.id, values);
      return doctorsApi.create(values);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Médecin mis à jour" : "Médecin créé");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer le médecin"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => doctorsApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Médecin supprimé");
      setToDelete(undefined);
    },
    onError: () => toast.error("Impossible de supprimer le médecin"),
  });

  const items = listQuery.data?.items ?? [];

  return (
    <PageContainer className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Rechercher un médecin…"
            label="Recherche médecins"
            className="min-w-0 flex-1 sm:max-w-none"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FilterSelect
              label="Statut"
              value={status}
              onChange={(value) => {
                setStatus(value as DoctorStatus | "all");
                setPage(1);
              }}
              allLabel="Tous les statuts"
              options={doctorStatuses.map((item) => ({
                value: item,
                label: doctorStatusLabels[item],
              }))}
              className="w-full min-w-[9rem] sm:w-40"
            />
            <FilterSelect
              label="Spécialité"
              value={specialty}
              onChange={(value) => {
                setSpecialty(value as Specialty | "all");
                setPage(1);
              }}
              allLabel="Toutes spécialités"
              options={specialties.map((item) => ({ value: item, label: specialtyLabels[item] }))}
              className="w-full min-w-[9rem] sm:w-44"
            />
            <FilterSelect
              label="Département"
              value={departmentId}
              onChange={(value) => {
                setDepartmentId(value);
                setPage(1);
              }}
              options={departmentOptions.map((dep) => ({ value: dep.id, label: dep.label }))}
              allLabel="Tous les départements"
              className="w-full min-w-[10rem] sm:w-48"
            />
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {listQuery.isLoading ? <LoadingState /> : null}
      {listQuery.isError ? (
        <ErrorState
          description="Impossible de charger les médecins."
          onRetry={() => void listQuery.refetch()}
        />
      ) : null}
      {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
        <EmptyState title="Aucun médecin" description="Ajoutez un membre de l'équipe médicale." />
      ) : null}

      {!listQuery.isLoading && !listQuery.isError && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((doctor) => (
            <article
              key={doctor.id}
              role="button"
              tabIndex={0}
              onClick={() => void navigate({ to: "/doctors/$id", params: { id: doctor.id } })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void navigate({ to: "/doctors/$id", params: { id: doctor.id } });
                }
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left outline-none transition-colors",
                "hover:border-primary/25 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <Stethoscope className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pr-6">
                  <p className="truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
                    Dr. {fullName(doctor.firstName, doctor.lastName)}
                  </p>
                  <p className="truncate text-xs text-foreground">{specialtyLabels[doctor.specialty]}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2.5 right-2 size-8"
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Actions ${doctor.lastName}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setPlanningDoctor(doctor)}>
                      <CalendarRange className="size-4" />
                      Planning
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(doctor);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setToDelete(doctor)}
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={doctorStatusLabels[doctor.status]} tone={statusTone[doctor.status]} />
                <span className="text-xs font-medium text-foreground">
                  {formatCurrency(doctor.consultationFee)}
                </span>
              </div>

              <div className="mt-auto space-y-2 border-t border-border/70 pt-3 text-sm">
                <p className="truncate font-medium">
                  {doctor.departmentId ? departmentName(doctor.departmentId) : "Sans département"}
                </p>
                <p className="truncate">
                  {doctor.availableDays.map((day) => weekdayLabels[day]).join(" · ")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPlanningDoctor(doctor);
                  }}
                >
                  <CalendarRange className="size-4" />
                  Voir le planning
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <DataTablePagination
        page={listQuery.data?.page ?? page}
        totalPages={listQuery.data?.totalPages ?? 1}
        total={listQuery.data?.total ?? 0}
        pageSize={listQuery.data?.pageSize ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        pageSizeOptions={[10, 15, 20, 25]}
      />

      <DoctorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        doctor={editing}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <DoctorPlanningSheet
        open={Boolean(planningDoctor)}
        doctor={planningDoctor}
        onOpenChange={(open) => {
          if (!open) setPlanningDoctor(undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined);
        }}
        title="Supprimer le médecin ?"
        description={`Dr. ${toDelete ? fullName(toDelete.firstName, toDelete.lastName) : ""} sera retiré.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        onConfirm={() => {
          if (toDelete) deleteMutation.mutate(toDelete.id);
        }}
      />
    </PageContainer>
  );
}
