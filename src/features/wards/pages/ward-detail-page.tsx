import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/page-container";
import { StatusBadge, type StatusTone } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDate, formatDateTime } from "@/shared/utils/format";
import {
  bedsApi,
  bedKeys,
  bedStatusLabels,
  BedFormDialog,
  wardsApi,
  wardKeys,
  wardRoomStatusLabels,
  wardRoomTypeLabels,
  WardRoomFormDialog,
  type Bed,
  type BedFormValues,
  type WardRoomFormValues,
} from "@/features/wards";
import { WardPlanningSheet } from "@/features/wards/components/ward-planning-sheet";
import { hospitalizationsApi } from "@/features/hospitalizations/api";
import { hospitalizationStatusLabels } from "@/features/hospitalizations/types";

const statusTone: Record<"available" | "occupied" | "partial" | "maintenance", StatusTone> = {
  available: "success",
  occupied: "warning",
  partial: "info",
  maintenance: "danger",
};

const bedTone: Record<Bed["status"], StatusTone> = {
  available: "success",
  occupied: "warning",
  reserved: "info",
  cleaning: "warning",
  maintenance: "danger",
};

export function WardDetailPage({ wardId }: { wardId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { departmentName, patientName, doctorName, patientOptions } = useLookups();
  const [editOpen, setEditOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [bedOpen, setBedOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | undefined>();

  const roomQuery = useQuery({
    queryKey: wardKeys.detail(wardId),
    queryFn: () => wardsApi.get(wardId),
  });

  const relatedQuery = useQuery({
    queryKey: ["wards", wardId, "related"],
    queryFn: async () => {
      const [beds, stays] = await Promise.all([bedsApi.peekAll(), hospitalizationsApi.peekAll()]);
      return {
        beds: beds.filter((bed) => bed.wardRoomId === wardId),
        stays: stays
          .filter((item) => item.wardRoomId === wardId)
          .sort((a, b) => b.admittedAt.localeCompare(a.admittedAt)),
      };
    },
    enabled: Boolean(roomQuery.data),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: wardKeys.all });
    void queryClient.invalidateQueries({ queryKey: wardKeys.detail(wardId) });
    void queryClient.invalidateQueries({ queryKey: bedKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["wards", wardId, "related"] });
  };

  const saveRoom = useMutation({
    mutationFn: (values: WardRoomFormValues) => wardsApi.update(wardId, values),
    onSuccess: () => {
      toast.success("Chambre mise à jour");
      setEditOpen(false);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer"),
  });

  const saveBed = useMutation({
    mutationFn: (values: BedFormValues) => {
      const { patientId, ...rest } = values;
      const payload = {
        ...rest,
        wardRoomId: values.wardRoomId || wardId,
        ...(patientId ? { patientId } : {}),
      };
      return editingBed ? bedsApi.update(editingBed.id, payload) : bedsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingBed ? "Lit mis à jour" : "Lit créé");
      setBedOpen(false);
      setEditingBed(undefined);
      invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer le lit"),
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
          <Link to="/wards">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <ErrorState
          description="Cette chambre est introuvable."
          onRetry={() => void roomQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const room = roomQuery.data;
  const beds = relatedQuery.data?.beds ?? [];
  const stays = relatedQuery.data?.stays ?? [];
  const taken = beds.filter((bed) => bed.status === "occupied" || bed.status === "reserved").length;

  return (
    <PageContainer className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
              <Link to="/wards" aria-label="Retour aux chambres">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold tracking-[-0.02em]">
                  {room.code}
                </h1>
                <StatusBadge label={wardRoomStatusLabels[room.status]} tone={statusTone[room.status]} />
              </div>
              <p className="mt-0.5 text-sm text-foreground">
                {wardRoomTypeLabels[room.roomType]} · étage {room.floor} · {taken}/{room.bedCount} lits
                occupés ou réservés · créée le {formatDate(room.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link
                  to="/departments/$id"
                  params={{ id: room.departmentId }}
                  className="font-medium text-primary hover:underline"
                >
                  {departmentName(room.departmentId)}
                </Link>
                <span>{beds.length} lit{beds.length > 1 ? "s" : ""}</span>
                <span>{stays.length} séjour{stays.length > 1 ? "s" : ""}</span>
              </div>
              {room.notes ? <p className="mt-1 max-w-3xl text-sm text-foreground">{room.notes}</p> : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 pl-10 lg:pl-0">
            <Button variant="outline" onClick={() => setPlanningOpen(true)}>
              <CalendarRange className="size-4" />
              Planning
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingBed(undefined);
                setBedOpen(true);
              }}
            >
              <Plus className="size-4" />
              Lit
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="border-b border-border px-3 py-2">
          <h2 className="font-display text-sm font-semibold">Lits ({beds.length})</h2>
        </header>
        {beds.length === 0 ? (
          <div className="p-3">
            <EmptyState title="Aucun lit dans cette chambre." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {beds.map((bed) => (
              <li key={bed.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{bed.code}</span>
                  <span className="block truncate text-xs text-foreground">
                    {bed.patientId ? patientName(bed.patientId) : "Libre"}
                    {bed.notes ? ` · ${bed.notes}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <StatusBadge label={bedStatusLabels[bed.status]} tone={bedTone[bed.status]} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Modifier ${bed.code}`}
                    onClick={() => {
                      setEditingBed(bed);
                      setBedOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <h2 className="font-display text-sm font-semibold">Séjours ({stays.length})</h2>
          <Button variant="outline" size="sm" onClick={() => setPlanningOpen(true)}>
            <CalendarRange className="size-4" />
            Voir le planning
          </Button>
        </header>
        {stays.length === 0 ? (
          <div className="p-3">
            <EmptyState title="Aucun séjour enregistré." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stays.map((stay) => {
              const bed = beds.find((item) => item.id === stay.bedId);
              return (
                <li key={stay.id}>
                  <button
                    type="button"
                    onClick={() => void navigate({ to: "/hospitalizations" })}
                    className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {patientName(stay.patientId)} · {stay.reference}
                      </span>
                      <span className="block truncate text-xs text-foreground">
                        {bed?.code ?? stay.bedId} · {formatDateTime(stay.admittedAt)} · {doctorName(stay.doctorId)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-foreground">{stay.reason}</span>
                    </span>
                    <StatusBadge
                      label={hospitalizationStatusLabels[stay.status]}
                      tone={stay.status === "admitted" ? "warning" : stay.status === "discharged" ? "success" : "info"}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <WardRoomFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        room={room}
        isSaving={saveRoom.isPending}
        onSubmit={async (values) => {
          await saveRoom.mutateAsync(values);
        }}
      />

      <BedFormDialog
        open={bedOpen}
        onOpenChange={(open) => {
          setBedOpen(open);
          if (!open) setEditingBed(undefined);
        }}
        bed={editingBed}
        patientOptions={patientOptions}
        defaultWardRoomId={wardId}
        isSaving={saveBed.isPending}
        onSubmit={async (values) => {
          await saveBed.mutateAsync(values);
        }}
      />

      <WardPlanningSheet open={planningOpen} room={room} beds={beds} onOpenChange={setPlanningOpen} />
    </PageContainer>
  );
}
