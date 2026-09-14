import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/shared/components/forms/field";
import { bedsApi, bedKeys, wardsApi, wardKeys } from "@/features/wards/api";
import {
  hospitalizationSchema,
  hospitalizationStatuses,
  hospitalizationStatusLabels,
  type Hospitalization,
  type HospitalizationFormValues,
} from "../types";
import type { LookupOption } from "@/shared/hooks/use-lookups";

const emptyValues: HospitalizationFormValues = {
  patientId: "",
  doctorId: "",
  departmentId: "",
  wardRoomId: "",
  bedId: "",
  reason: "",
  admittedAt: "",
  dischargedAt: "",
  status: "admitted",
  notes: "",
};

export function HospitalizationFormDialog({
  open,
  onOpenChange,
  hospitalization,
  patientOptions,
  doctorOptions,
  departmentOptions,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalization?: Hospitalization | undefined;
  patientOptions: LookupOption[];
  doctorOptions: LookupOption[];
  departmentOptions: LookupOption[];
  onSubmit: (values: HospitalizationFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const rooms = useQuery({
    queryKey: wardKeys.options,
    queryFn: () => wardsApi.peekAll(),
    staleTime: 30_000,
  });
  const beds = useQuery({
    queryKey: bedKeys.options,
    queryFn: () => bedsApi.peekAll(),
    staleTime: 30_000,
  });

  const form = useForm<HospitalizationFormValues>({
    resolver: zodResolver(hospitalizationSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;
  const wardRoomId = useWatch({ control: form.control, name: "wardRoomId" });

  const availableBeds = useMemo(() => {
    const all = beds.data ?? [];
    if (!wardRoomId) return all;
    return all.filter(
      (bed) =>
        bed.wardRoomId === wardRoomId &&
        (bed.status === "available" ||
          bed.status === "reserved" ||
          bed.id === hospitalization?.bedId),
    );
  }, [beds.data, wardRoomId, hospitalization?.bedId]);

  useEffect(() => {
    if (!open) return;
    form.reset(
      hospitalization
        ? {
            patientId: hospitalization.patientId,
            doctorId: hospitalization.doctorId,
            departmentId: hospitalization.departmentId,
            wardRoomId: hospitalization.wardRoomId,
            bedId: hospitalization.bedId,
            reason: hospitalization.reason,
            admittedAt: hospitalization.admittedAt.slice(0, 16),
            dischargedAt: hospitalization.dischargedAt,
            status: hospitalization.status,
            notes: hospitalization.notes,
          }
        : {
            ...emptyValues,
            admittedAt: new Date().toISOString().slice(0, 16),
          },
    );
  }, [open, hospitalization, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {hospitalization ? "Modifier l'hospitalisation" : "Nouvelle admission"}
          </DialogTitle>
          <DialogDescription>
            Admission patient — sélection chambre et lit.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Patient" error={errors.patientId?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Patient">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Médecin" error={errors.doctorId?.message}>
              <Controller
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Médecin">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Département" error={errors.departmentId?.message}>
              <Controller
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Département">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Chambre" error={errors.wardRoomId?.message}>
              <Controller
                control={form.control}
                name="wardRoomId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("bedId", "");
                    }}
                  >
                    <SelectTrigger aria-label="Chambre">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {(rooms.data ?? []).map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.code} · étage {room.floor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Lit" error={errors.bedId?.message}>
              <Controller
                control={form.control}
                name="bedId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Lit">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBeds.map((bed) => (
                        <SelectItem key={bed.id} value={bed.id}>
                          {bed.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Admission" htmlFor="admittedAt" error={errors.admittedAt?.message}>
              <Input id="admittedAt" type="datetime-local" {...form.register("admittedAt")} />
            </Field>

            <Field label="Statut" error={errors.status?.message}>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Statut">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitalizationStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {hospitalizationStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Motif" htmlFor="reason" error={errors.reason?.message} className="sm:col-span-2">
              <Input id="reason" {...form.register("reason")} />
            </Field>

            <Field label="Notes" htmlFor="hosp-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="hosp-notes" rows={3} {...form.register("notes")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : hospitalization ? "Enregistrer" : "Admettre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
