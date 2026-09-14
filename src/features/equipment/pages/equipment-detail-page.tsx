import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/page-container";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDate, formatDateTime } from "@/shared/utils/format";
import { roomsApi } from "@/features/rooms/api";
import {
  equipmentApi,
  equipmentKeys,
  equipmentStatusLabels,
  EquipmentFormDialog,
  type Equipment,
  type EquipmentFormValues,
} from "@/features/equipment";
import { EquipmentPlanningSheet } from "@/features/equipment/components/equipment-planning-sheet";
import { maintenanceApi } from "@/features/maintenance/api";
import {
  maintenancePriorityLabels,
  maintenanceStatusLabels,
} from "@/features/maintenance/types";

const statusTone: Record<Equipment["status"], StatusTone> = {
  available: "success",
  in_use: "info",
  maintenance: "warning",
  retired: "danger",
};

export function EquipmentDetailPage({ equipmentId }: { equipmentId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { departmentName } = useLookups();
  const [editOpen, setEditOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);

  const equipmentQuery = useQuery({
    queryKey: equipmentKeys.detail(equipmentId),
    queryFn: () => equipmentApi.get(equipmentId),
  });

  const relatedQuery = useQuery({
    queryKey: ["equipment", equipmentId, "related"],
    queryFn: async () => {
      const item = await equipmentApi.get(equipmentId);
      const [rooms, tickets] = await Promise.all([roomsApi.peekAll(), maintenanceApi.peekAll()]);
      return {
        room: rooms.find((room) => room.id === item.roomId),
        tickets: tickets
          .filter((ticket) => ticket.equipmentId === equipmentId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      };
    },
    enabled: Boolean(equipmentQuery.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: EquipmentFormValues) =>
      equipmentApi.update(equipmentId, { ...values, roomId: values.roomId ?? "" }),
    onSuccess: () => {
      toast.success("Matériel mis à jour");
      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(equipmentId) });
      void queryClient.invalidateQueries({ queryKey: ["equipment", equipmentId, "related"] });
    },
    onError: () => toast.error("Impossible d'enregistrer"),
  });

  if (equipmentQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (equipmentQuery.isError || !equipmentQuery.data) {
    return (
      <PageContainer className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/equipment">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <ErrorState
          description="Ce matériel est introuvable."
          onRetry={() => void equipmentQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const item = equipmentQuery.data;
  const related = relatedQuery.data;
  const tickets = related?.tickets ?? [];
  const room = related?.room;

  return (
    <PageContainer className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
              <Link to="/equipment" aria-label="Retour au matériel">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold tracking-[-0.02em]">
                  {item.name}
                </h1>
                <StatusBadge label={equipmentStatusLabels[item.status]} tone={statusTone[item.status]} />
              </div>
              <p className="mt-0.5 text-sm text-foreground">
                {item.reference} · {item.category} · n° {item.serialNumber} · acheté le{" "}
                {formatDate(item.purchaseDate)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link
                  to="/departments/$id"
                  params={{ id: item.departmentId }}
                  className="font-medium text-primary hover:underline"
                >
                  {departmentName(item.departmentId)}
                </Link>
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
                <span>Dernière maint. {formatDate(item.lastMaintenanceAt)}</span>
                <span>Prochaine {formatDate(item.nextMaintenanceAt)}</span>
                <span>
                  {tickets.length} intervention{tickets.length > 1 ? "s" : ""}
                </span>
              </div>
              {item.notes ? <p className="mt-1 max-w-3xl text-sm text-foreground">{item.notes}</p> : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-2 pl-10 lg:pl-0">
            <Button variant="outline" onClick={() => setPlanningOpen(true)}>
              <CalendarRange className="size-4" />
              Planning
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <h2 className="font-display text-sm font-semibold">Interventions ({tickets.length})</h2>
          <Button variant="outline" size="sm" onClick={() => setPlanningOpen(true)}>
            <CalendarRange className="size-4" />
            Voir le planning
          </Button>
        </header>
        {tickets.length === 0 ? (
          <div className="p-3">
            <EmptyState title="Aucune intervention enregistrée." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/maintenance/$id", params: { id: ticket.id } })}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{ticket.problem}</span>
                    <span className="block truncate text-xs text-foreground">
                      {ticket.reference} · {formatDateTime(ticket.createdAt)} · {ticket.technicianName}
                    </span>
                    {ticket.notes ? (
                      <span className="mt-0.5 block truncate text-xs text-foreground">{ticket.notes}</span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                    <StatusBadge
                      label={maintenanceStatusLabels[ticket.status]}
                      tone={ticket.status === "resolved" ? "success" : ticket.status === "cancelled" ? "danger" : "info"}
                    />
                    <span className="text-xs text-foreground">
                      {maintenancePriorityLabels[ticket.priority]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EquipmentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        equipment={item}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <EquipmentPlanningSheet
        open={planningOpen}
        equipment={item}
        roomName={room?.name}
        onOpenChange={setPlanningOpen}
      />
    </PageContainer>
  );
}
