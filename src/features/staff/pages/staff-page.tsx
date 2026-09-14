import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, MoreHorizontal, Pencil, Plus, Trash2, UserRound } from "lucide-react";
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
import { fullName } from "@/shared/utils/format";
import { cn } from "@/lib/utils";
import { staffApi, staffKeys } from "@/features/staff/api";
import { StaffFormDialog } from "@/features/staff/components/staff-form-dialog";
import { StaffPlanningSheet } from "@/features/staff/components/staff-planning-sheet";
import {
  shiftPreferenceLabels,
  staffRoleLabels,
  staffRoles,
  staffStatusLabels,
  staffStatuses,
  type ShiftPreference,
  type StaffFormValues,
  type StaffMember,
  type StaffRole,
  type StaffStatus,
} from "@/features/staff/types";

const DEFAULT_PAGE_SIZE = 10;

const statusTone: Record<StaffStatus, StatusTone> = {
  active: "success",
  on_leave: "warning",
  inactive: "danger",
};

export function StaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { departmentName, departmentOptions } = useLookups();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StaffStatus | "all">("all");
  const [role, setRole] = useState<StaffRole | "all">("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | undefined>();
  const [toDelete, setToDelete] = useState<StaffMember | undefined>();
  const [planningMember, setPlanningMember] = useState<StaffMember | undefined>();

  const listQuery = useQuery({
    queryKey: staffKeys.list({
      page,
      pageSize,
      status,
      role,
      departmentId,
      sortBy: "lastName",
      sortDir: "asc",
      ...(search ? { search } : {}),
    }),
    queryFn: () =>
      staffApi.list({
        page,
        pageSize,
        status,
        role,
        departmentId,
        sortBy: "lastName",
        sortDir: "asc",
        ...(search ? { search } : {}),
      }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: staffKeys.all });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: StaffFormValues) => {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        departmentId: values.departmentId,
        status: values.status,
        createdAt: editing?.createdAt ?? new Date().toISOString().slice(0, 10),
        ...(values.shiftPreference
          ? { shiftPreference: values.shiftPreference as ShiftPreference }
          : {}),
      };
      if (editing) return staffApi.update(editing.id, payload);
      return staffApi.create(payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Personnel mis à jour" : "Personnel créé");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer le personnel"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Personnel supprimé");
      setToDelete(undefined);
    },
    onError: () => toast.error("Impossible de supprimer le personnel"),
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
            placeholder="Rechercher un membre…"
            label="Recherche personnel"
            className="min-w-0 flex-1 sm:max-w-none"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FilterSelect
              label="Rôle"
              value={role}
              onChange={(value) => {
                setRole(value as StaffRole | "all");
                setPage(1);
              }}
              allLabel="Tous les rôles"
              options={staffRoles.map((item) => ({ value: item, label: staffRoleLabels[item] }))}
              className="w-full min-w-[9rem] sm:w-44"
            />
            <FilterSelect
              label="Statut"
              value={status}
              onChange={(value) => {
                setStatus(value as StaffStatus | "all");
                setPage(1);
              }}
              allLabel="Tous les statuts"
              options={staffStatuses.map((item) => ({ value: item, label: staffStatusLabels[item] }))}
              className="w-full min-w-[9rem] sm:w-40"
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
          description="Impossible de charger le personnel."
          onRetry={() => void listQuery.refetch()}
        />
      ) : null}
      {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
        <EmptyState title="Aucun personnel" description="Ajoutez un membre de l'équipe soignante." />
      ) : null}

      {!listQuery.isLoading && !listQuery.isError && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((member) => (
            <article
              key={member.id}
              role="button"
              tabIndex={0}
              onClick={() => void navigate({ to: "/staff/$id", params: { id: member.id } })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void navigate({ to: "/staff/$id", params: { id: member.id } });
                }
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left outline-none transition-colors",
                "hover:border-primary/25 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pr-6">
                  <p className="truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
                    {fullName(member.firstName, member.lastName)}
                  </p>
                  <p className="truncate text-xs text-foreground">{staffRoleLabels[member.role]}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2.5 right-2 size-8"
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Actions ${member.lastName}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setPlanningMember(member)}>
                      <CalendarRange className="size-4" />
                      Planning
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(member);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setToDelete(member)}
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={staffStatusLabels[member.status]} tone={statusTone[member.status]} />
                <span className="text-xs font-medium text-foreground">
                  {member.shiftPreference ? shiftPreferenceLabels[member.shiftPreference] : "Vacation libre"}
                </span>
              </div>

              <div className="mt-auto space-y-2 border-t border-border/70 pt-3 text-sm">
                <p className="truncate font-medium">{departmentName(member.departmentId)}</p>
                <p className="truncate">{member.phone}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPlanningMember(member);
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

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editing}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <StaffPlanningSheet
        open={Boolean(planningMember)}
        member={planningMember}
        onOpenChange={(open) => {
          if (!open) setPlanningMember(undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined);
        }}
        title="Supprimer ce membre ?"
        description={`${toDelete ? fullName(toDelete.firstName, toDelete.lastName) : ""} sera retiré.`}
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
