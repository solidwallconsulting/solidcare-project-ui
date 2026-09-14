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
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/shared/components/forms/field";
import { useLookups } from "@/shared/hooks/use-lookups";
import {
  departmentSchema,
  departmentStatuses,
  departmentStatusLabels,
  type Department,
  type DepartmentFormValues,
} from "../types";

const emptyValues: DepartmentFormValues = {
  name: "",
  code: "",
  description: "",
  headDoctorId: "",
  teamLeaderId: "",
  doctorIds: [],
  status: "active",
  floor: "",
  phone: "",
};

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | undefined;
  onSubmit: (values: DepartmentFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const { doctorOptions } = useLookups();
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;
  const doctorIds = form.watch("doctorIds");

  useEffect(() => {
    if (!open) return;
    form.reset(
      department
        ? {
            name: department.name,
            code: department.code,
            description: department.description,
            headDoctorId: department.headDoctorId,
            teamLeaderId: department.teamLeaderId,
            doctorIds: department.doctorIds,
            status: department.status,
            floor: department.floor,
            phone: department.phone,
          }
        : emptyValues,
    );
  }, [open, department, form]);

  const toggleDoctor = (id: string, checked: boolean) => {
    const current = form.getValues("doctorIds");
    form.setValue(
      "doctorIds",
      checked ? [...current, id] : current.filter((item) => item !== id),
      { shouldValidate: true },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {department ? "Modifier le département" : "Nouveau département"}
          </DialogTitle>
          <DialogDescription>
            Organisez les équipes : chef de département, chef d&apos;équipe et médecins assignés.
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
              <Input id="code" placeholder="CARDIO" {...form.register("code")} />
            </Field>

            <Field label="Étage" htmlFor="floor" error={errors.floor?.message}>
              <Input id="floor" {...form.register("floor")} />
            </Field>
            <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" inputMode="tel" {...form.register("phone")} />
            </Field>

            <Field label="Chef de département" error={errors.headDoctorId?.message}>
              <Controller
                control={form.control}
                name="headDoctorId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Chef de département">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorOptions.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Chef d'équipe" error={errors.teamLeaderId?.message}>
              <Controller
                control={form.control}
                name="teamLeaderId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Chef d'équipe">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorOptions.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.label}
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
                      {departmentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {departmentStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              error={errors.description?.message}
              className="sm:col-span-2"
            >
              <Textarea id="description" rows={3} {...form.register("description")} />
            </Field>

            <Field
              label="Médecins du département"
              error={errors.doctorIds?.message}
              className="sm:col-span-2"
            >
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                {doctorOptions.map((doctor) => {
                  const checked = doctorIds.includes(doctor.id);
                  return (
                    <label
                      key={doctor.id}
                      className="flex cursor-pointer items-center gap-3 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleDoctor(doctor.id, value === true)}
                      />
                      <span>{doctor.label}</span>
                    </label>
                  );
                })}
              </div>
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : department ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
