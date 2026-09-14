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
  appRoles,
  roleLabels,
  staffUserSchema,
  userStatuses,
  userStatusLabels,
  type StaffUser,
  type StaffUserFormValues,
} from "../types/user";

const emptyValues: StaffUserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "receptionist",
  status: "invited",
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: StaffUser | undefined;
  onSubmit: (values: StaffUserFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const form = useForm<StaffUserFormValues>({
    resolver: zodResolver(staffUserSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
          }
        : emptyValues,
    );
  }, [open, user, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
          <DialogDescription>Compte staff interne SolidCare (données démo).</DialogDescription>
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
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...form.register("email")} />
            </Field>
            <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" inputMode="tel" {...form.register("phone")} />
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
                      {appRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
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
                      {userStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {userStatusLabels[status]}
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
              {isSaving ? "Enregistrement…" : user ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
