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
import { formatDate } from "@/shared/utils/format";
import { useLookups } from "@/shared/hooks/use-lookups";
import {
  wardRoomStatusLabels,
  wardRoomTypeLabels,
  type Bed,
  type WardRoom,
} from "@/features/wards";
import { hospitalizationsApi } from "@/features/hospitalizations/api";
import {
  hospitalizationStatusLabels,
  type Hospitalization,
} from "@/features/hospitalizations/types";

const START_HOUR = 7;
const END_HOUR = 20;
const HOUR_PX = 40;
const PLATE_GAP = 6;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const statusTone: Record<WardRoom["status"], StatusTone> = {
  available: "success",
  occupied: "warning",
  partial: "info",
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
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  bedCode: string;
  reason: string;
  notes?: string;
  reference: string;
};

type PlacedSlot = {
  slot: Slot;
  trackTop: number;
  trackHeight: number;
  plateTop: number;
  plateHeight: number;
  lane: number;
};

export function WardPlanningSheet({
  open,
  onOpenChange,
  room,
  beds = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: WardRoom | undefined;
  beds?: Bed[];
}) {
  const { patientName, doctorName } = useLookups();
  const [anchor, setAnchor] = useState("2026-09-10");
  const [mode, setMode] = useState<ViewMode>("week");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAnchor("2026-09-10");
    setMode("week");
    setSelectedId(null);
  }, [open, room?.id]);

  const staysQuery = useQuery({
    queryKey: ["hospitalizations", "ward", room?.id],
    queryFn: () => hospitalizationsApi.peekAll(),
    enabled: open && Boolean(room),
  });

  const slots = useMemo(() => {
    if (!room) return [];
    const bedCode = (id: string) => beds.find((bed) => bed.id === id)?.code ?? id;
    return (staysQuery.data ?? [])
      .filter((item) => item.wardRoomId === room.id)
      .flatMap((item) => staySlots(item, patientName(item.patientId), bedCode(item.bedId)))
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  }, [beds, patientName, room, staysQuery.data]);

  const weekStart = mondayOf(anchor);
  const days = mode === "day" ? [anchor] : Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const visibleSlots = slots.filter((slot) => days.includes(slot.date));
  const selected = slots.find((slot) => slot.id === selectedId) ?? null;
  const selectedStay = (staysQuery.data ?? []).find((item) =>
    selected ? selected.id.startsWith(`${item.id}-`) : false,
  );

  const shiftRange = (direction: -1 | 1) => {
    setAnchor((current) => addDays(current, direction * (mode === "week" ? 7 : 1)));
    setSelectedId(null);
  };

  const rangeLabel =
    mode === "day" ? formatDate(anchor) : `${formatDate(days[0])} – ${formatDate(days[6] ?? days[0])}`;

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
                {room ? room.code : "Occupation"}
              </SheetTitle>
              <SheetDescription className="mt-1 text-foreground">
                {room
                  ? `${wardRoomTypeLabels[room.roomType]} · étage ${room.floor}`
                  : "Aucune chambre sélectionnée."}
              </SheetDescription>
            </div>
            {room ? (
              <StatusBadge label={wardRoomStatusLabels[room.status]} tone={statusTone[room.status]} />
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
              <EmptyState title="Aucune chambre sélectionnée." />
            </div>
          ) : staysQuery.isLoading ? (
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
                />
              </div>
              <aside className="min-h-0 overflow-y-auto p-3">
                <SlotDetail
                  slot={selected}
                  stay={selectedStay}
                  doctorName={selectedStay ? doctorName(selectedStay.doctorId) : "—"}
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
}: {
  days: string[];
  slots: Slot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  highlight: string;
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
          const count = placedByDay[index]?.length ?? 0;
          return (
            <div
              key={day}
              className={cn("border-b border-border px-1 pb-2 text-center", day === highlight && "text-primary")}
            >
              <p className="text-[11px] font-semibold tracking-wide uppercase">{weekdayLabel(date)}</p>
              <p className="font-display text-sm font-semibold tabular-nums">{date.getDate()}</p>
              <p className="text-[10px] font-medium text-foreground">
                {count === 0 ? "Libre" : `${count} lit${count > 1 ? "s" : ""}`}
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
          <div key={day} className="relative border-l border-border" style={{ height: contentHeight }}>
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
  onSelect,
}: {
  item: PlacedSlot;
  active: boolean;
  onSelect: () => void;
}) {
  const { slot, trackTop, trackHeight, plateTop, plateHeight, lane } = item;
  const accent = slotAccent[slot.status] ?? "border-l-primary";
  const rail = slotRail[slot.status] ?? "bg-primary";
  const label = `${slot.title}, ${slot.startTime}–${slot.endTime}`;

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
          "absolute right-1 z-10 overflow-hidden rounded-lg border border-border border-l-[3px] bg-card px-2 py-1.5 text-left shadow-sm",
          "hover:shadow-raised focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          accent,
          active && "z-20 border-primary shadow-raised ring-2 ring-primary",
        )}
        style={{ top: plateTop, height: plateHeight, left: 10 + lane * 2 }}
      >
        <span className="flex items-baseline justify-between gap-1">
          <span className="text-[11px] font-semibold tabular-nums text-primary">
            {slot.startTime}–{slot.endTime}
          </span>
          <span className="shrink-0 text-[10px] font-semibold text-foreground">{slot.bedCode}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug font-semibold text-foreground">
          {slot.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-foreground">{slot.reason}</span>
      </button>
    </>
  );
}

