import { z } from "zod";
import type { ListQuery } from "@/shared/api/api-types";

export const hospitalizationStatuses = ["admitted", "transferred", "discharged"] as const;
export type HospitalizationStatus = (typeof hospitalizationStatuses)[number];

export interface Hospitalization {
  id: string;
  reference: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  wardRoomId: string;
  bedId: string;
  reason: string;
  admittedAt: string;
  dischargedAt: string;
  status: HospitalizationStatus;
  notes: string;
}

export interface HospitalizationListQuery extends ListQuery {
  status?: HospitalizationStatus | "all";
  departmentId?: string | "all";
  patientId?: string;
}

export const hospitalizationSchema = z.object({
  patientId: z.string().min(1, "Sélectionnez un patient"),
  doctorId: z.string().min(1, "Sélectionnez un médecin"),
  departmentId: z.string().min(1, "Sélectionnez un département"),
  wardRoomId: z.string().min(1, "Sélectionnez une chambre"),
  bedId: z.string().min(1, "Sélectionnez un lit"),
  reason: z.string().min(3, "Indiquez le motif"),
  admittedAt: z.string().min(1, "Date d'admission requise"),
  dischargedAt: z.string(),
  status: z.enum(hospitalizationStatuses),
  notes: z.string().max(400),
});

export type HospitalizationFormValues = z.infer<typeof hospitalizationSchema>;

export const hospitalizationStatusLabels: Record<HospitalizationStatus, string> = {
  admitted: "Hospitalisé",
  transferred: "Transféré",
  discharged: "Sorti",
};

export const transferSchema = z.object({
  wardRoomId: z.string().min(1, "Sélectionnez une chambre"),
  bedId: z.string().min(1, "Sélectionnez un lit"),
  notes: z.string().max(400),
});

export type TransferFormValues = z.infer<typeof transferSchema>;
