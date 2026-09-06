import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const paymentMethods = ["cash", "card", "transfer", "insurance"] as const;
export const paymentStatuses = ["paid", "pending", "refunded"] as const;

export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

export interface Payment {
  id: string;
  reference: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  notes: string;
}

export interface PaymentListQuery extends ListQuery {
  status?: PaymentStatus | "all";
  method?: PaymentMethod | "all";
  patientId?: string;
}

export const paymentSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  appointmentId: z.string(),
  amount: z.coerce
    .number({ invalid_type_error: "Enter an amount" })
    .min(1, "Amount must be greater than 0")
    .max(10000, "Amount looks too high"),
  method: z.enum(paymentMethods),
  status: z.enum(paymentStatuses),
  paidAt: z.string().min(1, "Pick a payment date"),
  notes: z.string().max(240, "Notes are too long"),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Bank transfer",
  insurance: "Insurance",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
};
