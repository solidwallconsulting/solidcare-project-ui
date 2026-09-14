import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { DataTable, DataTablePagination } from "@/shared/components/data-table/data-table";
import { SearchInput } from "@/shared/components/forms/search-input";
import { FilterSelect } from "@/shared/components/forms/filter-select";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { consultationsApi, consultationKeys } from "@/features/consultations/api";
import { ConsultationFormDialog } from "@/features/consultations/components/consultation-form-dialog";
import {
  consultationStatuses,
  consultationStatusLabels,
  type Consultation,
  type ConsultationFormValues,
  type ConsultationStatus,
} from "@/features/consultations/types";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDate } from "@/shared/utils/format";
import { toggleSort } from "@/shared/utils/resource-helpers";

const PAGE_SIZE = 10;

export function ConsultationsPage() {
  const queryClient = useQueryClient();
  const { patientName, doctorName } = useLookups();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ConsultationStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ sortBy?: string; sortDir: "asc" | "desc" }>({
    sortBy: "date",
    sortDir: "desc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Consultation | undefined>();
  const [toDelete, setToDelete] = useState<Consultation | undefined>();

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  };

  const listQuery = useQuery({
    queryKey: consultationKeys.list(query),
    queryFn: () => consultationsApi.list(query),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ConsultationFormValues) => {
      if (editing) return consultationsApi.update(editing.id, values);
      return consultationsApi.create(values);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: consultationKeys.all });
      toast.success(editing ? "Consultation mise à jour" : "Consultation créée");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer la consultation"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => consultationsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: consultationKeys.all });
      toast.success("Consultation supprimée");
      setToDelete(undefined);
    },
    onError: () => toast.error("Impossible de supprimer la consultation"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Consultations"
        description="Notes cliniques et constantes vitales."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouvelle consultation
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Rechercher (diagnostic, symptômes…)"
        />
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => {
            setStatus(value as ConsultationStatus | "all");
            setPage(1);
          }}
          allLabel="Tous les statuts"
          options={consultationStatuses.map((item) => ({
            value: item,
            label: consultationStatusLabels[item],
          }))}
        />
      </div>

      <DataTable
        data={listQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyTitle="Aucune consultation"
        sort={{ by: sort.sortBy, dir: sort.sortDir }}
        onSortChange={(by) => {
          setSort((current) => toggleSort(current, by));
          setPage(1);
        }}
        columns={[
          {
            id: "date",
            header: "Date",
            sortKey: "date",
            cell: (row) => formatDate(row.date),
          },
          {
            id: "patient",
            header: "Patient",
            cell: (row) => patientName(row.patientId),
          },
          {
            id: "doctor",
            header: "Médecin",
            cell: (row) => doctorName(row.doctorId),
          },
          {
            id: "diagnosis",
            header: "Diagnostic",
            cell: (row) => <span className="line-clamp-2">{row.diagnosis}</span>,
          },
          {
            id: "vitals",
            header: "Constantes",
            mobile: false,
            cell: (row) =>
              `${row.temperature}°C · ${row.bloodPressure || "—"} · ${row.weight} kg`,
          },
          {
            id: "status",
            header: "Statut",
            cell: (row) => (
              <StatusBadge
                label={consultationStatusLabels[row.status]}
                tone={row.status === "finalised" ? "success" : "warning"}
              />
            ),
          },
          {
            id: "actions",
            header: "Actions",
            mobile: false,
            cell: (row) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Modifier"
                  onClick={() => {
                    setEditing(row);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer"
                  onClick={() => setToDelete(row)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      {listQuery.data ? (
        <DataTablePagination
          page={listQuery.data.page}
          totalPages={listQuery.data.totalPages}
          total={listQuery.data.total}
          pageSize={listQuery.data.pageSize}
          onPageChange={setPage}
        />
      ) : null}

      <ConsultationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        consultation={editing}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined);
        }}
        title="Supprimer la consultation ?"
        description="La note clinique sera retirée des données démo."
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
