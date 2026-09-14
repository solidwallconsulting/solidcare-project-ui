import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, LogOut, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { DataTable, DataTablePagination, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { SearchInput } from "@/shared/components/forms/search-input";
import { FilterSelect } from "@/shared/components/forms/filter-select";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDateTime } from "@/shared/utils/format";
import { bedsApi, bedKeys, wardsApi, wardKeys } from "@/features/wards/api";
import {
  hospitalizationsApi,
  hospitalizationKeys,
  HospitalizationFormDialog,
  TransferDialog,
  hospitalizationStatusLabels,
  type Hospitalization,
  type HospitalizationFormValues,
  type HospitalizationListQuery,
  type TransferFormValues,
} from "@/features/hospitalizations";

const statusTone: Record<Hospitalization["status"], StatusTone> = {
  admitted: "primary",
  transferred: "warning",
  discharged: "success",
};

function nextReference() {
  const n = Math.floor(Math.random() * 90) + 10;
  return `H-2026-${String(n).padStart(3, "0")}`;
}

export function HospitalizationsPage() {
  const queryClient = useQueryClient();
  const {
    patientName,
    doctorName,
    departmentName,
    patientOptions,
    doctorOptions,
    departmentOptions,
  } = useLookups();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Hospitalization["status"]>("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("admittedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Hospitalization | undefined>();
  const [deleting, setDeleting] = useState<Hospitalization | undefined>();
  const [transferring, setTransferring] = useState<Hospitalization | undefined>();
  const [discharging, setDischarging] = useState<Hospitalization | undefined>();

  const rooms = useQuery({
    queryKey: wardKeys.options,
    queryFn: () => wardsApi.peekAll(),
    staleTime: 30_000,
  });
  const beds = useQuery({
    queryKey: bedKeys.options,
    queryFn: () => bedsApi.peekAll(),
    staleTime: 30_000,
  });

  const roomCode = (id: string) => rooms.data?.find((r) => r.id === id)?.code ?? "—";
  const bedCode = (id: string) => beds.data?.find((b) => b.id === id)?.code ?? "—";

  const query: HospitalizationListQuery = {
    search,
    status,
    departmentId,
    page,
    pageSize: 10,
    sortBy,
    sortDir,
  };

  const list = useQuery({
    queryKey: hospitalizationKeys.list(query),
    queryFn: () => hospitalizationsApi.list(query),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: hospitalizationKeys.all });
    void queryClient.invalidateQueries({ queryKey: bedKeys.all });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: HospitalizationFormValues) => {
      if (editing) return hospitalizationsApi.update(editing.id, values);
      return hospitalizationsApi.create({
        ...values,
        reference: nextReference(),
        admittedAt: values.admittedAt.length === 16 ? `${values.admittedAt}:00` : values.admittedAt,
      });
    },
    onSuccess: () => {
      toast.success(editing ? "Hospitalisation mise à jour" : "Admission enregistrée");
      setDialogOpen(false);
      setEditing(undefined);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hospitalizationsApi.remove(id),
    onSuccess: () => {
      toast.success("Hospitalisation supprimée");
      setDeleting(undefined);
      invalidate();
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const transferMutation = useMutation({
    mutationFn: async (values: TransferFormValues) => {
      if (!transferring) throw new Error("missing");
      return hospitalizationsApi.update(transferring.id, {
        wardRoomId: values.wardRoomId,
        bedId: values.bedId,
        status: "transferred",
        notes: values.notes
          ? `${transferring.notes}\nTransfert: ${values.notes}`.trim()
          : transferring.notes,
      });
    },
    onSuccess: () => {
      toast.success("Patient transféré");
      setTransferring(undefined);
      invalidate();
    },
    onError: () => toast.error("Transfert impossible"),
  });

  const dischargeMutation = useMutation({
    mutationFn: async (item: Hospitalization) => {
      return hospitalizationsApi.update(item.id, {
        status: "discharged",
        dischargedAt: new Date().toISOString().slice(0, 19),
      });
    },
    onSuccess: () => {
      toast.success("Sortie enregistrée");
      setDischarging(undefined);
      invalidate();
    },
    onError: () => toast.error("Sortie impossible"),
  });

  const columns: DataTableColumn<Hospitalization>[] = useMemo(
    () => [
      {
        id: "reference",
        header: "Référence",
        sortKey: "reference",
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.reference}</p>
            <p className="truncate text-xs text-muted-foreground">{patientName(row.patientId)}</p>
          </div>
        ),
      },
      {
        id: "location",
        header: "Chambre / Lit",
        cell: (row) => `${roomCode(row.wardRoomId)} · ${bedCode(row.bedId)}`,
      },
      {
        id: "department",
        header: "Département",
        cell: (row) => departmentName(row.departmentId),
        mobile: false,
      },
      {
        id: "doctor",
        header: "Médecin",
        cell: (row) => doctorName(row.doctorId),
        mobile: false,
      },
      {
        id: "admittedAt",
        header: "Admission",
        sortKey: "admittedAt",
        cell: (row) => formatDateTime(row.admittedAt),
      },
      {
        id: "status",
        header: "Statut",
        cell: (row) => (
          <StatusBadge
            label={hospitalizationStatusLabels[row.status]}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditing(row);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="size-4" />
                Modifier
              </DropdownMenuItem>
              {row.status === "admitted" || row.status === "transferred" ? (
                <>
                  <DropdownMenuItem onClick={() => setTransferring(row)}>
                    <ArrowRightLeft className="size-4" />
                    Transférer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDischarging(row)}>
                    <LogOut className="size-4" />
                    Sortie
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(row)}
              >
                <Trash2 className="size-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [patientName, doctorName, departmentName, rooms.data, beds.data],
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
    <PageContainer>
      <PageHeader
        title="Hospitalisations"
        description="Admissions, transferts et sorties."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouvelle admission
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Rechercher (réf., motif)…"
        />
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => {
            setStatus(value as "all" | Hospitalization["status"]);
            setPage(1);
          }}
          options={Object.entries(hospitalizationStatusLabels).map(([value, label]) => ({
            value,
            label,
          }))}
          allLabel="Tous les statuts"
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
          className="w-full sm:w-56"
        />
      </div>

      <DataTable
        data={list.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => void list.refetch()}
        emptyTitle="Aucune hospitalisation"
        emptyDescription="Enregistrez une admission."
        sort={{ by: sortBy, dir: sortDir }}
        onSortChange={onSortChange}
      />

      {list.data ? (
        <DataTablePagination
          page={list.data.page}
          totalPages={list.data.totalPages}
          total={list.data.total}
          pageSize={list.data.pageSize}
          onPageChange={setPage}
        />
      ) : null}

      <HospitalizationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hospitalization={editing}
        patientOptions={patientOptions}
        doctorOptions={doctorOptions}
        departmentOptions={departmentOptions}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <TransferDialog
        open={Boolean(transferring)}
        onOpenChange={(open) => {
          if (!open) setTransferring(undefined);
        }}
        currentBedId={transferring?.bedId}
        isSaving={transferMutation.isPending}
        onSubmit={async (values) => {
          await transferMutation.mutateAsync(values);
        }}
      />

      <ConfirmDialog
        open={Boolean(discharging)}
        onOpenChange={(open) => {
          if (!open) setDischarging(undefined);
        }}
        title="Enregistrer la sortie ?"
        description={`Sortie de ${discharging ? patientName(discharging.patientId) : ""} (${discharging?.reference ?? ""}).`}
        confirmLabel="Sortie"
        cancelLabel="Annuler"
        onConfirm={() => {
          if (discharging) dischargeMutation.mutate(discharging);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        title="Supprimer l'hospitalisation ?"
        description={`« ${deleting?.reference ?? ""} » sera retirée.`}
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
