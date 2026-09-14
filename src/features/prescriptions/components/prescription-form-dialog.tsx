import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
  prescriptionSchema,
  prescriptionStatuses,
  prescriptionStatusLabels,
  type Prescription,
  type PrescriptionFormValues,
} from "../types";

const emptyItem = {
  medication: "",
  dosage: "",
  frequency: "",
  durationDays: 7,
};

const emptyValues: PrescriptionFormValues = {
  patientId: "",
  doctorId: "",
  consultationId: "",
  issuedAt: "",
  items: [{ ...emptyItem }],
  instructions: "",
  status: "active",
};

export function PrescriptionFormDialog({
  open,
  onOpenChange,
  prescription,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription?: Prescription | undefined;
  onSubmit: (values: PrescriptionFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const { patientOptions, doctorOptions } = useLookups();
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      prescription
        ? {
            patientId: prescription.patientId,
            doctorId: prescription.doctorId,
            consultationId: prescription.consultationId,
            issuedAt: prescription.issuedAt.slice(0, 10),
            items: prescription.items.map((item) => ({ ...item })),
            instructions: prescription.instructions,
            status: prescription.status,
          }
        : emptyValues,
    );
  }, [open, prescription, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {prescription ? "Modifier l'ordonnance" : "Nouvelle ordonnance"}
          </DialogTitle>
          <DialogDescription>
            Ajoutez un ou plusieurs médicaments avec posologie et durée.
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

            <Field label="Date d'émission" htmlFor="issuedAt" error={errors.issuedAt?.message}>
              <Input id="issuedAt" type="date" {...form.register("issuedAt")} />
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
                      {prescriptionStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {prescriptionStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Médicaments</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ...emptyItem })}
              >
                <Plus className="size-4" />
                Ajouter
              </Button>
            </div>
            {errors.items?.message || errors.items?.root?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.items?.message ?? errors.items?.root?.message}
              </p>
            ) : null}
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-[1fr_1fr_1fr_6rem_auto]"
              >
                <Field
                  label="Médicament"
                  htmlFor={`items.${index}.medication`}
                  error={errors.items?.[index]?.medication?.message}
                >
                  <Input
                    id={`items.${index}.medication`}
                    {...form.register(`items.${index}.medication`)}
                  />
                </Field>
                <Field
                  label="Dosage"
                  htmlFor={`items.${index}.dosage`}
                  error={errors.items?.[index]?.dosage?.message}
                >
                  <Input id={`items.${index}.dosage`} {...form.register(`items.${index}.dosage`)} />
                </Field>
                <Field
                  label="Fréquence"
                  htmlFor={`items.${index}.frequency`}
                  error={errors.items?.[index]?.frequency?.message}
                >
                  <Input
                    id={`items.${index}.frequency`}
                    {...form.register(`items.${index}.frequency`)}
                  />
                </Field>
                <Field
                  label="Jours"
                  htmlFor={`items.${index}.durationDays`}
                  error={errors.items?.[index]?.durationDays?.message}
                >
                  <Input
                    id={`items.${index}.durationDays`}
                    type="number"
                    min={1}
                    {...form.register(`items.${index}.durationDays`)}
                  />
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                    aria-label="Supprimer le médicament"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Field label="Instructions" htmlFor="instructions" error={errors.instructions?.message}>
            <Textarea id="instructions" rows={3} {...form.register("instructions")} />
          </Field>

          <input type="hidden" {...form.register("consultationId")} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : prescription ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
