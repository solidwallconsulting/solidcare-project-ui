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
import { appointmentsApi, appointmentKeys } from "@/features/appointments/api";
import { AppointmentFormDialog } from "@/features/appointments/components/appointment-form-dialog";
import {
  appointmentStatuses,
  appointmentStatusLabels,
  appointmentTypeLabels,
  type Appointment,
  type AppointmentFormValues,
  type AppointmentStatus,
} from "@/features/appointments/types";
import { appointmentStatusTone } from "@/features/appointments/status-tone";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDateTime } from "@/shared/utils/format";
import { toggleSort } from "@/shared/utils/resource-helpers";

const PAGE_SIZE = 10;

export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { patientName, doctorName } = useLookups();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ sortBy?: string; sortDir: "asc" | "desc" }>({
    sortBy: "startsAt",
    sortDir: "asc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | undefined>();
  const [toDelete, setToDelete] = useState<Appointment | undefined>();

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  };

  const listQuery = useQuery({
    queryKey: appointmentKeys.list(query),
    queryFn: () => appointmentsApi.list(query),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      if (editing) return appointmentsApi.update(editing.id, values);
      return appointmentsApi.create(values);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success(editing ? "Rendez-vous mis à jour" : "Rendez-vous créé");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer le rendez-vous"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success("Rendez-vous supprimé");
      setToDelete(undefined);
    },
    onError: () => toast.error("Impossible de supprimer le rendez-vous"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Rendez-vous"
        description="Planification interne — sélection patient par le staff."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouveau RDV
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
          placeholder="Rechercher (motif, salle…)"
        />
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => {
            setStatus(value as AppointmentStatus | "all");
            setPage(1);
          }}
          allLabel="Tous les statuts"
          options={appointmentStatuses.map((item) => ({
            value: item,
            label: appointmentStatusLabels[item],
          }))}
        />
      </div>

      <DataTable
        data={listQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyTitle="Aucun rendez-vous"
        sort={{ by: sort.sortBy, dir: sort.sortDir }}
        onSortChange={(by) => {
          setSort((current) => toggleSort(current, by));
          setPage(1);
        }}
        columns={[
          {
            id: "when",
            header: "Date",
            sortKey: "startsAt",
            cell: (row) => formatDateTime(row.startsAt),
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
            id: "type",
            header: "Type",
            cell: (row) => appointmentTypeLabels[row.type],
            mobile: false,
          },
          {
            id: "status",
            header: "Statut",
            cell: (row) => (
              <StatusBadge
                label={appointmentStatusLabels[row.status]}
                tone={appointmentStatusTone[row.status]}
              />
            ),
          },
          {
            id: "room",
            header: "Salle",
            cell: (row) => row.room || "—",
            mobile: false,
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

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        appointment={editing}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined);
        }}
        title="Supprimer le rendez-vous ?"
        description="Cette action retire le créneau des données démo."
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
