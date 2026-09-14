import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, MoreHorizontal, Pencil, Plus, Trash2, Wrench } from "lucide-react";
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
import { formatDate } from "@/shared/utils/format";
import { cn } from "@/lib/utils";
import { roomsApi } from "@/features/rooms/api";
import {
  equipmentApi,
  equipmentCategories,
  equipmentKeys,
  equipmentStatusLabels,
  EquipmentFormDialog,
  type Equipment,
  type EquipmentFormValues,
  type EquipmentListQuery,
} from "@/features/equipment";
import { EquipmentPlanningSheet } from "@/features/equipment/components/equipment-planning-sheet";

const DEFAULT_PAGE_SIZE = 10;

const statusTone: Record<Equipment["status"], StatusTone> = {
  available: "success",
  in_use: "info",
  maintenance: "warning",
  retired: "danger",
};

export function EquipmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { departmentName, departmentOptions } = useLookups();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Equipment["status"]>("all");
  const [category, setCategory] = useState<"all" | Equipment["category"]>("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planningItem, setPlanningItem] = useState<Equipment | undefined>();
  const [editing, setEditing] = useState<Equipment | undefined>();
  const [deleting, setDeleting] = useState<Equipment | undefined>();

  const rooms = useQuery({
    queryKey: ["rooms", "lookup"],
    queryFn: () => roomsApi.peekAll(),
    staleTime: 30_000,
  });

  const roomName = (id: string) => rooms.data?.find((room) => room.id === id)?.name ?? "Salle non renseignée";

  const query: EquipmentListQuery = {
    search,
    status,
    category,
    departmentId,
    page,
    pageSize,
    sortBy: "name",
    sortDir: "asc",
  };

  const list = useQuery({
    queryKey: equipmentKeys.list(query),
    queryFn: () => equipmentApi.list(query),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: EquipmentFormValues) => {
      const payload = { ...values, roomId: values.roomId ?? "" };
      if (editing) return equipmentApi.update(editing.id, payload);
      return equipmentApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Matériel mis à jour" : "Matériel ajouté");
      setDialogOpen(false);
      setEditing(undefined);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer le matériel"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => equipmentApi.remove(id),
    onSuccess: () => {
      toast.success("Matériel supprimé");
      setDeleting(undefined);
      invalidate();
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const items = list.data?.items ?? [];

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
            placeholder="Rechercher du matériel…"
            label="Recherche matériel"
            className="min-w-0 flex-1 sm:max-w-none"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FilterSelect
              label="Statut"
              value={status ?? "all"}
              onChange={(value) => {
                setStatus(value as "all" | Equipment["status"]);
                setPage(1);
              }}
              options={Object.entries(equipmentStatusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              allLabel="Tous les statuts"
              className="w-full min-w-[9rem] sm:w-40"
            />
            <FilterSelect
              label="Catégorie"
              value={category}
              onChange={(value) => {
                setCategory(value as "all" | Equipment["category"]);
                setPage(1);
              }}
              options={equipmentCategories.map((value) => ({ value, label: value }))}
              allLabel="Toutes les catégories"
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
          description="Impossible de charger le matériel."
          onRetry={() => void list.refetch()}
        />
      ) : null}
      {!list.isLoading && !list.isError && items.length === 0 ? (
        <EmptyState title="Aucun matériel" description="Ajoutez un équipement à l'inventaire." />
      ) : null}

      {!list.isLoading && !list.isError && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => void navigate({ to: "/equipment/$id", params: { id: item.id } })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void navigate({ to: "/equipment/$id", params: { id: item.id } });
                }
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left outline-none transition-colors",
                "hover:border-primary/25 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <Wrench className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pr-6">
                  <p className="truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-foreground">{item.reference}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2.5 right-2 size-8"
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Actions ${item.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setPlanningItem(item)}>
                      <CalendarRange className="size-4" />
                      Planning
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(item);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={equipmentStatusLabels[item.status]} tone={statusTone[item.status]} />
                <span className="text-xs font-medium text-foreground">{item.category}</span>
              </div>

              <div className="mt-auto space-y-2 border-t border-border/70 pt-3 text-sm">
                <p className="truncate font-medium">{departmentName(item.departmentId)}</p>
                <p className="truncate">{roomName(item.roomId)}</p>
                <p className="flex items-center gap-1.5">
                  <CalendarRange className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    Prochaine maint.{" "}
                    {item.nextMaintenanceAt ? formatDate(item.nextMaintenanceAt) : "non planifiée"}
                  </span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPlanningItem(item);
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
        page={list.data?.page ?? page}
        totalPages={list.data?.totalPages ?? 1}
        total={list.data?.total ?? 0}
        pageSize={list.data?.pageSize ?? pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        pageSizeOptions={[10, 15, 20, 25]}
      />

      <EquipmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        equipment={editing}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <EquipmentPlanningSheet
        open={Boolean(planningItem)}
        equipment={planningItem}
        roomName={planningItem ? roomName(planningItem.roomId) : undefined}
        onOpenChange={(open) => {
          if (!open) setPlanningItem(undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        title="Supprimer le matériel ?"
        description={`« ${deleting?.name ?? ""} » sera retiré de l'inventaire.`}
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
