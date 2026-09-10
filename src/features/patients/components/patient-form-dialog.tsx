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
  bloodGroup: "O+",
  insurance: "",
  allergies: "",
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
            bloodGroup: patient.bloodGroup,
            insurance: patient.insurance,
            allergies: patient.allergies,
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
          <DialogTitle>{patient ? "Edit patient" : "New patient"}</DialogTitle>
          <DialogDescription>
            Demo records only. Never enter real patient information.
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
            <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
              <Input id="firstName" {...form.register("firstName")} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
              <Input id="lastName" {...form.register("lastName")} />
            </Field>

            <Field label="Gender" error={errors.gender?.message}>
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender === "female" ? "Female" : "Male"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
              <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
            </Field>

            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" inputMode="tel" {...form.register("phone")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...form.register("email")} />
            </Field>

            <Field label="City" htmlFor="city" error={errors.city?.message}>
              <Input id="city" {...form.register("city")} />
            </Field>
            <Field label="Address" htmlFor="address" error={errors.address?.message}>
              <Input id="address" {...form.register("address")} />
            </Field>

            <Field label="Blood group" error={errors.bloodGroup?.message}>
              <Controller
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Blood group">
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
            <Field label="Insurance" htmlFor="insurance" error={errors.insurance?.message}>
              <Input id="insurance" {...form.register("insurance")} />
            </Field>

            <Field label="Status" error={errors.status?.message}>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {patientStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === "active" ? "Active" : "Archived"}
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : patient ? "Save changes" : "Create patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
