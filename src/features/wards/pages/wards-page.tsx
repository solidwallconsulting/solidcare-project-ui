import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, CalendarRange, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
  bedsApi,
  bedKeys,
  BedFormDialog,
  wardsApi,
  wardKeys,
  WardRoomFormDialog,
  wardRoomStatusLabels,
  wardRoomTypeLabels,
  wardRoomTypes,
  type Bed,
  type BedFormValues,
  type WardRoom,
  type WardRoomFormValues,
  type WardRoomListQuery,
} from "@/features/wards";
import { WardPlanningSheet } from "@/features/wards/components/ward-planning-sheet";

const DEFAULT_PAGE_SIZE = 10;

const statusTone: Record<WardRoom["status"], StatusTone> = {
  available: "success",
  occupied: "warning",
  partial: "info",
  maintenance: "danger",
};

export function WardsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { departmentName, departmentOptions, patientOptions } = useLookups();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | WardRoom["status"]>("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [roomType, setRoomType] = useState<"all" | WardRoom["roomType"]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<WardRoom | undefined>();
  const [deletingRoom, setDeletingRoom] = useState<WardRoom | undefined>();
  const [planningRoom, setPlanningRoom] = useState<WardRoom | undefined>();
  const [bedDialogOpen, setBedDialogOpen] = useState(false);
  const [defaultWardRoomId, setDefaultWardRoomId] = useState<string | undefined>();

  const query: WardRoomListQuery = {
    search,
    status,
    departmentId,
    roomType,
    page,
    pageSize,
    sortBy: "code",
    sortDir: "asc",
  };

  const list = useQuery({
    queryKey: wardKeys.list(query),
    queryFn: () => wardsApi.list(query),
  });

  const bedsQuery = useQuery({
    queryKey: bedKeys.options,
    queryFn: () => bedsApi.peekAll(),
    staleTime: 15_000,
  });

  const bedsByRoom = useMemo(() => {
    const map = new Map<string, Bed[]>();
    for (const bed of bedsQuery.data ?? []) {
      const group = map.get(bed.wardRoomId) ?? [];
      group.push(bed);
      map.set(bed.wardRoomId, group);
    }
    return map;
  }, [bedsQuery.data]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: wardKeys.all });
    void queryClient.invalidateQueries({ queryKey: bedKeys.all });
  };

  const saveRoomMutation = useMutation({
    mutationFn: async (values: WardRoomFormValues) => {
      if (editingRoom) return wardsApi.update(editingRoom.id, values);
      return wardsApi.create({
        ...values,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    },
    onSuccess: () => {
      toast.success(editingRoom ? "Chambre mise à jour" : "Chambre créée");
      setRoomDialogOpen(false);
      setEditingRoom(undefined);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer la chambre"),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => wardsApi.remove(id),
    onSuccess: () => {
      toast.success("Chambre supprimée");
      setDeletingRoom(undefined);
      invalidate();
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const saveBedMutation = useMutation({
    mutationFn: (values: BedFormValues) => {
      const { patientId, ...rest } = values;
      return bedsApi.create({
        ...rest,
        ...(patientId ? { patientId } : {}),
      });
    },
    onSuccess: () => {
      toast.success("Lit créé");
      setBedDialogOpen(false);
      setDefaultWardRoomId(undefined);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer le lit"),
  });

  const items = list.data?.items ?? [];

  const occupancy = (room: WardRoom) => {
    const beds = bedsByRoom.get(room.id) ?? [];
    const taken = beds.filter((bed) => bed.status === "occupied" || bed.status === "reserved").length;
    return `${taken}/${room.bedCount}`;
  };

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
            placeholder="Rechercher une chambre…"
            label="Recherche chambres"
            className="min-w-0 flex-1 sm:max-w-none"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FilterSelect
              label="Statut"
              value={status}
              onChange={(value) => {
                setStatus(value as "all" | WardRoom["status"]);
                setPage(1);
              }}
              options={Object.entries(wardRoomStatusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              allLabel="Tous les statuts"
              className="w-full min-w-[9rem] sm:w-40"
            />
            <FilterSelect
              label="Type"
              value={roomType}
              onChange={(value) => {
                setRoomType(value as "all" | WardRoom["roomType"]);
                setPage(1);
              }}
              options={wardRoomTypes.map((type) => ({
                value: type,
                label: wardRoomTypeLabels[type],
              }))}
              allLabel="Tous les types"
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
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setDefaultWardRoomId(undefined);
                setBedDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Lit
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingRoom(undefined);
                setRoomDialogOpen(true);
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
          description="Impossible de charger les chambres."
          onRetry={() => void list.refetch()}
        />
      ) : null}
      {!list.isLoading && !list.isError && items.length === 0 ? (
        <EmptyState title="Aucune chambre" description="Ajoutez une chambre d'hospitalisation." />
      ) : null}

      {!list.isLoading && !list.isError && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((room) => (
            <article
              key={room.id}
              role="button"
              tabIndex={0}
              onClick={() => void navigate({ to: "/wards/$id", params: { id: room.id } })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void navigate({ to: "/wards/$id", params: { id: room.id } });
                }
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left outline-none transition-colors",
                "hover:border-primary/25 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <BedDouble className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pr-6">
                  <p className="truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
                    {room.code}
                  </p>
                  <p className="truncate text-xs text-foreground">
                    {wardRoomTypeLabels[room.roomType]} · étage {room.floor}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2.5 right-2 size-8"
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Actions ${room.code}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setPlanningRoom(room)}>
                      <CalendarRange className="size-4" />
                      Planning
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingRoom(room);
                        setRoomDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeletingRoom(room)}
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={wardRoomStatusLabels[room.status]} tone={statusTone[room.status]} />
                <span className="text-xs font-medium text-foreground">{occupancy(room)} lits</span>
              </div>

              <div className="mt-auto space-y-2 border-t border-border/70 pt-3 text-sm">
                <p className="truncate font-medium">{departmentName(room.departmentId)}</p>
                <p className="line-clamp-2">{room.notes || "Aucune note"}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPlanningRoom(room);
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

      <WardRoomFormDialog
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
        room={editingRoom}
        isSaving={saveRoomMutation.isPending}
        onSubmit={async (values) => {
          await saveRoomMutation.mutateAsync(values);
        }}
      />

      <BedFormDialog
        open={bedDialogOpen}
        onOpenChange={setBedDialogOpen}
        patientOptions={patientOptions}
        {...(defaultWardRoomId ? { defaultWardRoomId } : {})}
        isSaving={saveBedMutation.isPending}
        onSubmit={async (values) => {
          await saveBedMutation.mutateAsync(values);
        }}
      />

      <WardPlanningSheet
        open={Boolean(planningRoom)}
        room={planningRoom}
        beds={planningRoom ? (bedsByRoom.get(planningRoom.id) ?? []) : []}
        onOpenChange={(open) => {
          if (!open) setPlanningRoom(undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingRoom)}
        onOpenChange={(open) => {
          if (!open) setDeletingRoom(undefined);
        }}
        title="Supprimer la chambre ?"
        description={`« ${deletingRoom?.code ?? ""} » sera retirée.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        onConfirm={() => {
          if (deletingRoom) deleteRoomMutation.mutate(deletingRoom.id);
        }}
      />
    </PageContainer>
  );
}
