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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/shared/components/forms/field";
import { useLookups } from "@/shared/hooks/use-lookups";
import {
  doctorSchema,
  doctorStatuses,
  doctorStatusLabels,
  specialties,
  specialtyLabels,
  weekdays,
  weekdayLabels,
  type Doctor,
  type DoctorFormValues,
  type Weekday,
} from "../types";

const emptyValues: DoctorFormValues = {
  firstName: "",
  lastName: "",
  specialty: "General medicine",
  licenseNumber: "",
  phone: "",
  email: "",
  consultationFee: 60,
  availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  status: "available",
  room: "",
  departmentId: "",
};

export function DoctorFormDialog({
  open,
  onOpenChange,
  doctor,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: Doctor | undefined;
  onSubmit: (values: DoctorFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const { departmentOptions } = useLookups();
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;
  const availableDays = form.watch("availableDays");

  useEffect(() => {
    if (!open) return;
    form.reset(
      doctor
        ? {
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            specialty: doctor.specialty,
            licenseNumber: doctor.licenseNumber,
            phone: doctor.phone,
            email: doctor.email,
            consultationFee: doctor.consultationFee,
            availableDays: doctor.availableDays,
            status: doctor.status,
            room: doctor.room,
            departmentId: doctor.departmentId,
          }
        : emptyValues,
    );
  }, [open, doctor, form]);

  const toggleDay = (day: Weekday, checked: boolean) => {
    const current = form.getValues("availableDays");
    form.setValue(
      "availableDays",
      checked ? [...current, day] : current.filter((item) => item !== day),
      { shouldValidate: true },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{doctor ? "Modifier le médecin" : "Nouveau médecin"}</DialogTitle>
          <DialogDescription>Fiche interne du praticien et planning hebdomadaire.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" htmlFor="firstName" error={errors.firstName?.message}>
              <Input id="firstName" {...form.register("firstName")} />
            </Field>
            <Field label="Nom" htmlFor="lastName" error={errors.lastName?.message}>
              <Input id="lastName" {...form.register("lastName")} />
            </Field>

            <Field label="Spécialité" error={errors.specialty?.message}>
              <Controller
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Spécialité">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialtyLabels[specialty]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label="N° licence"
              htmlFor="licenseNumber"
              error={errors.licenseNumber?.message}
            >
              <Input id="licenseNumber" {...form.register("licenseNumber")} />
            </Field>

            <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" inputMode="tel" {...form.register("phone")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...form.register("email")} />
            </Field>

            <Field
              label="Honoraires (TND)"
              htmlFor="consultationFee"
              error={errors.consultationFee?.message}
            >
              <Input
                id="consultationFee"
                type="number"
                min={0}
                {...form.register("consultationFee")}
              />
            </Field>

            <Field label="Salle" htmlFor="room" error={errors.room?.message}>
              <Input id="room" {...form.register("room")} />
            </Field>

            <Field label="Département" error={errors.departmentId?.message}>
              <Controller
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger aria-label="Département">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {departmentOptions.map((dep) => (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.label}
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
                      {doctorStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {doctorStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label="Jours disponibles"
              error={errors.availableDays?.message}
              className="sm:col-span-2"
            >
              <div className="flex flex-wrap gap-3">
                {weekdays.map((day) => (
                  <label key={day} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={availableDays.includes(day)}
                      onCheckedChange={(checked) => toggleDay(day, checked === true)}
                    />
                    {weekdayLabels[day]}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : doctor ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
