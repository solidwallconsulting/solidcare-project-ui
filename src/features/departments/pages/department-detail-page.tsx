import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  DoorOpen,
  HeartPulse,
  Hospital,
  Pencil,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/shared/components/layout/page-container";
import { StatusBadge } from "@/shared/components/feedback/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback/states";
import { useLookups } from "@/shared/hooks/use-lookups";
import { formatDate, fullName } from "@/shared/utils/format";
import {
  departmentsApi,
  departmentKeys,
  DepartmentFormDialog,
  departmentStatusLabels,
  departmentRoleLabels,
  type DepartmentFormValues,
} from "@/features/departments";
import { doctorsApi } from "@/features/doctors/api";
import { doctorStatusLabels } from "@/features/doctors/types";
import { staffApi } from "@/features/staff/api";
import { staffRoleLabels, staffStatusLabels } from "@/features/staff/types";
import { roomsApi } from "@/features/rooms/api";
import { roomStatusLabels, roomTypeLabels } from "@/features/rooms/types";
import { equipmentApi } from "@/features/equipment/api";
import { equipmentStatusLabels } from "@/features/equipment/types";
import { wardsApi, bedsApi } from "@/features/wards/api";
import {
  wardRoomStatusLabels,
  wardRoomTypeLabels,
  bedStatusLabels,
} from "@/features/wards/types";
import { hospitalizationsApi } from "@/features/hospitalizations/api";
import { hospitalizationStatusLabels } from "@/features/hospitalizations/types";

type RelatedItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
};

