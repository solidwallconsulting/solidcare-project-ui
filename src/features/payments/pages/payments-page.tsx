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
import { paymentsApi, paymentKeys } from "@/features/payments/api";
import { PaymentFormDialog } from "@/features/payments/components/payment-form-dialog";
import {
  paymentMethods,
  paymentMethodLabels,
  paymentStatuses,
  paymentStatusLabels,
  type Payment,
  type PaymentFormValues,
  type PaymentMethod,
  type PaymentStatus,
} from "@/features/payments/types";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatCurrency, formatDate } from "@/shared/utils/format";
import { nextReference, toggleSort } from "@/shared/utils/resource-helpers";

const PAGE_SIZE = 10;

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const { patientName, doctorName } = useLookups();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ sortBy?: string; sortDir: "asc" | "desc" }>({
    sortBy: "paidAt",
    sortDir: "desc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | undefined>();
  const [toDelete, setToDelete] = useState<Payment | undefined>();

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status,
    method,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  };

  const listQuery = useQuery({
    queryKey: paymentKeys.list(query),
    queryFn: () => paymentsApi.list(query),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      if (editing) return paymentsApi.update(editing.id, values);
      return paymentsApi.create({
        ...values,
        reference: nextReference("INV"),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      toast.success(editing ? "Paiement mis à jour" : "Paiement créé");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer le paiement"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      toast.success("Paiement supprimé");
      setToDelete(undefined);
    },
    onError: () => toast.error("Impossible de supprimer le paiement"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Paiements"
        description="Règlements patients et encaissements (TND)."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouveau paiement
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
          placeholder="Rechercher (référence…)"
        />
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => {
            setStatus(value as PaymentStatus | "all");
            setPage(1);
          }}
          allLabel="Tous les statuts"
          options={paymentStatuses.map((item) => ({
            value: item,
            label: paymentStatusLabels[item],
          }))}
        />
        <FilterSelect
          label="Méthode"
          value={method}
          onChange={(value) => {
            setMethod(value as PaymentMethod | "all");
            setPage(1);
          }}
          allLabel="Toutes méthodes"
          options={paymentMethods.map((item) => ({
            value: item,
            label: paymentMethodLabels[item],
          }))}
        />
      </div>

      <DataTable
        data={listQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyTitle="Aucun paiement"
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
            id: "paidAt",
            header: "Date",
            sortKey: "paidAt",
            cell: (row) => formatDate(row.paidAt),
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
            mobile: false,
          },
          {
            id: "amount",
            header: "Montant",
            sortKey: "amount",
            cell: (row) => formatCurrency(row.amount),
          },
          {
            id: "method",
            header: "Méthode",
            cell: (row) => paymentMethodLabels[row.method],
            mobile: false,
          },
          {
            id: "status",
            header: "Statut",
            cell: (row) => (
              <StatusBadge
                label={paymentStatusLabels[row.status]}
                tone={
                  row.status === "paid"
                    ? "success"
                    : row.status === "pending"
                      ? "warning"
                      : "neutral"
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

      <PaymentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        payment={editing}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined);
        }}
        title="Supprimer le paiement ?"
        description="Ce règlement sera retiré des données démo."
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
