import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { formatDate } from "@/shared/utils/format";
import { ExaminationFormDialog } from "../components/examination-form-dialog";
import { examinationsApi, examinationKeys } from "../api";
import {
  examPriorityLabels,
  examStatusLabels,
  examTypeLabels,
  type ExamRequest,
  type ExamRequestFormValues,
  type ExamListQuery,
} from "../types";

const statusTone: Record<ExamRequest["status"], StatusTone> = {
  requested: "warning",
  scheduled: "info",
  in_progress: "primary",
  completed: "success",
  cancelled: "neutral",
};

function nextReference() {
  const n = Math.floor(Math.random() * 900) + 100;
  return `EX-${String(n).padStart(5, "0")}`;
}

export function ExaminationsPage() {
  const queryClient = useQueryClient();
  const { patientName, doctorName, patientOptions, doctorOptions } = useLookups();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ExamRequest["status"]>("all");
  const [examType, setExamType] = useState<"all" | ExamRequest["examType"]>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("requestedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExamRequest | undefined>();
  const [deleting, setDeleting] = useState<ExamRequest | undefined>();

  const query: ExamListQuery = {
    search,
    status,
    examType,
    page,
    pageSize: 10,
    sortBy,
    sortDir,
  };

  const list = useQuery({
    queryKey: examinationKeys.list(query),
    queryFn: () => examinationsApi.list(query),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: examinationKeys.all });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: ExamRequestFormValues) => {
      if (editing) return examinationsApi.update(editing.id, values);
      return examinationsApi.create({ ...values, reference: nextReference() });
    },
    onSuccess: () => {
      toast.success(editing ? "Examen mis à jour" : "Demande créée");
      setDialogOpen(false);
      setEditing(undefined);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer l'examen"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => examinationsApi.remove(id),
    onSuccess: () => {
      toast.success("Examen supprimé");
      setDeleting(undefined);
      invalidate();
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const columns: DataTableColumn<ExamRequest>[] = useMemo(
    () => [
      {
        id: "reference",
        header: "Examen",
        sortKey: "reference",
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.reference} · {patientName(row.patientId)}
            </p>
          </div>
        ),
      },
      {
        id: "examType",
        header: "Type",
        cell: (row) => examTypeLabels[row.examType],
      },
      {
        id: "doctor",
        header: "Médecin",
        cell: (row) => doctorName(row.doctorId),
        mobile: false,
      },
      {
        id: "priority",
        header: "Priorité",
        cell: (row) => examPriorityLabels[row.priority],
        mobile: false,
      },
      {
        id: "requestedAt",
        header: "Demandé",
        sortKey: "requestedAt",
        cell: (row) => formatDate(row.requestedAt),
      },
      {
        id: "status",
        header: "Statut",
        cell: (row) => (
          <StatusBadge label={examStatusLabels[row.status]} tone={statusTone[row.status]} />
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
    [patientName, doctorName],
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
        title="Examens"
        description="Demandes d'analyses et d'imagerie."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouvelle demande
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
          placeholder="Rechercher (titre, réf.)…"
        />
        <FilterSelect
          label="Statut"
          value={status}
          onChange={(value) => {
            setStatus(value as "all" | ExamRequest["status"]);
            setPage(1);
          }}
          options={Object.entries(examStatusLabels).map(([value, label]) => ({ value, label }))}
          allLabel="Tous les statuts"
        />
        <FilterSelect
          label="Type"
          value={examType}
          onChange={(value) => {
            setExamType(value as "all" | ExamRequest["examType"]);
            setPage(1);
          }}
          options={Object.entries(examTypeLabels).map(([value, label]) => ({ value, label }))}
          allLabel="Tous les types"
        />
      </div>

      <DataTable
        data={list.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => void list.refetch()}
        emptyTitle="Aucun examen"
        emptyDescription="Créez une demande d'examen."
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

      <ExaminationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        exam={editing}
        patientOptions={patientOptions}
        doctorOptions={doctorOptions}
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
        title="Supprimer l'examen ?"
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
