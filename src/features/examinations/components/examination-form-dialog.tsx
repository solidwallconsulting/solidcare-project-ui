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
import type { LookupOption } from "@/shared/hooks/use-lookups";
import {
  examPriorities,
  examPriorityLabels,
  examRequestSchema,
  examStatuses,
  examStatusLabels,
  examTypeLabels,
  examTypes,
  type ExamRequest,
  type ExamRequestFormValues,
} from "../types";

const emptyValues: ExamRequestFormValues = {
  patientId: "",
  doctorId: "",
  consultationId: "",
  examType: "lab",
  title: "",
  reason: "",
  priority: "normal",
  status: "requested",
  requestedAt: "",
  scheduledAt: "",
  resultNotes: "",
  resultAvailableAt: "",
};

export function ExaminationFormDialog({
  open,
  onOpenChange,
  exam,
  patientOptions,
  doctorOptions,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: ExamRequest | undefined;
  patientOptions: LookupOption[];
  doctorOptions: LookupOption[];
  onSubmit: (values: ExamRequestFormValues) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const form = useForm<ExamRequestFormValues>({
    resolver: zodResolver(examRequestSchema),
    defaultValues: emptyValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      exam
        ? {
            patientId: exam.patientId,
            doctorId: exam.doctorId,
            consultationId: exam.consultationId,
            examType: exam.examType,
            title: exam.title,
            reason: exam.reason,
            priority: exam.priority,
            status: exam.status,
            requestedAt: exam.requestedAt.slice(0, 10),
            scheduledAt: exam.scheduledAt.slice(0, 10),
            resultNotes: exam.resultNotes,
            resultAvailableAt: exam.resultAvailableAt.slice(0, 10),
          }
        : {
            ...emptyValues,
            requestedAt: new Date().toISOString().slice(0, 10),
          },
    );
  }, [open, exam, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{exam ? "Modifier l'examen" : "Demande d'examen"}</DialogTitle>
          <DialogDescription>
            Analyses, imagerie et suivi des résultats.
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
            <Field label="Patient" error={errors.patientId?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Patient">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
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
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Type" error={errors.examType?.message}>
              <Controller
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Type d'examen">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {examTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Titre" htmlFor="exam-title" error={errors.title?.message} className="sm:col-span-2">
              <Input id="exam-title" {...form.register("title")} />
            </Field>

            <Field label="Motif" htmlFor="exam-reason" error={errors.reason?.message} className="sm:col-span-2">
              <Input id="exam-reason" {...form.register("reason")} />
            </Field>

            <Field label="Priorité" error={errors.priority?.message}>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Priorité">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examPriorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {examPriorityLabels[priority]}
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
                      {examStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {examStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Demandé le" htmlFor="requestedAt" error={errors.requestedAt?.message}>
              <Input id="requestedAt" type="date" {...form.register("requestedAt")} />
            </Field>

            <Field label="Planifié le" htmlFor="scheduledAt" error={errors.scheduledAt?.message}>
              <Input id="scheduledAt" type="date" {...form.register("scheduledAt")} />
            </Field>

            <Field
              label="Résultats disponibles"
              htmlFor="resultAvailableAt"
              error={errors.resultAvailableAt?.message}
            >
              <Input id="resultAvailableAt" type="date" {...form.register("resultAvailableAt")} />
            </Field>

            <Field
              label="Notes de résultat"
              htmlFor="resultNotes"
              error={errors.resultNotes?.message}
              className="sm:col-span-2"
            >
              <Textarea id="resultNotes" rows={3} {...form.register("resultNotes")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : exam ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
