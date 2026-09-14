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
import { equipmentApi } from "@/features/equipment/api";
import { roomsApi, roomKeys } from "@/features/rooms/api";
import {
  maintenanceSchema,
  maintenancePriorities,
  maintenancePriorityLabels,
  maintenanceStatuses,
  maintenanceStatusLabels,
  type MaintenanceTicket,
  type MaintenanceFormValues,
} from "../types";

const emptyValues: MaintenanceFormValues = {
  equipmentId: "",
  roomId: "",
  problem: "",
  priority: "medium",
  status: "open",
  technicianName: "",
  notes: "",
};

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  ticket,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: MaintenanceTicket | undefined;
  onSubmit: (values: MaintenanceFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const equipment = useQuery({
    queryKey: ["equipment", "lookup"],
    queryFn: () => equipmentApi.peekAll(),
    staleTime: 30_000,
  });
  const rooms = useQuery({
    queryKey: roomKeys.options,
    queryFn: () => roomsApi.peekAll(),
    staleTime: 30_000,
  });

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      ticket
        ? {
            equipmentId: ticket.equipmentId,
            roomId: ticket.roomId ?? "",
            problem: ticket.problem,
            priority: ticket.priority,
            status: ticket.status,
            technicianName: ticket.technicianName,
            notes: ticket.notes,
          }
        : emptyValues,
    );
  }, [open, ticket, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{ticket ? "Modifier le ticket" : "Nouveau ticket de maintenance"}</DialogTitle>
          <DialogDescription>Signalement et suivi des interventions techniques.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              ...values,
              roomId: values.roomId || undefined,
            });
          })}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Équipement" error={errors.equipmentId?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="equipmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Équipement">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {(equipment.data ?? []).map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} · {item.reference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Salle (optionnel)" error={errors.roomId?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <Select
                    value={field.value || "__none__"}
                    onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                  >
                    <SelectTrigger aria-label="Salle">
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune</SelectItem>
                      {(rooms.data ?? []).map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} · {room.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Problème" htmlFor="problem" error={errors.problem?.message} className="sm:col-span-2">
              <Textarea id="problem" rows={3} {...form.register("problem")} />
            </Field>

            <Field label="Priorité" error={errors.priority?.message}>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Priorité">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenancePriorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {maintenancePriorityLabels[priority]}
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
                      {maintenanceStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {maintenanceStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label="Technicien"
              htmlFor="technicianName"
              error={errors.technicianName?.message}
              className="sm:col-span-2"
            >
              <Input id="technicianName" {...form.register("technicianName")} />
            </Field>

            <Field label="Notes" htmlFor="mnt-notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="mnt-notes" rows={2} {...form.register("notes")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : ticket ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
