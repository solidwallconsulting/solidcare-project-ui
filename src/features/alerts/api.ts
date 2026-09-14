import { apiConfig } from "@/shared/api/api-config";
import { apiClient } from "@/shared/api/api-client";
import { delay, MockRepository } from "@/shared/api/mock-repository";
import { createResourceApi } from "@/shared/api/resource-api";
import { alertSeed } from "./mock-data";
import type { AlertListQuery, ClinicAlert } from "./types";

export const alertsRepository = new MockRepository<ClinicAlert>(alertSeed, "alt", [
  "title",
  "message",
  "module",
]);

const baseApi = createResourceApi<ClinicAlert, AlertListQuery>("/alerts", alertsRepository, {
  filter: (item, query) => {
    const severityOk =
      !query.severity || query.severity === "all" || item.severity === query.severity;
    const readOk =
      !query.read ||
      query.read === "all" ||
      (query.read === "unread" ? !item.read : item.read);
    return severityOk && readOk;
  },
});

export const alertsApi = {
  ...baseApi,
  async peekAll(): Promise<ClinicAlert[]> {
    return baseApi.peekAll();
  },
  async markRead(id: string): Promise<ClinicAlert> {
    if (!apiConfig.useMocks) {
      return apiClient.patch<ClinicAlert>(`/alerts/${id}/read`, { read: true });
    }
    await delay();
    return alertsRepository.update(id, { read: true });
  },
  async markAllRead(): Promise<void> {
    if (!apiConfig.useMocks) {
      await apiClient.post<void>("/alerts/mark-all-read", {});
      return;
    }
    await delay();
    for (const alert of alertsRepository.all()) {
      if (!alert.read) alertsRepository.update(alert.id, { read: true });
    }
  },
};

export const alertKeys = {
  all: ["alerts"] as const,
  list: (query?: AlertListQuery) => ["alerts", "list", query] as const,
};
