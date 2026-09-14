import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/features/patients/api";
import { appointmentsApi } from "@/features/appointments/api";
import { consultationsApi } from "@/features/consultations/api";
import { paymentsApi } from "@/features/payments/api";
import { doctorsApi } from "@/features/doctors/api";
import { roomsApi } from "@/features/rooms/api";
import { bedsApi } from "@/features/wards/api";
import { hospitalizationsApi } from "@/features/hospitalizations/api";
import { alertsApi } from "@/features/alerts/api";
import { shiftsApi } from "@/features/planning/api";
import type { Patient } from "@/features/patients/types";
import type { Appointment } from "@/features/appointments/types";
import type { Consultation } from "@/features/consultations/types";
import type { Payment } from "@/features/payments/types";
import type { Doctor } from "@/features/doctors/types";
import type { Room } from "@/features/rooms/types";
import type { Bed } from "@/features/wards/types";
import type { Hospitalization } from "@/features/hospitalizations/types";
import type { ClinicAlert } from "@/features/alerts/types";
import type { ShiftAssignment } from "@/features/planning/types";

export interface DashboardData {
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  payments: Payment[];
  doctors: Doctor[];
  rooms: Room[];
  beds: Bed[];
  hospitalizations: Hospitalization[];
  alerts: ClinicAlert[];
  shifts: ShiftAssignment[];
}

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async (): Promise<DashboardData> => {
      const [
        patients,
        appointments,
        consultations,
        payments,
        doctors,
        rooms,
        beds,
        hospitalizations,
        alerts,
        shifts,
      ] = await Promise.all([
        patientsApi.peekAll(),
        appointmentsApi.peekAll(),
        consultationsApi.peekAll(),
        paymentsApi.peekAll(),
        doctorsApi.peekAll(),
        roomsApi.peekAll(),
        bedsApi.peekAll(),
        hospitalizationsApi.peekAll(),
        alertsApi.peekAll(),
        shiftsApi.peekAll(),
      ]);
      return {
        patients,
        appointments,
        consultations,
        payments,
        doctors,
        rooms,
        beds,
        hospitalizations,
        alerts,
        shifts,
      };
    },
  });
}
