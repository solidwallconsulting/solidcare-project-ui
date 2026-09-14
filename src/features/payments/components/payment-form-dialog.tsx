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
  paymentSchema,
  paymentMethods,
  paymentMethodLabels,
  paymentStatuses,
  paymentStatusLabels,
  type Payment,
  type PaymentFormValues,
} from "../types";

const emptyValues: PaymentFormValues = {
  patientId: "",
  doctorId: "",
  appointmentId: "",
  amount: 60,
  method: "cash",
  status: "paid",
  paidAt: "",
  notes: "",
};

export function PaymentFormDialog({
  open,
  onOpenChange,
  payment,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | undefined;
  onSubmit: (values: PaymentFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const { patientOptions, doctorOptions } = useLookups();
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      payment
        ? {
            patientId: payment.patientId,
            doctorId: payment.doctorId,
            appointmentId: payment.appointmentId,
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            paidAt: payment.paidAt.slice(0, 10),
            notes: payment.notes,
          }
        : emptyValues,
    );
  }, [open, payment, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{payment ? "Modifier le paiement" : "Nouveau paiement"}</DialogTitle>
          <DialogDescription>Enregistrement d'un règlement patient (données démo).</DialogDescription>
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

            <Field label="Montant (TND)" htmlFor="amount" error={errors.amount?.message}>
              <Input id="amount" type="number" min={1} step="0.01" {...form.register("amount")} />
            </Field>

            <Field label="Date" htmlFor="paidAt" error={errors.paidAt?.message}>
              <Input id="paidAt" type="date" {...form.register("paidAt")} />
            </Field>

            <Field label="Méthode" error={errors.method?.message}>
              <Controller
                control={form.control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Méthode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {paymentMethodLabels[method]}
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
                      {paymentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {paymentStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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

          <input type="hidden" {...form.register("appointmentId")} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : payment ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
