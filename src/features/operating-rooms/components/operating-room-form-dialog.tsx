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
import { departmentsApi, departmentKeys } from "@/features/departments/api";
import {
  operatingRoomSchema,
  operatingRoomStatuses,
  operatingRoomStatusLabels,
  type OperatingRoom,
  type OperatingRoomFormValues,
} from "../types";

const emptyValues: OperatingRoomFormValues = {
  name: "",
  code: "",
  departmentId: "",
  floor: "",
  tables: 1,
  status: "available",
  equipmentSummary: "",
  notes: "",
};

export function OperatingRoomFormDialog({
  open,
  onOpenChange,
  operatingRoom,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operatingRoom?: OperatingRoom | undefined;
  onSubmit: (values: OperatingRoomFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const departments = useQuery({
    queryKey: departmentKeys.options,
    queryFn: () => departmentsApi.peekAll(),
    staleTime: 30_000,
  });

  const form = useForm<OperatingRoomFormValues>({
    resolver: zodResolver(operatingRoomSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      operatingRoom
        ? {
            name: operatingRoom.name,
            code: operatingRoom.code,
            departmentId: operatingRoom.departmentId,
            floor: operatingRoom.floor,
            tables: operatingRoom.tables,
            status: operatingRoom.status,
            equipmentSummary: operatingRoom.equipmentSummary,
            notes: operatingRoom.notes,
          }
        : emptyValues,
    );
  }, [open, operatingRoom, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {operatingRoom ? "Modifier le bloc" : "Nouveau bloc opératoire"}
          </DialogTitle>
          <DialogDescription>
            Salles d&apos;opération : disponibilité, stérilisation et nombre de tables.
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
            <Field label="Nom" htmlFor="name" error={errors.name?.message}>
              <Input id="name" {...form.register("name")} />
            </Field>
            <Field label="Code" htmlFor="code" error={errors.code?.message}>
              <Input id="code" placeholder="OR-A" {...form.register("code")} />
            </Field>

            <Field label="Département" error={errors.departmentId?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Département">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments.data ?? []).map((dep) => (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Étage" htmlFor="floor" error={errors.floor?.message}>
              <Input id="floor" {...form.register("floor")} />
            </Field>
            <Field
              label="Tables / postes"
              htmlFor="tables"
              error={errors.tables?.message}
              hint="Nombre de tables opératoires"
            >
              <Input id="tables" type="number" min={1} {...form.register("tables")} />
            </Field>

            <Field label="Statut" error={errors.status?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Statut">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatingRoomStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {operatingRoomStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label="Équipement"
              htmlFor="equipmentSummary"
              error={errors.equipmentSummary?.message}
              className="sm:col-span-2"
            >
              <Textarea id="equipmentSummary" rows={2} {...form.register("equipmentSummary")} />
            </Field>

            <Field
              label="Notes"
              htmlFor="notes"
              error={errors.notes?.message}
              className="sm:col-span-2"
            >
              <Textarea id="notes" rows={2} {...form.register("notes")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : operatingRoom ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
