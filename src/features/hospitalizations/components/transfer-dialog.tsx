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
import { transferSchema, type TransferFormValues } from "../types";

const emptyValues: TransferFormValues = {
  wardRoomId: "",
  bedId: "",
  notes: "",
};

export function TransferDialog({
  open,
  onOpenChange,
  currentBedId,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBedId?: string;
  onSubmit: (values: TransferFormValues) => Promise<void> | void;
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

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;
  const wardRoomId = useWatch({ control: form.control, name: "wardRoomId" });

  const availableBeds = useMemo(() => {
    const all = beds.data ?? [];
    if (!wardRoomId) return [];
    return all.filter(
      (bed) =>
        bed.wardRoomId === wardRoomId &&
        bed.id !== currentBedId &&
        (bed.status === "available" || bed.status === "reserved"),
    );
  }, [beds.data, wardRoomId, currentBedId]);

  useEffect(() => {
    if (!open) return;
    form.reset(emptyValues);
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transférer le patient</DialogTitle>
          <DialogDescription>Changer de chambre et de lit.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          noValidate
        >
          <Field label="Nouvelle chambre" error={errors.wardRoomId?.message}>
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
                        {room.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Nouveau lit" error={errors.bedId?.message}>
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

          <Field label="Notes" htmlFor="transfer-notes" error={errors.notes?.message}>
            <Textarea id="transfer-notes" rows={2} {...form.register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Transfert…" : "Transférer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
