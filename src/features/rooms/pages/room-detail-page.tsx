import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/shared/components/layout/page-container";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDate, formatDateTime } from "@/shared/utils/format";
import {
  roomsApi,
  roomKeys,
  RoomFormDialog,
  RoomPlanningSheet,
  roomStatusLabels,
  roomTypeLabels,
  type Room,
  type RoomFormValues,
} from "@/features/rooms";
import { equipmentApi } from "@/features/equipment/api";
import { equipmentStatusLabels } from "@/features/equipment/types";
import { appointmentsApi } from "@/features/appointments/api";
import {
  appointmentStatusLabels,
  appointmentTypeLabels,
} from "@/features/appointments/types";
import {
  planningEventsApi,
  planningEventStatusLabels,
  shiftsApi,
  shiftStatusLabels,
  shiftTypeLabels,
} from "@/features/planning";

const statusTone: Record<Room["status"], StatusTone> = {
  available: "success",
  occupied: "warning",
  reserved: "info",
  in_surgery: "warning",
  sterilizing: "info",
  maintenance: "danger",
};

export function RoomDetailPage({ roomId }: { roomId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { departmentName, doctorName, patientName } = useLookups();
  const [editOpen, setEditOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);

  const roomQuery = useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => roomsApi.get(roomId),
  });

  const relatedQuery = useQuery({
    queryKey: ["rooms", roomId, "related"],
    queryFn: async () => {
      const room = await roomsApi.get(roomId);
      const [equipment, appointments, events, shifts] = await Promise.all([
        equipmentApi.peekAll(),
        appointmentsApi.peekAll(),
        planningEventsApi.peekAll(),
        shiftsApi.peekAll(),
      ]);

      const code = room.code.toLowerCase();
      return {
        equipment: equipment.filter((item) => item.roomId === roomId),
        appointments: appointments.filter((item) => {
          const label = item.room.toLowerCase();
          return label === code || label.includes(code);
        }),
        events: events
          .filter((event) => event.roomId === roomId)
          .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
        shifts: shifts
          .filter((shift) => shift.resourceType === "room" && shift.resourceId === roomId)
          .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
      };
    },
    enabled: Boolean(roomQuery.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: RoomFormValues) => roomsApi.update(roomId, values),
    onSuccess: () => {
      toast.success("Salle mise à jour");
      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: roomKeys.all });
      void queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
      void queryClient.invalidateQueries({ queryKey: ["rooms", roomId, "related"] });
    },
    onError: () => toast.error("Impossible d'enregistrer"),
  });

  if (roomQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (roomQuery.isError || !roomQuery.data) {
    return (
      <PageContainer className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/rooms">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <ErrorState
          description="Cette salle est introuvable."
          onRetry={() => void roomQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const room = roomQuery.data;
  const related = relatedQuery.data;
  const eventCount = related?.events.length ?? 0;
  const shiftCount = related?.shifts.length ?? 0;
  const equipmentCount = related?.equipment.length ?? 0;
  const appointmentCount = related?.appointments.length ?? 0;

  return (
    <PageContainer className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
              <Link to="/rooms" aria-label="Retour aux salles">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold tracking-[-0.02em]">
                  {room.name}
                </h1>
                <StatusBadge label={roomStatusLabels[room.status]} tone={statusTone[room.status]} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {room.code} · {roomTypeLabels[room.roomType]} · étage {room.floor} · cap.{" "}
                {room.capacity} · créée le {formatDate(room.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link
                  to="/departments/$id"
                  params={{ id: room.departmentId }}
                  className="font-medium text-primary hover:underline"
                >
                  {departmentName(room.departmentId)}
                </Link>
                <span className="text-muted-foreground">{eventCount} créneaux</span>
                <span className="text-muted-foreground">{shiftCount} réservations</span>
                <span className="text-muted-foreground">{equipmentCount} équipements</span>
                <span className="text-muted-foreground">{appointmentCount} RDV</span>
              </div>
              {room.notes ? (
                <p className="mt-1 max-w-3xl text-sm text-foreground/75">{room.notes}</p>
              ) : null}
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

      <Tabs defaultValue="planning" className="space-y-3">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="planning" className="rounded-lg border data-[state=active]:bg-accent">
            Planning ({eventCount + shiftCount})
          </TabsTrigger>
          <TabsTrigger value="equipment" className="rounded-lg border data-[state=active]:bg-accent">
            Matériel ({equipmentCount})
          </TabsTrigger>
          <TabsTrigger value="appointments" className="rounded-lg border data-[state=active]:bg-accent">
            RDV ({appointmentCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-2">
            <DenseList
              title={`Créneaux (${eventCount})`}
              empty="Aucun créneau planifié."
              rows={(related?.events ?? []).map((event) => ({
                id: event.id,
                title: event.title,
                meta: `${formatDate(event.date)} · ${event.startTime}–${event.endTime}`,
                detail: `${doctorName(event.doctorId)}${event.notes ? ` · ${event.notes}` : ""}`,
                badge: planningEventStatusLabels[event.status],
                href: "/planning",
              }))}
              onOpen={(href) => void navigate({ to: href as never })}
            />
            <DenseList
              title={`Réservations (${shiftCount})`}
              empty="Aucune réservation."
              rows={(related?.shifts ?? []).map((shift) => ({
                id: shift.id,
                title: shift.title,
                meta: `${formatDate(shift.date)} · ${shift.startTime}–${shift.endTime} · ${shiftTypeLabels[shift.shift]}`,
                detail: shift.doctorId ? doctorName(shift.doctorId) : "Médecin non assigné",
                badge: shiftStatusLabels[shift.status],
                href: "/planning",
              }))}
              onOpen={(href) => void navigate({ to: href as never })}
            />
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <DenseList
            title={`Équipements (${equipmentCount})`}
            empty="Aucun matériel lié à cette salle."
            rows={(related?.equipment ?? []).map((item) => ({
              id: item.id,
              title: item.name,
              meta: `${item.reference} · ${item.category} · n° ${item.serialNumber}`,
              detail: `Prochaine maintenance ${formatDate(item.nextMaintenanceAt)}${item.notes ? ` · ${item.notes}` : ""}`,
              badge: equipmentStatusLabels[item.status],
              href: `/equipment/${item.id}`,
            }))}
            onOpen={(href) => void navigate({ to: href as never })}
          />
        </TabsContent>

        <TabsContent value="appointments">
          <DenseList
            title={`Rendez-vous (${appointmentCount})`}
            empty="Aucun rendez-vous associé à cette salle."
            rows={(related?.appointments ?? []).map((item) => ({
              id: item.id,
              title: `${patientName(item.patientId)} · ${appointmentTypeLabels[item.type]}`,
              meta: `${formatDateTime(item.startsAt)} · ${item.durationMinutes} min · ${doctorName(item.doctorId)}`,
              detail: item.reason,
              badge: appointmentStatusLabels[item.status],
              href: "/appointments",
            }))}
            onOpen={(href) => void navigate({ to: href as never })}
          />
        </TabsContent>
      </Tabs>

      <RoomFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        room={room}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <RoomPlanningSheet open={planningOpen} room={room} onOpenChange={setPlanningOpen} />
    </PageContainer>
  );
}

function DenseList({
  title,
  empty,
  rows,
  onOpen,
}: {
  title: string;
  empty: string;
  rows: Array<{
    id: string;
    title: string;
    meta: string;
    detail: string;
    badge: string;
    href: string;
  }>;
  onOpen: (href: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="border-b border-border px-3 py-2">
        <h2 className="font-display text-sm font-semibold">{title}</h2>
      </header>
      {rows.length === 0 ? (
        <div className="p-3">
          <EmptyState title={empty} />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onOpen(row.href)}
                className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{row.meta}</span>
                  {row.detail ? (
                    <span className="mt-0.5 block truncate text-xs text-foreground/70">
                      {row.detail}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{row.badge}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
