import { apiConfig } from "./api-config";
import { ApiError, type ListQuery, type PaginatedResponse } from "./api-types";

export function delay(ms: number = apiConfig.mockLatencyMs): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function paginate<T>(items: T[], page = 1, pageSize = 10): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function sortBy<T extends Record<string, unknown>>(
  items: T[],
  key?: string,
  dir: "asc" | "desc" = "asc",
): T[] {
  if (!key) return items;
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const res = String(av ?? "").localeCompare(String(bv ?? ""), "fr", { numeric: true });
    return dir === "asc" ? res : -res;
  });
}

export function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

/**
 * In-memory repository backing the mock API layer.
 * Feature APIs talk to this today and to `apiClient` once the backend exists —
 * the call signatures the UI consumes never change.
 */
export interface Identified {
  id: string;
}

export class MockRepository<T extends Identified> {
  private items: T[];

  constructor(
    seed: T[],
    private readonly idPrefix: string,
    private readonly searchFields: (keyof T)[] = [],
  ) {
    this.items = [...seed];
  }

  all(): T[] {
    return [...this.items];
  }

  find(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  matchesSearch(item: T, search?: string): boolean {
    if (!search) return true;
    const needle = search.trim().toLowerCase();
    return this.searchFields.some((field) =>
      String(item[field] ?? "")
        .toLowerCase()
        .includes(needle),
    );
  }

  list(query: ListQuery = {}, filtered?: T[]): PaginatedResponse<T> {
    const base = (filtered ?? this.items).filter((item) => this.matchesSearch(item, query.search));
    const sorted = sortBy(
      base as unknown as Record<string, unknown>[],
      query.sortBy,
      query.sortDir ?? "asc",
    ) as unknown as T[];
    return paginate(sorted, query.page ?? 1, query.pageSize ?? 10);
  }

  byId(id: string): T {
    const found = this.items.find((item) => item.id === id);
    if (!found) throw new ApiError("Resource not found", 404);
    return found;
  }

  create(data: Omit<T, "id"> & { id?: string }): T {
    const created = { ...data, id: data.id ?? nextId(this.idPrefix) } as T;
    this.items = [created, ...this.items];
    return created;
  }

  update(id: string, patch: Partial<T>): T {
    const current = this.byId(id);
    const updated = { ...current, ...patch, id } as T;
    this.items = this.items.map((item) => (item.id === id ? updated : item));
    return updated;
  }

  remove(id: string): void {
    this.byId(id);
    this.items = this.items.filter((item) => item.id !== id);
  }
}
