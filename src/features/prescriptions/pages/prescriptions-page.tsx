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
import { prescriptionsApi, prescriptionKeys } from "@/features/prescriptions/api";
import { PrescriptionFormDialog } from "@/features/prescriptions/components/prescription-form-dialog";
import {
  prescriptionStatuses,
  prescriptionStatusLabels,
  type Prescription,
  type PrescriptionFormValues,
  type PrescriptionStatus,
} from "@/features/prescriptions/types";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDate } from "@/shared/utils/format";
import { nextReference, toggleSort } from "@/shared/utils/resource-helpers";

const PAGE_SIZE = 10;

export function PrescriptionsPage() {
  const queryClient = useQueryClient();
  const { patientName, doctorName } = useLookups();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PrescriptionStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ sortBy?: string; sortDir: "asc" | "desc" }>({
    sortBy: "issuedAt",
    sortDir: "desc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Prescription | undefined>();
  const [toDelete, setToDelete] = useState<Prescription | undefined>();

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  };

  const listQuery = useQuery({
    queryKey: prescriptionKeys.list(query),
    queryFn: () => prescriptionsApi.list(query),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PrescriptionFormValues) => {
      if (editing) return prescriptionsApi.update(editing.id, values);
      return prescriptionsApi.create({
        ...values,
        reference: nextReference("RX"),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prescriptionKeys.all });
      toast.success(editing ? "Ordonnance mise à jour" : "Ordonnance créée");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer l'ordonnance"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => prescriptionsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prescriptionKeys.all });
      toast.success("Ordonnance supprimée");
      setToDelete(undefined);
    },
    onError: () => toast.error("Impossible de supprimer l'ordonnance"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Ordonnances"
        description="Prescriptions médicamenteuses émises par la clinique."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouvelle ordonnance
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
          placeholder="Rechercher (référence…)"
        />
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => {
            setStatus(value as PrescriptionStatus | "all");
            setPage(1);
          }}
          allLabel="Tous les statuts"
          options={prescriptionStatuses.map((item) => ({
            value: item,
            label: prescriptionStatusLabels[item],
          }))}
        />
      </div>

      <DataTable
        data={listQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyTitle="Aucune ordonnance"
        sort={{ by: sort.sortBy, dir: sort.sortDir }}
        onSortChange={(by) => {
          setSort((current) => toggleSort(current, by));
          setPage(1);
        }}
        columns={[
          {
            id: "reference",
            header: "Référence",
            sortKey: "reference",
            cell: (row) => row.reference,
          },
          {
            id: "issuedAt",
            header: "Date",
            sortKey: "issuedAt",
            cell: (row) => formatDate(row.issuedAt),
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
            id: "items",
            header: "Médicaments",
            cell: (row) =>
              row.items.map((item) => item.medication).join(", ") || "—",
          },
          {
            id: "status",
            header: "Statut",
            cell: (row) => (
              <StatusBadge
                label={prescriptionStatusLabels[row.status]}
                tone={
                  row.status === "active"
                    ? "primary"
                    : row.status === "completed"
                      ? "success"
                      : "danger"
                }
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

      <PrescriptionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        prescription={editing}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined);
        }}
        title="Supprimer l'ordonnance ?"
        description="Cette ordonnance sera retirée des données démo."
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
