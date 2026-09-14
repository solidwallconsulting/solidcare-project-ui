import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { LoadingState, EmptyState } from "@/shared/components/feedback/states";
import { cn } from "@/lib/utils";
import { roomStatusLabels, roomTypeLabels, type Room } from "@/features/rooms";
import {
  planningEventsApi,
  planningKeys,
  shiftsApi,
  planningEventStatusLabels,
  shiftStatusLabels,
  shiftTypeLabels,
  type PlanningEvent,
  type ShiftAssignment,
  type ShiftType,
} from "@/features/planning";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDate } from "@/shared/utils/format";

const START_HOUR = 7;
const END_HOUR = 20;
const HOUR_PX = 40;
const PLATE_GAP = 6;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const statusTone: Record<Room["status"], StatusTone> = {
  available: "success",
  occupied: "warning",
  reserved: "info",
  in_surgery: "warning",
  sterilizing: "info",
  maintenance: "danger",
};

const slotAccent: Record<string, string> = {
  scheduled: "border-l-primary",
  in_progress: "border-l-secondary",
  completed: "border-l-success",
  cancelled: "border-l-destructive",
};

const slotRail: Record<string, string> = {
  scheduled: "bg-primary",
  in_progress: "bg-secondary",
  completed: "bg-success",
  cancelled: "bg-destructive",
};

type ViewMode = "day" | "week";

type Slot = {
  id: string;
  kind: "event" | "shift";
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  doctorId?: string;
  notes?: string;
  shift?: ShiftType;
};

type RoomPlanningSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room;
};

