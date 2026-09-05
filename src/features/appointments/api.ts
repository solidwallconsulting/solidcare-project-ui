import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { appointmentSeed } from "./mock-data";
import type { Appointment, AppointmentListQuery } from "./types";

export const appointmentsRepository = new MockRepository<Appointment>(appointmentSeed, "apt", [
  "reason",
  "room",
  "type",
]);

export const appointmentsApi = createResourceApi<Appointment, AppointmentListQuery>(
  "/appointments",
  appointmentsRepository,
  {
    filter: (appointment, query) => {
      const statusOk = !query.status || query.status === "all" || appointment.status === query.status;
      const doctorOk =
        !query.doctorId || query.doctorId === "all" || appointment.doctorId === query.doctorId;
      const patientOk = !query.patientId || appointment.patientId === query.patientId;
      const dateOk = !query.date || appointment.startsAt.slice(0, 10) === query.date;
      return statusOk && doctorOk && patientOk && dateOk;
    },
  },
);

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (query: AppointmentListQuery) => ["appointments", "list", query] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
};
