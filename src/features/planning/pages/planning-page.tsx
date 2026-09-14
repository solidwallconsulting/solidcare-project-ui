import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { PageContainer } from "@/shared/components/layout/page-container";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { LoadingState, EmptyState } from "@/shared/components/feedback/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { doctorsApi } from "@/features/doctors/api";
import { roomsApi } from "@/features/rooms/api";
import { staffApi } from "@/features/staff/api";
import { fullName } from "@/shared/utils/format";
import { planningEventsApi, planningKeys, shiftsApi } from "../api";
import {
  planningEventStatusLabels,
  resourceTypeLabels,
  shiftStatusLabels,
  shiftTypeLabels,
  type PlanningEvent,
  type PlanningResourceType,
  type ShiftAssignment,
} from "../types";

const TODAY = "2026-09-10";

const shiftStatusTone = {
  scheduled: "info",
  completed: "success",
  cancelled: "danger",
} as const;

const eventStatusTone = {
  scheduled: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "danger",
} as const;

function hourKey(time: string): string {
  return time.slice(0, 2);
}

function groupByHour<T extends { startTime: string }>(items: T[]): Array<{ hour: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of [...items].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    const key = `${hourKey(item.startTime)}:00`;
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }
  return [...map.entries()].map(([hour, grouped]) => ({ hour, items: grouped }));
}

function TimelineCard({
  title,
  meta,
  statusLabel,
  tone,
}: {
  title: string;
  meta: string;
  statusLabel: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
        <StatusBadge label={statusLabel} tone={tone} />
      </div>
    </div>
  );
}

function HourTimeline({
  groups,
  emptyTitle,
  renderItem,
}: {
  groups: Array<{ hour: string; items: Array<ShiftAssignment | PlanningEvent> }>;
  emptyTitle: string;
  renderItem: (item: ShiftAssignment | PlanningEvent) => React.ReactNode;
}) {
  if (groups.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.hour} className="grid gap-3 sm:grid-cols-[4.5rem_1fr]">
          <div className="flex items-start gap-2 pt-1 text-sm font-semibold text-primary">
            <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {group.hour}
          </div>
          <div className="space-y-2">{group.items.map((item) => renderItem(item))}</div>
        </div>
      ))}
    </div>
  );
}

