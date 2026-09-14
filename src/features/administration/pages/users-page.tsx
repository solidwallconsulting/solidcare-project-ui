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
import { staffUsersApi, administrationKeys } from "@/features/administration/api";
import { UserFormDialog } from "@/features/administration/components/user-form-dialog";
import {
  appRoles,
  roleLabels,
  userStatuses,
  userStatusLabels,
  type StaffUser,
  type StaffUserFormValues,
  type UserStatus,
} from "@/features/administration/types/user";
import type { AppRole } from "@/features/administration/types/role";
import { formatDate, fullName } from "@/shared/utils/format";
import { todayIsoDate, toggleSort } from "@/shared/utils/resource-helpers";

const PAGE_SIZE = 10;

const userStatusTone = {
  active: "success",
  invited: "info",
  suspended: "danger",
} as const;

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AppRole | "all">("all");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ sortBy?: string; sortDir: "asc" | "desc" }>({
    sortBy: "lastName",
    sortDir: "asc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | undefined>();
  const [toDelete, setToDelete] = useState<StaffUser | undefined>();

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    role,
    status,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  };

  const listQuery = useQuery({
    queryKey: administrationKeys.users(query),
    queryFn: () => staffUsersApi.list(query),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: StaffUserFormValues) => {
      if (editing) return staffUsersApi.update(editing.id, values);
      return staffUsersApi.create({
        ...values,
        lastActiveAt: values.status === "active" ? todayIsoDate() : "",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: administrationKeys.usersAll });
      toast.success(editing ? "Utilisateur mis à jour" : "Utilisateur créé");
      setFormOpen(false);
      setEditing(undefined);
    },
    onError: () => toast.error("Impossible d'enregistrer l'utilisateur"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffUsersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: administrationKeys.usersAll });
      toast.success("Utilisateur supprimé");
      setToDelete(undefined);
    },
    onError: () => toast.error("Impossible de supprimer l'utilisateur"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Utilisateurs"
        description="Comptes staff internes de la clinique."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouvel utilisateur
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
          placeholder="Rechercher un utilisateur…"
        />
        <FilterSelect
          label="Rôle"
          value={role}
          onChange={(value) => {
            setRole(value as AppRole | "all");
            setPage(1);
          }}
          allLabel="Tous les rôles"
          options={appRoles.map((item) => ({ value: item, label: roleLabels[item] }))}
        />
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => {
            setStatus(value as UserStatus | "all");
            setPage(1);
          }}
          allLabel="Tous les statuts"
          options={userStatuses.map((item) => ({
            value: item,
            label: userStatusLabels[item],
          }))}
        />
      </div>

      <DataTable
        data={listQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        emptyTitle="Aucun utilisateur"
        sort={{ by: sort.sortBy, dir: sort.sortDir }}
        onSortChange={(by) => {
          setSort((current) => toggleSort(current, by));
          setPage(1);
        }}
        columns={[
          {
            id: "name",
            header: "Utilisateur",
            sortKey: "lastName",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">
                  {fullName(row.firstName, row.lastName)}
                </p>
                <p className="text-xs text-foreground/70">{row.email}</p>
              </div>
            ),
          },
          {
            id: "phone",
            header: "Téléphone",
            cell: (row) => row.phone,
            mobile: false,
          },
          {
            id: "role",
            header: "Rôle",
            cell: (row) => roleLabels[row.role],
          },
          {
            id: "status",
            header: "Statut",
            cell: (row) => (
              <StatusBadge
                label={userStatusLabels[row.status]}
                tone={userStatusTone[row.status]}
              />
            ),
          },
          {
            id: "lastActiveAt",
            header: "Dernière activité",
            cell: (row) => (row.lastActiveAt ? formatDate(row.lastActiveAt) : "—"),
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

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        isSaving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(undefined);
        }}
        title="Supprimer l'utilisateur ?"
        description={`Le compte de ${toDelete ? fullName(toDelete.firstName, toDelete.lastName) : ""} sera retiré.`}
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