export function RoomPlanningSheet({ open, onOpenChange, room }: RoomPlanningSheetProps) {
  const { doctorName, departmentName } = useLookups();
  const [anchor, setAnchor] = useState("2026-09-10");
  const [mode, setMode] = useState<ViewMode>("week");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAnchor("2026-09-10");
    setMode("week");
    setSelectedId(null);
  }, [open, room?.id]);

  const eventsQuery = useQuery({
    queryKey: planningKeys.events({ roomId: room?.id }),
    queryFn: () => planningEventsApi.peekAll(),
    enabled: open && Boolean(room),
  });

  const shiftsQuery = useQuery({
    queryKey: planningKeys.shifts({ resourceType: "room", roomId: room?.id }),
    queryFn: () => shiftsApi.peekAll(),
    enabled: open && Boolean(room),
  });

  const slots = useMemo(() => {
    if (!room) return [];
    const events = (eventsQuery.data ?? [])
      .filter((event) => event.roomId === room.id || event.operatingRoomId === room.id)
      .map(eventToSlot);
    const shifts = (shiftsQuery.data ?? [])
      .filter(
        (shift) =>
          shift.resourceId === room.id &&
          (shift.resourceType === "room" || shift.resourceType === "operating_room"),
      )
      .map(shiftToSlot);
    return [...events, ...shifts].sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    );
  }, [eventsQuery.data, room, shiftsQuery.data]);

  const weekStart = mondayOf(anchor);
  const days = mode === "day" ? [anchor] : Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const visibleSlots = slots.filter((slot) => days.includes(slot.date));
  const selected = slots.find((slot) => slot.id === selectedId) ?? null;

  const shiftRange = (direction: -1 | 1) => {
    setAnchor((current) => addDays(current, direction * (mode === "week" ? 7 : 1)));
    setSelectedId(null);
  };

  const isLoading = eventsQuery.isLoading || shiftsQuery.isLoading;
  const rangeLabel =
    mode === "day"
      ? formatDate(anchor)
      : `${formatDate(days[0])} – ${formatDate(days[6] ?? days[0])}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[min(100vw,78rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <SheetHeader className="gap-2 border-b border-border px-4 py-2.5 text-left">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <div className="min-w-0">
              <SheetTitle className="font-display text-base leading-none tracking-[-0.02em]">
                {room ? room.name : "Emploi du temps"}
              </SheetTitle>
              <SheetDescription className="mt-1 text-foreground">
                {room
                  ? `${room.code} · ${roomTypeLabels[room.roomType]}`
                  : "Aucune salle sélectionnée."}
              </SheetDescription>
            </div>
            {room ? (
              <StatusBadge label={roomStatusLabels[room.status]} tone={statusTone[room.status]} />
            ) : null}
            <div className="ml-auto inline-flex rounded-lg border border-border p-0.5">
              <ModeButton active={mode === "day"} onClick={() => setMode("day")}>
                Jour
              </ModeButton>
              <ModeButton active={mode === "week"} onClick={() => setMode("week")}>
                Semaine
              </ModeButton>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label={mode === "week" ? "Semaine précédente" : "Jour précédent"}
                onClick={() => shiftRange(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <p className="min-w-36 px-1 text-center text-xs font-medium">{rangeLabel}</p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label={mode === "week" ? "Semaine suivante" : "Jour suivant"}
                onClick={() => shiftRange(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          {!room ? (
            <div className="p-5">
              <EmptyState title="Aucune salle sélectionnée." />
            </div>
          ) : isLoading ? (
            <div className="p-5">
              <LoadingState />
            </div>
          ) : (
            <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_16.5rem]">
              <div className="min-h-0 overflow-auto border-b border-border lg:border-r lg:border-b-0">
                <Timetable
                  days={days}
                  slots={visibleSlots}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  highlight={anchor}
                  doctorName={doctorName}
                />
              </div>
              <aside className="min-h-0 overflow-y-auto border-border p-3">
                <SlotDetail
                  slot={selected}
                  room={room}
                  departmentName={departmentName(room.departmentId)}
                  doctorName={doctorName}
                />
              </aside>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Timetable({
  days,
  slots,
  selectedId,
  onSelect,
  highlight,
  doctorName,
}: {
  days: string[];
  slots: Slot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  highlight: string;
  doctorName: (id: string) => string;
}) {
  const placedByDay = days.map((day) => placeDay(slots.filter((slot) => slot.date === day)));
  const gridHeight = HOURS.length * HOUR_PX;
  const contentHeight = Math.max(
    gridHeight,
    ...placedByDay.flat().map((item) => item.plateTop + item.plateHeight + 8),
    0,
  );

  return (
    <div className="min-w-[42rem] px-2 py-2">
      <div
        className="grid"
        style={{ gridTemplateColumns: `3.4rem repeat(${days.length}, minmax(9.5rem, 1fr))` }}
      >
        <div />
        {days.map((day, index) => {
          const date = parseIso(day);
          const isFocus = day === highlight;
          const count = placedByDay[index]?.length ?? 0;
          return (
            <div
              key={day}
              className={cn(
                "border-b border-border px-1 pb-2 text-center",
                isFocus && "text-primary",
              )}
            >
              <p className="text-[11px] font-semibold tracking-wide uppercase">
                {weekdayLabel(date)}
              </p>
              <p className="font-display text-sm font-semibold tabular-nums">{date.getDate()}</p>
              <p className="text-[10px] font-medium text-foreground">
                {count === 0 ? "Libre" : `${count} créneau${count > 1 ? "x" : ""}`}
              </p>
            </div>
          );
        })}

        <div className="relative" style={{ height: contentHeight }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute right-1 text-[11px] font-medium tabular-nums text-foreground"
              style={{ top: (hour - START_HOUR) * HOUR_PX - 7 }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day, index) => (
          <div
            key={day}
            className="relative border-l border-border"
            style={{ height: contentHeight }}
          >
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-border"
                style={{ top: (hour - START_HOUR) * HOUR_PX, height: HOUR_PX }}
              />
            ))}
            {(placedByDay[index] ?? []).map((item) => (
              <SlotCard
                key={item.slot.id}
                item={item}
                active={item.slot.id === selectedId}
                doctorLabel={
                  item.slot.doctorId ? doctorName(item.slot.doctorId) : "Médecin non assigné"
                }
                onSelect={() => onSelect(item.slot.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotCard({
  item,
  active,
  doctorLabel,
  onSelect,
}: {
  item: PlacedSlot;
  active: boolean;
  doctorLabel: string;
  onSelect: () => void;
}) {
  const { slot, trackTop, trackHeight, plateTop, plateHeight, lane } = item;
  const accent = slotAccent[slot.status] ?? "border-l-primary";
  const rail = slotRail[slot.status] ?? "bg-primary";
  const label = `${slot.title}, ${slot.startTime}–${slot.endTime}${doctorLabel ? `, ${doctorLabel}` : ""}`;

  return (
    <>
      <span
        aria-hidden="true"
        className={cn("absolute w-1 rounded-full", rail)}
        style={{ top: trackTop + 2, height: Math.max(10, trackHeight - 4), left: 3 + lane * 6 }}
      />
      <button
        type="button"
        onClick={onSelect}
        title={label}
        aria-pressed={active}
        aria-label={label}
        className={cn(
          "absolute right-1 z-10 overflow-hidden rounded-lg border border-border border-l-[3px] bg-card px-2 py-1.5 text-left shadow-sm transition-shadow",
          "hover:shadow-raised focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          accent,
          slot.status === "cancelled" && "opacity-80",
          active && "z-20 border-primary shadow-raised ring-2 ring-primary",
        )}
        style={{ top: plateTop, height: plateHeight, left: 10 + lane * 2 }}
      >
        <span className="flex items-baseline justify-between gap-1">
          <span className="text-[11px] font-semibold tabular-nums text-primary">
            {slot.startTime}–{slot.endTime}
          </span>
          <span className="shrink-0 text-[10px] font-semibold text-foreground">
            {formatSpan(slot)}
          </span>
        </span>
        <span
          className={cn(
            "mt-0.5 line-clamp-2 text-[12px] leading-snug font-semibold text-foreground",
            slot.status === "cancelled" && "line-through",
          )}
        >
          {slot.title}
        </span>
        {doctorLabel ? (
          <span className="mt-0.5 block truncate text-[11px] font-medium text-foreground">
            {doctorLabel}
          </span>
        ) : (
          <span className="mt-0.5 block text-[10px] font-medium text-foreground">
            {slot.kind === "shift" ? "Vacation" : "Créneau"}
          </span>
        )}
      </button>
    </>
  );
}

function SlotDetail({
  slot,
  room,
  departmentName,
  doctorName,
}: {
  slot: Slot | null;
  room: Room;
  departmentName: string;
  doctorName: (id: string) => string;
}) {
  if (!slot) {
    return (
      <div className="flex h-full min-h-48 flex-col justify-center">
        <EmptyState
          title="Sélectionnez un créneau"
          description="Le détail s'affiche ici : horaire, médecin, statut et notes."
        />
      </div>
    );
  }

  const statusLabel =
    slot.kind === "event"
      ? planningEventStatusLabels[slot.status as keyof typeof planningEventStatusLabels] ?? slot.status
      : shiftStatusLabels[slot.status as keyof typeof shiftStatusLabels] ?? slot.status;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {slot.kind === "event" ? "Créneau" : "Réservation"}
        </p>
        <h3 className="mt-1 font-display text-base font-semibold tracking-tight">{slot.title}</h3>
      </div>

      <dl className="space-y-2.5 text-sm">
        <DetailRow icon={CalendarDays} label="Date" value={formatDate(slot.date)} />
        <DetailRow
          icon={Clock3}
          label="Horaire"
          value={`${slot.startTime} – ${slot.endTime} · ${durationMinutes(slot)} min`}
        />
        <div>
          <dt className="text-xs text-muted-foreground">Statut</dt>
          <dd className="mt-1">
            <StatusBadge label={statusLabel} tone={eventTone(slot.status)} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Médecin</dt>
          <dd className="font-medium">{slot.doctorId ? doctorName(slot.doctorId) : "Non assigné"}</dd>
        </div>
        {slot.shift ? (
          <div>
            <dt className="text-xs text-muted-foreground">Vacation</dt>
            <dd className="font-medium">{shiftTypeLabels[slot.shift]}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-muted-foreground">Salle</dt>
          <dd className="font-medium">
            {room.name}
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              {room.code} · {departmentName} · étage {room.floor} · cap. {room.capacity}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Notes</dt>
          <dd>{slot.notes?.trim() ? slot.notes : "Aucune note"}</dd>
        </div>
      </dl>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function eventToSlot(event: PlanningEvent): Slot {
  return {
    id: event.id,
    kind: "event",
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    status: event.status,
    doctorId: event.doctorId,
    notes: event.notes,
  };
}

function shiftToSlot(shift: ShiftAssignment): Slot {
  return {
    id: shift.id,
    kind: "shift",
    title: shift.title,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    status: shift.status,
    doctorId: shift.doctorId,
    shift: shift.shift,
  };
}

function eventTone(status: string): StatusTone {
  if (status === "in_progress") return "warning";
  if (status === "completed") return "success";
  if (status === "cancelled") return "danger";
  return "info";
}

function parseIso(value: string) {
  return new Date(`${value}T12:00:00`);
}

function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const date = parseIso(value);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

function mondayOf(value: string) {
  const date = parseIso(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIso(date);
}

type PlacedSlot = {
  slot: Slot;
  trackTop: number;
  trackHeight: number;
  plateTop: number;
  plateHeight: number;
  lane: number;
};

function placeDay(daySlots: Slot[]): PlacedSlot[] {
  const px = HOUR_PX / 60;
  const sorted = [...daySlots].sort(
    (a, b) => minutesOf(a.startTime) - minutesOf(b.startTime) || a.id.localeCompare(b.id),
  );

  const clustered: Array<{ slot: Slot; lane: number }> = [];
  let cluster: Slot[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const ends: number[] = [];
    for (const slot of cluster) {
      const start = minutesOf(slot.startTime);
      const end = start + durationMinutes(slot);
      let lane = ends.findIndex((value) => value <= start);
      if (lane < 0) {
        lane = ends.length;
        ends.push(end);
      } else {
        ends[lane] = end;
      }
      clustered.push({ slot, lane });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const slot of sorted) {
    const start = minutesOf(slot.startTime);
    const end = start + durationMinutes(slot);
    if (cluster.length > 0 && start >= clusterEnd) flush();
    cluster.push(slot);
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();

  let cursor = 0;
  return clustered.map(({ slot, lane }) => {
    const trackTop = minutesFromStart(slot.startTime) * px;
    const trackHeight = Math.max(12, durationMinutes(slot) * px);
    const plateHeight = plateSize();
    const plateTop = Math.max(trackTop, cursor);
    cursor = plateTop + plateHeight + PLATE_GAP;
    return { slot, trackTop, trackHeight, plateTop, plateHeight, lane };
  });
}

function plateSize() {
  return 84;
}

function formatSpan(slot: Slot) {
  const minutes = durationMinutes(slot);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest}` : `${hours} h`;
}

function weekdayLabel(date: Date) {
  const index = date.getDay();
  return WEEKDAYS[index === 0 ? 6 : index - 1] ?? "";
}

function minutesOf(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function minutesFromStart(time: string) {
  return Math.max(0, minutesOf(time) - START_HOUR * 60);
}

function durationMinutes(slot: Slot) {
  const span = minutesOf(slot.endTime) - minutesOf(slot.startTime);
  return span > 0 ? span : span + 24 * 60;
}
