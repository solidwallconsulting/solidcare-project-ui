import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { LoadingState, EmptyState } from "@/shared/components/feedback/states";
import { formatDateTime } from "@/shared/utils/format";
import { alertKeys, alertsApi } from "../api";
import { alertSeverityLabels, type AlertSeverity } from "../types";

const severityTone: Record<AlertSeverity, "danger" | "warning" | "info"> = {
  critical: "danger",
  warning: "warning",
  info: "info",
};

export function AlertsPage() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: alertKeys.all,
    queryFn: () => alertsApi.peekAll(),
  });

  const markMutation = useMutation({
    mutationFn: (id: string) => alertsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertKeys.all });
      toast.success("Toutes les alertes marquées comme lues");
    },
  });

  const alerts = [...(listQuery.data ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const unread = alerts.filter((item) => !item.read).length;

  return (
    <PageContainer>
      <PageHeader
        title="Centre d'alertes"
        description="Incidents opérationnels : blocs, lits, matériel et examens."
        actions={
          unread > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              <CheckCheck className="size-4" />
              Tout marquer lu
            </Button>
          ) : null
        }
      />

      {listQuery.isLoading ? (
        <LoadingState />
      ) : alerts.length === 0 ? (
        <EmptyState title="Aucune alerte" />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card shadow-card">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between ${
                alert.read ? "opacity-70" : ""
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={alertSeverityLabels[alert.severity]}
                    tone={severityTone[alert.severity]}
                  />
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(alert.createdAt)} · {alert.module}
                  </span>
                </div>
                <p className="font-medium text-foreground">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
              </div>
              {!alert.read ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 self-start"
                  disabled={markMutation.isPending}
                  onClick={() => markMutation.mutate(alert.id)}
                >
                  Marquer lu
                </Button>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">Lu</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
