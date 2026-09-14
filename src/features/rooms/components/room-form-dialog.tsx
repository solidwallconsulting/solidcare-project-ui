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
  roomSchema,
  roomStatuses,
  roomStatusLabels,
  roomTypes,
  roomTypeLabels,
  type Room,
  type RoomFormValues,
} from "../types";

const emptyValues: RoomFormValues = {
  name: "",
  code: "",
  roomType: "consultation",
  departmentId: "",
  floor: "",
  capacity: 1,
  status: "available",
  notes: "",
};

export function RoomFormDialog({
  open,
  onOpenChange,
  room,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | undefined;
  onSubmit: (values: RoomFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const departments = useQuery({
    queryKey: departmentKeys.options,
    queryFn: () => departmentsApi.peekAll(),
    staleTime: 30_000,
  });

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      room
        ? {
            name: room.name,
            code: room.code,
            roomType: room.roomType,
            departmentId: room.departmentId,
            floor: room.floor,
            capacity: room.capacity,
            status: room.status,
            notes: room.notes,
          }
        : emptyValues,
    );
  }, [open, room, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{room ? "Modifier la salle" : "Nouvelle salle"}</DialogTitle>
          <DialogDescription>
            Ressource spatiale : consultation, soins, imagerie, opération ou réveil.
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
              <Input id="code" placeholder="C-201" {...form.register("code")} />
            </Field>

            <Field label="Type" error={errors.roomType?.message}>
              <Controller
                control={form.control}
                name="roomType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Type de salle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {roomTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
                      {roomStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {roomStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
            <Field label="Capacité" htmlFor="capacity" error={errors.capacity?.message}>
              <Input id="capacity" type="number" min={1} {...form.register("capacity")} />
            </Field>

            <Field
              label="Notes"
              htmlFor="notes"
              error={errors.notes?.message}
              className="sm:col-span-2"
            >
              <Textarea id="notes" rows={3} {...form.register("notes")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : room ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
