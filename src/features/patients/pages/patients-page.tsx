import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { patientsApi, patientKeys } from "@/features/patients/api";
import { PatientFormDialog } from "@/features/patients/components/patient-form-dialog";
import type { Patient, PatientFormValues, PatientStatus } from "@/features/patients/types";
import { calculateAge, formatDate, fullName } from "@/shared/utils/format";
import { nextReference, todayIsoDate, toggleSort } from "@/shared/utils/resource-helpers";

const PAGE_SIZE = 10;

export function PatientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PatientStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ sortBy?: string; sortDir: "asc" | "desc" }>({
    sortBy: "lastName",
    sortDir: "asc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | undefined>();
  const [toDelete, setToDelete] = useState<Patient | undefined>();

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  };

  const listQuery = useQuery({
    queryKey: patientKeys.list(query),
    queryFn: () => patientsApi.list(query),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      if (editing) {
        return patientsApi.update(editing.id, values);
      }
      return patientsApi.create({
        ...values,
        reference: nextReference("P"),
        createdAt: todayIsoDate(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      toast.success(editing ? "Patient mis à jour" : "Patient créé");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer le patient"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      toast.success("Patient supprimé");
      setToDelete(undefined);
    },
    onError: () => toast.error("Impossible de supprimer le patient"),
  });

  const items = listQuery.data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Patients"
        description="Dossiers patients de la clinique (données démo)."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouveau patient
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
          placeholder="Rechercher un patient…"
          label="Rechercher"
        />
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => {
            setStatus(value as PatientStatus | "all");
            setPage(1);
          }}
          allLabel="Tous les statuts"
          options={[
            { value: "active", label: "Actif" },
            { value: "archived", label: "Archivé" },
          ]}
        />
      </div>

      <DataTable
        data={items}
        rowKey={(row) => row.id}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyTitle="Aucun patient"
        emptyDescription="Créez un premier dossier patient."
        sort={{ by: sort.sortBy, dir: sort.sortDir }}
        onSortChange={(by) => {
          setSort((current) => toggleSort(current, by));
          setPage(1);
        }}
        onRowClick={(row) => void navigate({ to: "/patients/$id", params: { id: row.id } })}
        columns={[
          {
            id: "name",
            header: "Patient",
            sortKey: "lastName",
            cell: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {fullName(row.firstName, row.lastName)}
                </p>
                <p className="truncate text-xs text-foreground/70">{row.reference}</p>
              </div>
            ),
          },
          {
            id: "phone",
            header: "Téléphone",
            cell: (row) => row.phone,
          },
          {
            id: "city",
            header: "Ville",
            sortKey: "city",
            cell: (row) => row.city,
          },
          {
            id: "age",
            header: "Âge",
            cell: (row) => `${calculateAge(row.dateOfBirth)} ans`,
            mobile: false,
          },
          {
            id: "status",
            header: "Statut",
            cell: (row) => (
              <StatusBadge
                label={row.status === "active" ? "Actif" : "Archivé"}
                tone={row.status === "active" ? "success" : "neutral"}
              />
            ),
          },
          {
            id: "createdAt",
            header: "Créé le",
            sortKey: "createdAt",
            cell: (row) => formatDate(row.createdAt),
            mobile: false,
          },
          {
            id: "actions",
            header: "Actions",
            mobile: false,
            cell: (row) => (
              <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
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

      <PatientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editing}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined);
        }}
        title="Supprimer le patient ?"
        description={`Le dossier de ${toDelete ? fullName(toDelete.firstName, toDelete.lastName) : ""} sera retiré des données démo.`}
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
