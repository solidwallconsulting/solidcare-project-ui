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
import { Textarea } from "@/components/ui/textarea";
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
  consultationSchema,
  consultationStatuses,
  consultationStatusLabels,
  type Consultation,
  type ConsultationFormValues,
} from "../types";

const emptyValues: ConsultationFormValues = {
  patientId: "",
  doctorId: "",
  appointmentId: "",
  date: "",
  symptoms: "",
  diagnosis: "",
  treatment: "",
  temperature: 37,
  bloodPressure: "",
  weight: 70,
  followUpDate: "",
  status: "draft",
};

export function ConsultationFormDialog({
  open,
  onOpenChange,
  consultation,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultation?: Consultation | undefined;
  onSubmit: (values: ConsultationFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const { patientOptions, doctorOptions } = useLookups();
  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      consultation
        ? {
            patientId: consultation.patientId,
            doctorId: consultation.doctorId,
            appointmentId: consultation.appointmentId,
            date: consultation.date.slice(0, 10),
            symptoms: consultation.symptoms,
            diagnosis: consultation.diagnosis,
            treatment: consultation.treatment,
            temperature: consultation.temperature,
            bloodPressure: consultation.bloodPressure,
            weight: consultation.weight,
            followUpDate: consultation.followUpDate?.slice(0, 10) ?? "",
            status: consultation.status,
          }
        : emptyValues,
    );
  }, [open, consultation, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {consultation ? "Modifier la consultation" : "Nouvelle consultation"}
          </DialogTitle>
          <DialogDescription>
            Saisie clinique interne — symptômes, diagnostic et constantes.
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
            <Field label="Patient" error={errors.patientId?.message}>
              <Controller
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Patient">
                      <SelectValue placeholder="Sélectionner un patient" />
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
                      <SelectValue placeholder="Sélectionner un médecin" />
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

            <Field label="Date" htmlFor="date" error={errors.date?.message}>
              <Input id="date" type="date" {...form.register("date")} />
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
                      {consultationStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {consultationStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label="Température (°C)"
              htmlFor="temperature"
              error={errors.temperature?.message}
            >
              <Input id="temperature" type="number" step="0.1" {...form.register("temperature")} />
            </Field>

            <Field
              label="Tension"
              htmlFor="bloodPressure"
              error={errors.bloodPressure?.message}
              hint="Format 120/80"
            >
              <Input id="bloodPressure" placeholder="120/80" {...form.register("bloodPressure")} />
            </Field>

            <Field label="Poids (kg)" htmlFor="weight" error={errors.weight?.message}>
              <Input id="weight" type="number" step="0.1" {...form.register("weight")} />
            </Field>

            <Field label="Suivi" htmlFor="followUpDate" error={errors.followUpDate?.message}>
              <Input id="followUpDate" type="date" {...form.register("followUpDate")} />
            </Field>

            <Field
              label="Symptômes"
              htmlFor="symptoms"
              error={errors.symptoms?.message}
              className="sm:col-span-2"
            >
              <Textarea id="symptoms" rows={2} {...form.register("symptoms")} />
            </Field>

            <Field
              label="Diagnostic"
              htmlFor="diagnosis"
              error={errors.diagnosis?.message}
              className="sm:col-span-2"
            >
              <Textarea id="diagnosis" rows={2} {...form.register("diagnosis")} />
            </Field>

            <Field
              label="Traitement"
              htmlFor="treatment"
              error={errors.treatment?.message}
              className="sm:col-span-2"
            >
              <Textarea id="treatment" rows={2} {...form.register("treatment")} />
            </Field>

            <input type="hidden" {...form.register("appointmentId")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : consultation ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