function SlotDetail({
  slot,
  stay,
  doctorName,
}: {
  slot: Slot | null;
  stay?: Hospitalization | undefined;
  doctorName: string;
}) {
  if (!slot || !stay) {
    return (
      <div className="flex h-full min-h-48 flex-col justify-center">
        <EmptyState
          title="Sélectionnez un séjour"
          description="Le détail s'affiche ici : patient, lit, motif et notes."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold tracking-wide uppercase">Séjour</p>
        <h3 className="mt-1 font-display text-base font-semibold tracking-tight">{slot.title}</h3>
      </div>
      <dl className="space-y-2.5 text-sm">
        <DetailRow icon={CalendarDays} label="Jour" value={formatDate(slot.date)} />
        <DetailRow
          icon={Clock3}
          label="Présence"
          value={`${slot.startTime} – ${slot.endTime}`}
        />
        <div>
          <dt className="text-xs">Statut</dt>
          <dd className="mt-1">
            <StatusBadge
              label={hospitalizationStatusLabels[stay.status]}
              tone={stay.status === "admitted" ? "warning" : stay.status === "discharged" ? "success" : "info"}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs">Lit</dt>
          <dd className="font-medium">{slot.bedCode}</dd>
        </div>
        <div>
          <dt className="text-xs">Médecin</dt>
          <dd className="font-medium">{doctorName}</dd>
        </div>
        <div>
          <dt className="text-xs">Admission</dt>
          <dd className="font-medium">{formatDate(stay.admittedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs">Motif</dt>
          <dd>{stay.reason}</dd>
        </div>
        <div>
          <dt className="text-xs">Notes</dt>
          <dd>{stay.notes?.trim() ? stay.notes : "Aucune note"}</dd>
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
        <dt className="text-xs">{label}</dt>
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
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function staySlots(item: Hospitalization, patient: string, bedCode: string): Slot[] {
  const startDate = item.admittedAt.slice(0, 10);
  const endDate = item.dischargedAt
    ? item.dischargedAt.slice(0, 10)
    : addDays(startDate, 14);
  const status = item.status === "admitted" ? "in_progress" : item.status === "discharged" ? "completed" : "cancelled";
  const slots: Slot[] = [];
  let cursor = startDate;
  while (cursor <= endDate && slots.length < 21) {
    const first = cursor === startDate;
    const last = Boolean(item.dischargedAt) && cursor === endDate;
    slots.push({
      id: `${item.id}-${cursor}`,
      title: patient,
      date: cursor,
      startTime: first ? timeOf(item.admittedAt) : "08:00",
      endTime: last ? timeOf(item.dischargedAt) : "18:00",
      status,
      bedCode,
      reason: item.reason,
      notes: item.notes,
      reference: item.reference,
    });
    cursor = addDays(cursor, 1);
  }
  return slots;
}

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
      } else ends[lane] = end;
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
    const plateHeight = 84;
    const plateTop = Math.max(trackTop, cursor);
    cursor = plateTop + plateHeight + PLATE_GAP;
    return { slot, trackTop, trackHeight, plateTop, plateHeight, lane };
  });
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
  return span > 0 ? span : 60;
}

function timeOf(value: string) {
  const match = value.match(/T(\d{2}:\d{2})/);
  const time = match?.[1] ?? "08:00";
  const minutes = minutesOf(time);
  if (minutes < START_HOUR * 60) return "08:00";
  if (minutes > 19 * 60) return "18:00";
  return time;
}
