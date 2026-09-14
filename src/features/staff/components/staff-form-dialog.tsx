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
import { useLookups } from "@/shared/hooks/use-lookups";
import {
  staffMemberSchema,
  staffRoles,
  staffRoleLabels,
  staffStatuses,
  staffStatusLabels,
  shiftPreferences,
  shiftPreferenceLabels,
  type StaffFormValues,
  type StaffMember,
} from "../types";

const emptyValues: StaffFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "nurse",
  departmentId: "",
  status: "active",
  shiftPreference: "",
};

export function StaffFormDialog({
  open,
  onOpenChange,
  member,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: StaffMember | undefined;
  onSubmit: (values: StaffFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const { departmentOptions } = useLookups();
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffMemberSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      member
        ? {
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            phone: member.phone,
            role: member.role,
            departmentId: member.departmentId,
            status: member.status,
            shiftPreference: member.shiftPreference ?? "",
          }
        : emptyValues,
    );
  }, [open, member, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {member ? "Modifier le personnel" : "Nouveau personnel soignant"}
          </DialogTitle>
          <DialogDescription>
            Fiche interne : rôle, département et préférence de vacation.
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
            <Field label="Prénom" htmlFor="staff-firstName" error={errors.firstName?.message}>
              <Input id="staff-firstName" {...form.register("firstName")} />
            </Field>
            <Field label="Nom" htmlFor="staff-lastName" error={errors.lastName?.message}>
              <Input id="staff-lastName" {...form.register("lastName")} />
            </Field>
            <Field label="Email" htmlFor="staff-email" error={errors.email?.message}>
              <Input id="staff-email" type="email" {...form.register("email")} />
            </Field>
            <Field label="Téléphone" htmlFor="staff-phone" error={errors.phone?.message}>
              <Input id="staff-phone" inputMode="tel" {...form.register("phone")} />
            </Field>

            <Field label="Rôle" error={errors.role?.message}>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Rôle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {staffRoleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Département" error={errors.departmentId?.message}>
              <Controller
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <Select
                    {...(field.value ? { value: field.value } : {})}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger aria-label="Département">
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
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
                      {staffStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {staffStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Vacation préférée" error={errors.shiftPreference?.message}>
              <Controller
                control={form.control}
                name="shiftPreference"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger aria-label="Vacation préférée">
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {shiftPreferences.map((shift) => (
                        <SelectItem key={shift} value={shift}>
                          {shiftPreferenceLabels[shift]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : member ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