export function DepartmentDetailPage({ departmentId }: { departmentId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { doctorName, patientName } = useLookups();
  const [editOpen, setEditOpen] = useState(false);

  const departmentQuery = useQuery({
    queryKey: departmentKeys.detail(departmentId),
    queryFn: () => departmentsApi.get(departmentId),
  });

  const relatedQuery = useQuery({
    queryKey: ["departments", departmentId, "related"],
    queryFn: async () => {
      const department = await departmentsApi.get(departmentId);
      const [
        doctors,
        staff,
        rooms,
        equipment,
        wardRooms,
        beds,
        hospitalizations,
      ] = await Promise.all([
        doctorsApi.peekAll(),
        staffApi.peekAll(),
        roomsApi.peekAll(),
        equipmentApi.peekAll(),
        wardsApi.peekAll(),
        bedsApi.peekAll(),
        hospitalizationsApi.peekAll(),
      ]);

      const assigned = new Set(department.doctorIds);
      const deptDoctors = doctors.filter(
        (doctor) => doctor.departmentId === departmentId || assigned.has(doctor.id),
      );
      const deptWards = wardRooms.filter((room) => room.departmentId === departmentId);
      const wardIds = new Set(deptWards.map((room) => room.id));

      return {
        doctors: deptDoctors,
        staff: staff.filter((member) => member.departmentId === departmentId),
        rooms: rooms.filter((room) => room.departmentId === departmentId),
        equipment: equipment.filter((item) => item.departmentId === departmentId),
        wardRooms: deptWards,
        beds: beds.filter((bed) => wardIds.has(bed.wardRoomId)),
        hospitalizations: hospitalizations.filter((item) => item.departmentId === departmentId),
      };
    },
    enabled: Boolean(departmentQuery.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: DepartmentFormValues) =>
      departmentsApi.update(departmentId, values),
    onSuccess: () => {
      toast.success("Département mis à jour");
      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: departmentKeys.detail(departmentId) });
      void queryClient.invalidateQueries({
        queryKey: ["departments", departmentId, "related"],
      });
    },
    onError: () => toast.error("Impossible d'enregistrer"),
  });

  if (departmentQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (departmentQuery.isError || !departmentQuery.data) {
    return (
      <PageContainer className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/departments">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <ErrorState
          description="Ce département est introuvable."
          onRetry={() => void departmentQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const department = departmentQuery.data;
  const related = relatedQuery.data;
  const counts = {
    doctors: related?.doctors.length ?? department.doctorIds.length,
    staff: related?.staff.length ?? 0,
    rooms: related?.rooms.length ?? 0,
    wards: related?.wardRooms.length ?? 0,
    beds: related?.beds.length ?? 0,
    equipment: related?.equipment.length ?? 0,
    hospitalizations: related?.hospitalizations.length ?? 0,
  };

  const go = (href: string) => {
    void navigate({ to: href as never });
  };

  return (
    <PageContainer className="space-y-5">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
              <Link to="/departments" aria-label="Retour aux départements">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {department.name}
                </h1>
                <StatusBadge
                  label={departmentStatusLabels[department.status]}
                  tone={department.status === "active" ? "success" : "neutral"}
                />
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {department.code} · Étage {department.floor} · {department.phone}
              </p>
            </div>
          </div>
          <Button onClick={() => setEditOpen(true)} className="w-full sm:w-auto">
            <Pencil className="size-4" />
            Modifier
          </Button>
        </div>
      </div>

      {department.description ? (
        <p className="max-w-3xl text-sm text-foreground/80">{department.description}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <StatChip icon={Stethoscope} label="Médecins" value={counts.doctors} />
        <StatChip icon={Users} label="Personnel" value={counts.staff} />
        <StatChip icon={DoorOpen} label="Salles" value={counts.rooms} />
        <StatChip icon={BedDouble} label="Chambres" value={counts.wards} />
        <StatChip icon={HeartPulse} label="Lits" value={counts.beds} />
        <StatChip icon={Wrench} label="Matériel" value={counts.equipment} />
        <StatChip icon={Hospital} label="Hospit." value={counts.hospitalizations} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="overview" className="rounded-lg border data-[state=active]:bg-accent">
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="doctors" className="rounded-lg border data-[state=active]:bg-accent">
            Médecins ({counts.doctors})
          </TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg border data-[state=active]:bg-accent">
            Personnel ({counts.staff})
          </TabsTrigger>
          <TabsTrigger value="spaces" className="rounded-lg border data-[state=active]:bg-accent">
            Espaces
          </TabsTrigger>
          <TabsTrigger value="resources" className="rounded-lg border data-[state=active]:bg-accent">
            Ressources
          </TabsTrigger>
          <TabsTrigger value="care" className="rounded-lg border data-[state=active]:bg-accent">
            Soins ({counts.hospitalizations})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4 text-primary" />
                  Direction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label={departmentRoleLabels.head} value={doctorName(department.headDoctorId)} />
                <InfoRow
                  label={departmentRoleLabels.teamLeader}
                  value={doctorName(department.teamLeaderId)}
                />
                <InfoRow label="Créé le" value={formatDate(department.createdAt)} />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Liens rapides</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/doctors">Médecins</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/staff">Personnel</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/rooms">Salles</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/wards">Chambres & lits</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/equipment">Matériel</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/hospitalizations">Hospitalisations</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors">
          <RelatedList
            empty="Aucun médecin lié à ce département."
            onNavigate={go}
            items={(related?.doctors ?? []).map((doctor) => {
              const role =
                doctor.id === department.headDoctorId
                  ? departmentRoleLabels.head
                  : doctor.id === department.teamLeaderId
                    ? departmentRoleLabels.teamLeader
                    : departmentRoleLabels.doctor;
              return {
                id: doctor.id,
                title: `Dr. ${fullName(doctor.firstName, doctor.lastName)}`,
                subtitle: `${doctor.specialty} · ${role}`,
                meta: doctorStatusLabels[doctor.status],
                href: `/doctors/${doctor.id}`,
              };
            })}
          />
        </TabsContent>

        <TabsContent value="staff">
          <RelatedList
            empty="Aucun personnel soignant assigné."
            onNavigate={go}
            items={(related?.staff ?? []).map((member) => ({
              id: member.id,
              title: fullName(member.firstName, member.lastName),
              subtitle: staffRoleLabels[member.role],
              meta: staffStatusLabels[member.status],
              href: "/staff",
            }))}
          />
        </TabsContent>

        <TabsContent value="spaces" className="space-y-4">
          <SectionTitle>Salles ({counts.rooms})</SectionTitle>
          <RelatedList
            empty="Aucune salle liée."
            onNavigate={go}
            items={(related?.rooms ?? []).map((room) => ({
              id: room.id,
              title: room.name,
              subtitle: `${roomTypeLabels[room.roomType]} · ${room.code}`,
              meta: roomStatusLabels[room.status],
              href: `/rooms/${room.id}`,
            }))}
          />
          <SectionTitle>Chambres ({counts.wards})</SectionTitle>
          <RelatedList
            empty="Aucune chambre liée."
            onNavigate={go}
            items={(related?.wardRooms ?? []).map((room) => ({
              id: room.id,
              title: room.code,
              subtitle: `${wardRoomTypeLabels[room.roomType]} · ${room.bedCount} lit(s)`,
              meta: wardRoomStatusLabels[room.status],
              href: `/wards/${room.id}`,
            }))}
          />
          <SectionTitle>Lits ({counts.beds})</SectionTitle>
          <RelatedList
            empty="Aucun lit dans les chambres de ce département."
            onNavigate={go}
            items={(related?.beds ?? []).map((bed) => ({
              id: bed.id,
              title: bed.code,
              subtitle: bed.patientId ? patientName(bed.patientId) : "Libre",
              meta: bedStatusLabels[bed.status],
              href: `/wards/${bed.wardRoomId}`,
            }))}
          />
        </TabsContent>

        <TabsContent value="resources">
          <RelatedList
            empty="Aucun matériel lié."
            onNavigate={go}
            items={(related?.equipment ?? []).map((item) => ({
              id: item.id,
              title: item.name,
              subtitle: item.reference,
              meta: equipmentStatusLabels[item.status],
              href: `/equipment/${item.id}`,
            }))}
          />
        </TabsContent>

        <TabsContent value="care">
          <RelatedList
            empty="Aucune hospitalisation pour ce département."
            onNavigate={go}
            items={(related?.hospitalizations ?? []).map((item) => ({
              id: item.id,
              title: item.reference,
              subtitle: `${patientName(item.patientId)} · ${doctorName(item.doctorId)}`,
              meta: hospitalizationStatusLabels[item.status],
              href: "/hospitalizations",
            }))}
          />
        </TabsContent>
      </Tabs>

      <DepartmentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        department={department}
        isSaving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />
    </PageContainer>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="truncate text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-1 font-display text-lg font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-sm font-semibold text-foreground">{children}</h3>;
}

function RelatedList({
  empty,
  items,
  onNavigate,
}: {
  empty: string;
  items: RelatedItem[];
  onNavigate: (href: string) => void;
}) {
  if (items.length === 0) {
    return <EmptyState title={empty} />;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onNavigate(item.href)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
