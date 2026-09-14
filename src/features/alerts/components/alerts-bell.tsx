import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { alertKeys, alertsApi } from "../api";
import { alertSeverityLabels } from "../types";

export function AlertsBell() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: alertKeys.all,
    queryFn: () => alertsApi.peekAll(),
    staleTime: 15_000,
  });

  const markMutation = useMutation({
    mutationFn: (id: string) => alertsApi.markRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: alertKeys.all }),
  });

  const unread = data.filter((item) => !item.read);
  const preview = [...data]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Alertes" className="relative">
          <Bell className="size-4" />
          {unread.length > 0 ? (
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Alertes</span>
          <span className="text-xs font-normal text-muted-foreground">
            {unread.length} non lue{unread.length === 1 ? "" : "s"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {preview.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Aucune alerte
          </div>
        ) : (
          preview.map((alert) => (
            <DropdownMenuItem
              key={alert.id}
              className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
              onClick={() => {
                if (!alert.read) markMutation.mutate(alert.id);
              }}
            >
              <span className="text-xs text-muted-foreground">
                {alertSeverityLabels[alert.severity]}
                {!alert.read ? " · Non lue" : ""}
              </span>
              <span className="line-clamp-1 text-sm font-medium">{alert.title}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/alerts" className="w-full cursor-pointer justify-center text-center">
            Voir toutes les alertes
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
