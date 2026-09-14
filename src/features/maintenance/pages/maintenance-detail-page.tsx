import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/page-container";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { formatDateTime } from "@/shared/utils/format";
import { equipmentApi } from "@/features/equipment/api";
import { roomsApi } from "@/features/rooms/api";
import {
  maintenanceApi,
  maintenanceKeys,
  MaintenanceFormDialog,
  maintenancePriorityLabels,
  maintenanceStatusLabels,
  type MaintenanceFormValues,
  type MaintenanceTicket,
} from "@/features/maintenance";

const statusTone: Record<MaintenanceTicket["status"], StatusTone> = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  cancelled: "danger",
};

const priorityTone: Record<MaintenanceTicket["priority"], StatusTone> = {
  low: "info",
  medium: "warning",
  high: "danger",
};

export function MaintenanceDetailPage({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const ticketQuery = useQuery({
    queryKey: maintenanceKeys.detail(ticketId),
    queryFn: () => maintenanceApi.get(ticketId),
  });

  const relatedQuery = useQuery({
    queryKey: ["maintenance", ticketId, "related"],
    queryFn: async () => {
      const ticket = await maintenanceApi.get(ticketId);
      const [equipment, rooms] = await Promise.all([equipmentApi.peekAll(), roomsApi.peekAll()]);
      return {
        equipment: equipment.find((item) => item.id === ticket.equipmentId),
        room: ticket.roomId ? rooms.find((item) => item.id === ticket.roomId) : undefined,
      };
    },
    enabled: Boolean(ticketQuery.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: MaintenanceFormValues) => {
      const current = ticketQuery.data;
      const { roomId, ...rest } = values;
      const resolvedAt =
        values.status === "resolved"
          ? current?.resolvedAt || new Date().toISOString().slice(0, 19)
          : "";
      return maintenanceApi.update(ticketId, {
        ...rest,
        ...(roomId ? { roomId } : {}),
        resolvedAt,
      });
    },
    onSuccess: () => {
      toast.success("Ticket mis à jour");
      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ["maintenance", ticketId, "related"] });
    },
    onError: () => toast.error("Impossible d'enregistrer"),
  });

  if (ticketQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (ticketQuery.isError || !ticketQuery.data) {
    return (
      <PageContainer className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/maintenance">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <ErrorState
          description="Ce ticket est introuvable."
          onRetry={() => void ticketQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const ticket = ticketQuery.data;
  const equipment = relatedQuery.data?.equipment;
  const room = relatedQuery.data?.room;

  return (
    <PageContainer className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
              <Link to="/maintenance" aria-label="Retour aux tickets">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold tracking-[-0.02em]">
                  {ticket.reference}
                </h1>
                <StatusBadge label={maintenanceStatusLabels[ticket.status]} tone={statusTone[ticket.status]} />
                <StatusBadge
                  label={maintenancePriorityLabels[ticket.priority]}
                  tone={priorityTone[ticket.priority]}
                />
              </div>
              <p className="mt-1 max-w-3xl text-sm font-medium text-foreground">{ticket.problem}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground">
                {equipment ? (
                  <Link
                    to="/equipment/$id"
                    params={{ id: equipment.id }}
                    className="font-medium text-primary hover:underline"
                  >
                    {equipment.name}
                  </Link>
                ) : (
                  <span>Équipement inconnu</span>
                )}
                {room ? (
                  <Link
                    to="/rooms/$id"
                    params={{ id: room.id }}
                    className="font-medium text-primary hover:underline"
                  >
                    {room.name}
                  </Link>
                ) : (
                  <span>Salle non renseignée</span>
                )}
                <span>{ticket.technicianName}</span>
                <span>Créé le {formatDateTime(ticket.createdAt)}</span>
                {ticket.resolvedAt ? <span>Résolu le {formatDateTime(ticket.resolvedAt)}</span> : null}
              </div>
              {ticket.notes ? <p className="mt-1 max-w-3xl text-sm text-foreground">{ticket.notes}</p> : null}
            </div>
          </div>
          <Button className="w-full shrink-0 sm:w-auto lg:ml-4" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Modifier
          </Button>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Fact label="Référence" value={ticket.reference} />
        <Fact label="Technicien" value={ticket.technicianName} />
        <Fact label="Ouvert le" value={formatDateTime(ticket.createdAt)} />
        <Fact
          label="Clôturé le"
          value={ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : "En cours"}
        />
        <Fact label="Équipement" value={equipment ? `${equipment.name} · ${equipment.reference}` : "—"} />
        <Fact label="N° de série" value={equipment?.serialNumber || "—"} />
        <Fact label="Salle" value={room ? `${room.name} · ${room.code}` : "—"} />
        <Fact label="Catégorie" value={equipment?.category ?? "—"} />
      </dl>

      <MaintenanceFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        ticket={ticket}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />
    </PageContainer>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <dt className="text-xs font-medium text-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
