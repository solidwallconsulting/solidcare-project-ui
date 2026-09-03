import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/shared/components/feedback/states";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortKey?: string;
  className?: string;
  /** Shown in the mobile card layout. Defaults to true. */
  mobile?: boolean;
  align?: "left" | "right";
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  sort?: { by?: string | undefined; dir: "asc" | "desc" };
  onSortChange?: (by: string) => void;
  onRowClick?: (row: T) => void;
  errorDescription?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading,
  isError,
  onRetry,
  emptyTitle = "No results found",
  emptyDescription,
  emptyAction,
  sort,
  onSortChange,
  onRowClick,
  errorDescription,
}: DataTableProps<T>) {
  if (isError) {
    return <ErrorState onRetry={onRetry} {...(errorDescription ? { description: errorDescription } : {})} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        {...(emptyDescription ? { description: emptyDescription } : {})}
        {...(emptyAction ? { action: emptyAction } : {})}
      />
    );
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sort?.by !== columnKey) return <ChevronsUpDown className="size-3.5 opacity-50" />;
    return sort.dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
  };

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(column.align === "right" && "text-right", column.className)}
                >
                  {column.sortKey && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.sortKey as string)}
                      className="inline-flex items-center gap-1.5 font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {column.header}
                      <SortIcon columnKey={column.sortKey} />
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(column.align === "right" && "text-right", column.className)}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {data.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-lg border border-border bg-card p-4 shadow-card"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <dl className="space-y-2">
              {columns
                .filter((column) => column.mobile !== false)
                .map((column) => (
                  <div key={column.id} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
                    <dt className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {column.header}
                    </dt>
                    <dd className="min-w-0 text-sm text-foreground">{column.cell(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function DataTablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between"
    >
      <p className="min-w-0 text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
