import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { wardsApi, wardKeys } from "../api";
import {
  bedSchema,
  bedStatuses,
  bedStatusLabels,
  type Bed,
  type BedFormValues,
} from "../types";
import type { LookupOption } from "@/shared/hooks/use-lookups";

const emptyValues: BedFormValues = {
  code: "",
  wardRoomId: "",
  status: "available",
  patientId: "",
  notes: "",
};

export function BedFormDialog({
  open,
  onOpenChange,
  bed,
  patientOptions,
  defaultWardRoomId,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed?: Bed | undefined;
  patientOptions: LookupOption[];
  defaultWardRoomId?: string;
  onSubmit: (values: BedFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const rooms = useQuery({
    queryKey: wardKeys.options,
    queryFn: () => wardsApi.peekAll(),
    staleTime: 30_000,
  });

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      bed
        ? {
            code: bed.code,
            wardRoomId: bed.wardRoomId,
            status: bed.status,
            patientId: bed.patientId ?? "",
            notes: bed.notes,
          }
        : {
            ...emptyValues,
            wardRoomId: defaultWardRoomId ?? "",
          },
    );
  }, [open, bed, defaultWardRoomId, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{bed ? "Modifier le lit" : "Nouveau lit"}</DialogTitle>
          <DialogDescription>Lit rattaché à une chambre d&apos;hospitalisation.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              ...values,
              patientId: values.patientId || undefined,
            });
          })}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" htmlFor="bed-code" error={errors.code?.message}>
              <Input id="bed-code" placeholder="CH-201-A" {...form.register("code")} />
            </Field>
            <Field label="Statut" error={errors.status?.message}>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Statut du lit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bedStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {bedStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Chambre" error={errors.wardRoomId?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="wardRoomId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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

            <Field label="Patient (optionnel)" error={errors.patientId?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <Select
                    value={field.value || "__none__"}
                    onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                  >
                    <SelectTrigger aria-label="Patient">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucun</SelectItem>
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

            <Field
              label="Notes"
              htmlFor="bed-notes"
              error={errors.notes?.message}
              className="sm:col-span-2"
            >
              <Textarea id="bed-notes" rows={3} {...form.register("notes")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : bed ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
