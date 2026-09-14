import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/shared/components/layout/page-container";
import { DataTable, DataTablePagination, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { SearchInput } from "@/shared/components/forms/search-input";
import { FilterSelect } from "@/shared/components/forms/filter-select";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { formatDateTime } from "@/shared/utils/format";
import { equipmentApi } from "@/features/equipment/api";
import { roomsApi, roomKeys } from "@/features/rooms/api";
import {
  maintenanceApi,
  maintenanceKeys,
  MaintenanceFormDialog,
  maintenanceStatusLabels,
  maintenancePriorityLabels,
  type MaintenanceTicket,
  type MaintenanceFormValues,
  type MaintenanceListQuery,
} from "@/features/maintenance";

const statusTone: Record<MaintenanceTicket["status"], StatusTone> = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  cancelled: "danger",
};

const priorityTone: Record<MaintenanceTicket["priority"], StatusTone> = {
  low: "info",
  medium: "warning",
  high: "danger",
};

function nextReference() {
  const n = Math.floor(Math.random() * 90) + 10;
  return `MT-2026-${String(n).padStart(3, "0")}`;
}

const DEFAULT_PAGE_SIZE = 10;

export function MaintenancePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | MaintenanceTicket["status"]>("all");
  const [priority, setPriority] = useState<"all" | MaintenanceTicket["priority"]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceTicket | undefined>();
  const [deleting, setDeleting] = useState<MaintenanceTicket | undefined>();

  const equipment = useQuery({
    queryKey: ["equipment", "lookup"],
    queryFn: () => equipmentApi.peekAll(),
    staleTime: 30_000,
  });
  const rooms = useQuery({
    queryKey: roomKeys.options,
    queryFn: () => roomsApi.peekAll(),
    staleTime: 30_000,
  });

  const equipmentName = (id: string) =>
    equipment.data?.find((item) => item.id === id)?.name ?? "—";
  const roomName = (id?: string) =>
    id ? (rooms.data?.find((item) => item.id === id)?.name ?? id) : "—";

  const query: MaintenanceListQuery = {
    search,
    status,
    priority,
    page,
    pageSize,
    sortBy,
    sortDir,
  };

  const list = useQuery({
    queryKey: maintenanceKeys.list(query),
    queryFn: () => maintenanceApi.list(query),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: MaintenanceFormValues) => {
      const { roomId, ...rest } = values;
      const room = roomId ? { roomId } : {};
      if (editing) {
        const resolvedAt =
          values.status === "resolved"
            ? editing.resolvedAt || new Date().toISOString().slice(0, 19)
            : "";
        return maintenanceApi.update(editing.id, { ...rest, ...room, resolvedAt });
      }
      return maintenanceApi.create({
        ...rest,
        ...room,
        reference: nextReference(),
        createdAt: new Date().toISOString().slice(0, 19),
        ...(values.status === "resolved"
          ? { resolvedAt: new Date().toISOString().slice(0, 19) }
          : { resolvedAt: "" }),
      });
    },
    onSuccess: () => {
      toast.success(editing ? "Ticket mis à jour" : "Ticket créé");
      setDialogOpen(false);
      setEditing(undefined);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => maintenanceApi.remove(id),
    onSuccess: () => {
      toast.success("Ticket supprimé");
      setDeleting(undefined);
      invalidate();
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const columns: DataTableColumn<MaintenanceTicket>[] = useMemo(
    () => [
      {
        id: "reference",
        header: "Ticket",
        sortKey: "reference",
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.reference}</p>
            <p className="truncate text-xs text-foreground">{row.problem}</p>
          </div>
        ),
      },
      {
        id: "equipment",
        header: "Équipement",
        cell: (row) => equipmentName(row.equipmentId),
      },
      {
        id: "room",
        header: "Salle",
        cell: (row) => roomName(row.roomId),
        mobile: false,
      },
      {
        id: "priority",
        header: "Priorité",
        cell: (row) => (
          <StatusBadge
            label={maintenancePriorityLabels[row.priority]}
            tone={priorityTone[row.priority]}
          />
        ),
        mobile: false,
      },
      {
        id: "technician",
        header: "Technicien",
        cell: (row) => row.technicianName,
        mobile: false,
      },
      {
        id: "createdAt",
        header: "Créé",
        sortKey: "createdAt",
        cell: (row) => formatDateTime(row.createdAt),
      },
      {
        id: "status",
        header: "Statut",
        cell: (row) => (
          <StatusBadge
            label={maintenanceStatusLabels[row.status]}
            tone={statusTone[row.status]}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        mobile: false,
        cell: (row) => (
          <div onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => void navigate({ to: "/maintenance/$id", params: { id: row.id } })}
                >
                  <Eye className="size-4" />
                  Détail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(row);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleting(row)}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [equipment.data, rooms.data, navigate],
  );

  const onSortChange = (by: string) => {
    if (sortBy === by) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortBy(by);
      setSortDir("asc");
    }
    setPage(1);
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
            placeholder="Rechercher un ticket…"
            label="Recherche tickets"
            className="min-w-0 flex-1 sm:max-w-none"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FilterSelect
              label="Statut"
              value={status}
              onChange={(value) => {
                setStatus(value as "all" | MaintenanceTicket["status"]);
                setPage(1);
              }}
              options={Object.entries(maintenanceStatusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              allLabel="Tous les statuts"
              className="w-full min-w-[9rem] sm:w-40"
            />
            <FilterSelect
              label="Priorité"
              value={priority}
              onChange={(value) => {
                setPriority(value as "all" | MaintenanceTicket["priority"]);
                setPage(1);
              }}
              options={Object.entries(maintenancePriorityLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              allLabel="Toutes les priorités"
              className="w-full min-w-[9rem] sm:w-40"
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

      <DataTable
        data={list.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => void list.refetch()}
        emptyTitle="Aucun ticket"
        emptyDescription="Créez un ticket de maintenance."
        sort={{ by: sortBy, dir: sortDir }}
        onSortChange={onSortChange}
        onRowClick={(row) => void navigate({ to: "/maintenance/$id", params: { id: row.id } })}
      />

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

      <MaintenanceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticket={editing}
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
        title="Supprimer le ticket ?"
        description={`« ${deleting?.reference ?? ""} » sera retiré.`}
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