export function PlanningPage() {
  const [tab, setTab] = useState("doctors");
  const [date] = useState(TODAY);

  const shiftsQuery = useQuery({
    queryKey: planningKeys.shifts({ date }),
    queryFn: () => shiftsApi.peekAll(),
  });
  const eventsQuery = useQuery({
    queryKey: planningKeys.events({ date }),
    queryFn: () => planningEventsApi.peekAll(),
  });
  const doctorsQuery = useQuery({
    queryKey: ["doctors", "lookup"],
    queryFn: () => doctorsApi.peekAll(),
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms", "lookup"],
    queryFn: () => roomsApi.peekAll(),
  });
  const staffQuery = useQuery({
    queryKey: ["staff", "lookup"],
    queryFn: () => staffApi.peekAll(),
  });

  const isLoading =
    shiftsQuery.isLoading ||
    eventsQuery.isLoading ||
    doctorsQuery.isLoading ||
    roomsQuery.isLoading ||
    staffQuery.isLoading;

  const doctorLabel = (id?: string) => {
    if (!id) return "—";
    const doctor = doctorsQuery.data?.find((item) => item.id === id);
    return doctor ? `Dr. ${fullName(doctor.firstName, doctor.lastName)}` : id;
  };
  const staffLabel = (id?: string) => {
    if (!id) return "—";
    const member = staffQuery.data?.find((item) => item.id === id);
    return member ? fullName(member.firstName, member.lastName) : id;
  };
  const roomLabel = (id?: string) => {
    if (!id) return "—";
    return roomsQuery.data?.find((item) => item.id === id)?.name ?? id;
  };
  const resourceLabel = (type: PlanningResourceType, id: string) => {
    if (type === "doctor") return doctorLabel(id);
    if (type === "nurse") return staffLabel(id);
    return roomLabel(id);
  };

  const todayShifts = useMemo(
    () => (shiftsQuery.data ?? []).filter((item) => item.date === date),
    [shiftsQuery.data, date],
  );
  const todayEvents = useMemo(
    () => (eventsQuery.data ?? []).filter((item) => item.date === date),
    [eventsQuery.data, date],
  );

  const doctorShifts = todayShifts.filter((item) => item.resourceType === "doctor");
  const roomShifts = todayShifts.filter(
    (item) => item.resourceType === "room" || item.resourceType === "operating_room",
  );
  const nurseShifts = todayShifts.filter(
    (item) => item.resourceType === "nurse" || Boolean(item.staffId),
  );

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Planning" description="Chargement du centre de planning…" />
        <LoadingState />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Centre de planning"
        description={`Timeline du ${date} — médecins, salles et vacations.`}
      />

      <Card className="shadow-card bg-card">
        <CardContent className="pt-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
              <TabsTrigger value="doctors">Médecins</TabsTrigger>
              <TabsTrigger value="rooms">Salles</TabsTrigger>
              <TabsTrigger value="shifts">Shifts</TabsTrigger>
            </TabsList>

            <TabsContent value="doctors" className="mt-0">
              <HourTimeline
                groups={groupByHour([...doctorShifts, ...todayEvents])}
                emptyTitle="Aucun créneau médecin aujourd'hui"
                renderItem={(item) => {
                  if ("resourceType" in item) {
                    return (
                      <TimelineCard
                        key={item.id}
                        title={item.title}
                        meta={`${item.startTime}–${item.endTime} · ${doctorLabel(item.doctorId)} · ${shiftTypeLabels[item.shift]}`}
                        statusLabel={shiftStatusLabels[item.status]}
                        tone={shiftStatusTone[item.status]}
                      />
                    );
                  }
                  return (
                    <TimelineCard
                      key={item.id}
                      title={item.title}
                      meta={`${item.startTime}–${item.endTime} · ${doctorLabel(item.doctorId)} · ${roomLabel(item.roomId ?? item.operatingRoomId)}`}
                      statusLabel={planningEventStatusLabels[item.status]}
                      tone={eventStatusTone[item.status]}
                    />
                  );
                }}
              />
            </TabsContent>

            <TabsContent value="rooms" className="mt-0">
              <HourTimeline
                groups={groupByHour([
                  ...roomShifts,
                  ...todayEvents.filter((event) => event.roomId || event.operatingRoomId),
                ])}
                emptyTitle="Aucune réservation de salle"
                renderItem={(item) => {
                  if ("resourceType" in item) {
                    return (
                      <TimelineCard
                        key={item.id}
                        title={item.title}
                        meta={`${item.startTime}–${item.endTime} · ${roomLabel(item.resourceId)} · ${doctorLabel(item.doctorId)}`}
                        statusLabel={shiftStatusLabels[item.status]}
                        tone={shiftStatusTone[item.status]}
                      />
                    );
                  }
                  return (
                    <TimelineCard
                      key={item.id}
                      title={item.title}
                      meta={`${item.startTime}–${item.endTime} · ${roomLabel(item.roomId ?? item.operatingRoomId)} · ${doctorLabel(item.doctorId)}`}
                      statusLabel={planningEventStatusLabels[item.status]}
                      tone={eventStatusTone[item.status]}
                    />
                  );
                }}
              />
            </TabsContent>

            <TabsContent value="shifts" className="mt-0">
              <HourTimeline
                groups={groupByHour(nurseShifts.length ? nurseShifts : todayShifts)}
                emptyTitle="Aucune vacation planifiée"
                renderItem={(item) => {
                  if (!("resourceType" in item)) return null;
                  return (
                    <TimelineCard
                      key={item.id}
                      title={item.title}
                      meta={`${item.startTime}–${item.endTime} · ${resourceTypeLabels[item.resourceType]} · ${resourceLabel(item.resourceType, item.resourceId)} · ${shiftTypeLabels[item.shift]}`}
                      statusLabel={shiftStatusLabels[item.status]}
                      tone={shiftStatusTone[item.status]}
                    />
                  );
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
