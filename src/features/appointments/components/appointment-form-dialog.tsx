import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/shared/components/forms/field";
import {
  appointmentSchema,
  appointmentStatuses,
  appointmentTypes,
  appointmentStatusLabels,
  appointmentTypeLabels,
  type Appointment,
  type AppointmentFormValues,
} from "../types";
import type { LookupOption } from "@/shared/hooks/use-lookups";

const emptyValues: AppointmentFormValues = {
  patientId: "",
  doctorId: "",
  startsAt: "",
  durationMinutes: 30,
  type: "consultation",
  status: "scheduled",
  reason: "",
  room: "",
};

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  patientOptions,
  doctorOptions,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | undefined;
  patientOptions: LookupOption[];
  doctorOptions: LookupOption[];
  onSubmit: (values: AppointmentFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      appointment
        ? {
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            startsAt: appointment.startsAt.slice(0, 16),
            durationMinutes: appointment.durationMinutes,
            type: appointment.type,
            status: appointment.status,
            reason: appointment.reason,
            room: appointment.room,
          }
        : emptyValues,
    );
  }, [open, appointment, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </DialogTitle>
          <DialogDescription>
            Planification interne uniquement — le patient est sélectionné par le personnel.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              ...values,
              startsAt: values.startsAt.length === 16 ? `${values.startsAt}:00` : values.startsAt,
            });
          })}
          noValidate
        >
          <Field label="Patient" error={errors.patientId?.message}>
            <Controller
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Patient">
                    <SelectValue placeholder="Choisir un patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
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
                    <SelectValue placeholder="Choisir un médecin" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date et heure" htmlFor="startsAt" error={errors.startsAt?.message}>
              <Input id="startsAt" type="datetime-local" {...form.register("startsAt")} />
            </Field>
            <Field label="Durée (min)" htmlFor="duration" error={errors.durationMinutes?.message}>
              <Input id="duration" type="number" {...form.register("durationMinutes")} />
            </Field>
            <Field label="Type" error={errors.type?.message}>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {appointmentTypeLabels[type]}
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {appointmentStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
          <Field label="Salle" htmlFor="room" error={errors.room?.message}>
            <Input id="room" placeholder="A-101" {...form.register("room")} />
          </Field>
          <Field label="Motif" htmlFor="reason" error={errors.reason?.message}>
            <Input id="reason" {...form.register("reason")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
