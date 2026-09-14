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
import { departmentsApi, departmentKeys } from "@/features/departments/api";
import { roomsApi, roomKeys } from "@/features/rooms/api";
import {
  equipmentCategories,
  equipmentSchema,
  equipmentStatuses,
  equipmentStatusLabels,
  type Equipment,
  type EquipmentFormValues,
} from "../types";

const emptyValues: EquipmentFormValues = {
  name: "",
  reference: "",
  category: "Monitoring",
  departmentId: "",
  roomId: "",
  status: "available",
  serialNumber: "",
  purchaseDate: "",
  lastMaintenanceAt: "",
  nextMaintenanceAt: "",
  notes: "",
};

export function EquipmentFormDialog({
  open,
  onOpenChange,
  equipment,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment | undefined;
  onSubmit: (values: EquipmentFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const departments = useQuery({
    queryKey: departmentKeys.options,
    queryFn: () => departmentsApi.peekAll(),
    staleTime: 30_000,
  });
  const rooms = useQuery({
    queryKey: roomKeys.options,
    queryFn: () => roomsApi.peekAll(),
    staleTime: 30_000,
  });
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;
  const departmentId = form.watch("departmentId");

  const roomOptions = (rooms.data ?? [])
    .filter((room) => !departmentId || room.departmentId === departmentId)
    .map((room) => ({ id: room.id, label: `${room.name} (${room.code})` }));

  useEffect(() => {
    if (!open) return;
    form.reset(
      equipment
        ? {
            name: equipment.name,
            reference: equipment.reference,
            category: equipment.category,
            departmentId: equipment.departmentId,
            roomId: equipment.roomId ?? "",
            status: equipment.status,
            serialNumber: equipment.serialNumber,
            purchaseDate: equipment.purchaseDate,
            lastMaintenanceAt: equipment.lastMaintenanceAt,
            nextMaintenanceAt: equipment.nextMaintenanceAt,
            notes: equipment.notes,
          }
        : emptyValues,
    );
  }, [open, equipment, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {equipment ? "Modifier le matériel" : "Nouveau matériel médical"}
          </DialogTitle>
          <DialogDescription>
            Inventaire clinique : localisation, statut et planning de maintenance.
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
            <Field label="Référence" htmlFor="reference" error={errors.reference?.message}>
              <Input id="reference" {...form.register("reference")} />
            </Field>

            <Field label="Catégorie" error={errors.category?.message}>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Catégorie">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
                      {equipmentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {equipmentStatusLabels[status]}
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
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("roomId", "");
                    }}
                  >
                    <SelectTrigger aria-label="Département">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments.data ?? []).map((dep) => (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Salle (optionnel)" error={errors.roomId?.message}>
              <Controller
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger aria-label="Salle">
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {roomOptions.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="N° de série" htmlFor="serialNumber" error={errors.serialNumber?.message}>
              <Input id="serialNumber" {...form.register("serialNumber")} />
            </Field>
            <Field label="Date d'achat" htmlFor="purchaseDate" error={errors.purchaseDate?.message}>
              <Input id="purchaseDate" type="date" {...form.register("purchaseDate")} />
            </Field>

            <Field
              label="Dernière maintenance"
              htmlFor="lastMaintenanceAt"
              error={errors.lastMaintenanceAt?.message}
            >
              <Input id="lastMaintenanceAt" type="date" {...form.register("lastMaintenanceAt")} />
            </Field>
            <Field
              label="Prochaine maintenance"
              htmlFor="nextMaintenanceAt"
              error={errors.nextMaintenanceAt?.message}
            >
              <Input id="nextMaintenanceAt" type="date" {...form.register("nextMaintenanceAt")} />
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
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : equipment ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
