import { apiClient } from "./api-client";
import { apiConfig } from "./api-config";
import type { ListQuery, PaginatedResponse } from "./api-types";
import { delay, MockRepository, type Identified } from "./mock-repository";

/**
 * Every feature API is created here so a single switch (`VITE_API_URL`) moves
 * the whole app from the mock layer to the real NestJS backend. Call
 * signatures consumed by the UI are identical in both modes.
 */
export interface ResourceApi<T extends Identified, Q extends ListQuery = ListQuery> {
  list(query?: Q): Promise<PaginatedResponse<T>>;
  get(id: string): Promise<T>;
  create(input: Omit<T, "id">): Promise<T>;
  update(id: string, input: Partial<Omit<T, "id">>): Promise<T>;
  remove(id: string): Promise<void>;
  /** Mock-only escape hatch used by dashboards and cross-feature lookups. */
  peekAll(): Promise<T[]>;
}

export function createResourceApi<T extends Identified, Q extends ListQuery = ListQuery>(
  path: string,
  repository: MockRepository<T>,
  options: { filter?: (item: T, query: Q) => boolean } = {},
): ResourceApi<T, Q> {
  const useMocks = apiConfig.useMocks;

  return {
    async list(query = {} as Q) {
      if (!useMocks) {
        return apiClient.get<PaginatedResponse<T>>(path, query as Record<string, unknown>);
      }
      await delay();
      const filtered = options.filter
        ? repository.find((item) => options.filter!(item, query))
        : undefined;
      return repository.list(query, filtered);
    },
    async get(id) {
      if (!useMocks) return apiClient.get<T>(`${path}/${id}`);
      await delay();
      return repository.byId(id);
    },
    async create(input) {
      if (!useMocks) return apiClient.post<T>(path, input);
      await delay();
      return repository.create(input as Omit<T, "id">);
    },
    async update(id, input) {
      if (!useMocks) return apiClient.patch<T>(`${path}/${id}`, input);
      await delay();
      return repository.update(id, input as Partial<T>);
    },
    async remove(id) {
      if (!useMocks) {
        await apiClient.delete<void>(`${path}/${id}`);
        return;
      }
      await delay();
      repository.remove(id);
    },
    async peekAll() {
      if (!useMocks) {
        const response = await apiClient.get<PaginatedResponse<T>>(path, { pageSize: 500 });
        return response.items;
      }
      await delay(60);
      return repository.all();
    },
  };
}
