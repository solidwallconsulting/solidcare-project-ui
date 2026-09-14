import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { DataTablePagination } from "@/shared/components/data-table/data-table";
import { useLookups } from "@/shared/hooks/use-lookups";
import { cn } from "@/lib/utils";
import {
  departmentsApi,
  departmentKeys,
  DepartmentFormDialog,
  departmentStatusLabels,
  type Department,
  type DepartmentFormValues,
  type DepartmentListQuery,
} from "@/features/departments";

const DEFAULT_PAGE_SIZE = 8;

const statusTone: Record<Department["status"], StatusTone> = {
  active: "success",
  inactive: "neutral",
};

export function DepartmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { doctorName } = useLookups();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Department["status"]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | undefined>();
  const [deleting, setDeleting] = useState<Department | undefined>();

  const query: DepartmentListQuery = {
    search,
    status,
    page,
    pageSize,
    sortBy: "name",
    sortDir: "asc",
  };

  const list = useQuery({
    queryKey: departmentKeys.list(query),
    queryFn: () => departmentsApi.list(query),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: departmentKeys.all });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: DepartmentFormValues) => {
      if (editing) {
        return departmentsApi.update(editing.id, values);
      }
      return departmentsApi.create({
        ...values,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    },
    onSuccess: () => {
      toast.success(editing ? "Département mis à jour" : "Département créé");
      setDialogOpen(false);
      setEditing(undefined);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer le département"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.remove(id),
    onSuccess: () => {
      toast.success("Département supprimé");
      setDeleting(undefined);
      invalidate();
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const items = list.data?.items ?? [];

  return (
    <PageContainer className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Rechercher un département…"
            label="Recherche départements"
            className="min-w-0 flex-1 sm:max-w-none"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FilterSelect
              label="Statut"
              value={status ?? "all"}
              onChange={(value) => {
                setStatus(value as "all" | Department["status"]);
                setPage(1);
              }}
              options={[
                { value: "active", label: "Actif" },
                { value: "inactive", label: "Inactif" },
              ]}
              allLabel="Tous les statuts"
              className="w-full min-w-[10rem] sm:w-44"
            />
            <Button
              className="w-full sm:ml-auto sm:w-auto"
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {list.isLoading ? <LoadingState /> : null}

      {list.isError ? (
        <ErrorState
          description="Impossible de charger les départements."
          onRetry={() => void list.refetch()}
        />
      ) : null}

      {!list.isLoading && !list.isError && items.length === 0 ? (
        <EmptyState
          title="Aucun département"
          description="Créez le premier département de la clinique."
        />
      ) : null}

      {!list.isLoading && !list.isError && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((department) => (
            <article
              key={department.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                void navigate({ to: "/departments/$id", params: { id: department.id } })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void navigate({ to: "/departments/$id", params: { id: department.id } });
                }
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left outline-none transition-colors",
                "hover:border-primary/25 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pr-6">
                  <p className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                    {department.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{department.code}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2.5 right-2 size-8 opacity-70 group-hover:opacity-100"
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Actions ${department.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(department);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleting(department)}
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={departmentStatusLabels[department.status]}
                  tone={statusTone[department.status]}
                />
                <span className="text-xs text-muted-foreground">Étage {department.floor}</span>
              </div>

              <div className="mt-auto space-y-1.5 border-t border-border/70 pt-3 text-sm">
                <p className="truncate text-muted-foreground">
                  Chef ·{" "}
                  <span className="font-medium text-foreground">
                    {doctorName(department.headDoctorId)}
                  </span>
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {department.doctorIds.length} médecin
                    {department.doctorIds.length > 1 ? "s" : ""}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <DataTablePagination
        page={list.data?.page ?? page}
        totalPages={list.data?.totalPages ?? 1}
        total={list.data?.total ?? 0}
        pageSize={list.data?.pageSize ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        pageSizeOptions={[8, 12, 16, 24]}
      />

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editing}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        title="Supprimer le département ?"
        description={`« ${deleting?.name ?? ""} » sera retiré de l'organisation. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id);
        }}
      />
    </PageContainer>
  );
}
