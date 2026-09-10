import type { StatusTone } from "@/shared/components/feedback/status-badge";
import type { AppointmentStatus } from "./types";

export const appointmentStatusTone: Record<AppointmentStatus, StatusTone> = {
  scheduled: "info",
  confirmed: "primary",
  completed: "success",
  cancelled: "danger",
  no_show: "warning",
};
