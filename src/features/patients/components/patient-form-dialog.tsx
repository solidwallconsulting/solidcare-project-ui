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
import {
  bloodGroups,
  genders,
  patientSchema,
  patientStatuses,
  type Patient,
  type PatientFormValues,
} from "../types";

const emptyValues: PatientFormValues = {
  firstName: "",
  lastName: "",
  gender: "female",
  dateOfBirth: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  bloodGroup: "O+",
  insurance: "",
  allergies: "",
  chronicConditions: "",
  medicalHistory: "",
  notes: "",
  status: "active",
};

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | undefined;
  onSubmit: (values: PatientFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      patient
        ? {
            firstName: patient.firstName,
            lastName: patient.lastName,
            gender: patient.gender,
            dateOfBirth: patient.dateOfBirth,
            phone: patient.phone,
            email: patient.email,
            city: patient.city,
            address: patient.address,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactPhone: patient.emergencyContactPhone,
            bloodGroup: patient.bloodGroup,
            insurance: patient.insurance,
            allergies: patient.allergies,
            chronicConditions: patient.chronicConditions,
            medicalHistory: patient.medicalHistory,
            notes: patient.notes,
            status: patient.status,
          }
        : emptyValues,
    );
  }, [open, patient, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{patient ? "Modifier le patient" : "Nouveau patient"}</DialogTitle>
          <DialogDescription>
            Dossier interne SolidCare — données fictives uniquement pour la démo.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          noValidate
        >
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Identité</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" htmlFor="firstName" error={errors.firstName?.message}>
                <Input id="firstName" {...form.register("firstName")} />
              </Field>
              <Field label="Nom" htmlFor="lastName" error={errors.lastName?.message}>
                <Input id="lastName" {...form.register("lastName")} />
              </Field>
              <Field label="Sexe" error={errors.gender?.message}>
                <Controller
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Sexe">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Femme</SelectItem>
                        <SelectItem value="male">Homme</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Date de naissance" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
                <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Contact</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" inputMode="tel" {...form.register("phone")} />
              </Field>
              <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
                <Input id="email" type="email" {...form.register("email")} />
              </Field>
              <Field label="Ville" htmlFor="city" error={errors.city?.message}>
                <Input id="city" {...form.register("city")} />
              </Field>
              <Field label="Adresse" htmlFor="address" error={errors.address?.message}>
                <Input id="address" {...form.register("address")} />
              </Field>
              <Field
                label="Contact d'urgence"
                htmlFor="emergencyContactName"
                error={errors.emergencyContactName?.message}
              >
                <Input id="emergencyContactName" {...form.register("emergencyContactName")} />
              </Field>
              <Field
                label="Tél. d'urgence"
                htmlFor="emergencyContactPhone"
                error={errors.emergencyContactPhone?.message}
              >
                <Input id="emergencyContactPhone" {...form.register("emergencyContactPhone")} />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Informations cliniques</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Groupe sanguin" error={errors.bloodGroup?.message}>
                <Controller
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Groupe sanguin">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Assurance" htmlFor="insurance" error={errors.insurance?.message}>
                <Input id="insurance" {...form.register("insurance")} />
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
                        {patientStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === "active" ? "Actif" : "Archivé"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Allergies" htmlFor="allergies" error={errors.allergies?.message}>
                <Input id="allergies" {...form.register("allergies")} />
              </Field>
              <Field
                label="Pathologies chroniques"
                htmlFor="chronicConditions"
                error={errors.chronicConditions?.message}
                className="sm:col-span-2"
              >
                <Input id="chronicConditions" {...form.register("chronicConditions")} />
              </Field>
              <Field
                label="Antécédents médicaux"
                htmlFor="medicalHistory"
                error={errors.medicalHistory?.message}
                className="sm:col-span-2"
              >
                <Textarea id="medicalHistory" rows={3} {...form.register("medicalHistory")} />
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : patient ? "Enregistrer" : "Créer le patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
