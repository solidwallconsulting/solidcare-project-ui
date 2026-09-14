import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { DataTable, DataTablePagination, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { SearchInput } from "@/shared/components/forms/search-input";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { formatDateTime } from "@/shared/utils/format";
import { auditApi, auditKeys } from "../api";
import type { AuditEvent, AuditListQuery } from "../types";

const actionTone: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  create: "success",
  update: "info",
  delete: "danger",
  login: "neutral",
};

const actionLabels: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  login: "Connexion",
};

const columns: DataTableColumn<AuditEvent>[] = [
  {
    id: "createdAt",
    header: "Date",
    sortKey: "createdAt",
    cell: (row) => formatDateTime(row.createdAt),
  },
  {
    id: "actor",
    header: "Acteur",
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.actorName}</p>
        <p className="truncate text-xs text-muted-foreground">{row.actorRole}</p>
      </div>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: (row) => (
      <StatusBadge
        label={actionLabels[row.action] ?? row.action}
        tone={actionTone[row.action] ?? "neutral"}
      />
    ),
  },
  {
    id: "entity",
    header: "Entité",
    cell: (row) => (
      <span className="text-sm">
        {row.entityType}
        <span className="text-muted-foreground"> · {row.entityId}</span>
      </span>
    ),
    mobile: false,
  },
  {
    id: "detail",
    header: "Détail",
    cell: (row) => <span className="line-clamp-2 max-w-md text-sm">{row.detail}</span>,
  },
];

export function AuditPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const query: AuditListQuery = {
    search,
    page,
    pageSize: 10,
    sortBy,
    sortDir,
  };

  const list = useQuery({
    queryKey: auditKeys.list(query),
    queryFn: () => auditApi.list(query),
  });

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
        title="Journal d'audit"
        description="Traçabilité des actions sensibles sur la plateforme."
      />

      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Rechercher (acteur, entité, détail)…"
      />

      <DataTable
        data={list.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => void list.refetch()}
        emptyTitle="Aucun événement"
        emptyDescription="Les actions apparaîtront ici."
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
    </PageContainer>
  );
}
