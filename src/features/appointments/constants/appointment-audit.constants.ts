import type {
  AppointmentAuditAction,
  AppointmentAuditFilters,
} from "@/features/appointments/types/appointment-audit.types"

export const APPOINTMENT_AUDIT_ACTION_LABELS: Record<
  AppointmentAuditAction,
  string
> = {
  created: "Created",
  updated: "Updated",
  rescheduled: "Rescheduled",
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  queued: "Sent to queue",
  "consultation-started":
    "Consultation started",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
}

export const DEFAULT_APPOINTMENT_AUDIT_FILTERS: AppointmentAuditFilters =
  {
    search: "",
    action: "all",
  }

export const APPOINTMENT_AUDIT_INITIAL_VISIBLE_EVENTS =
  12
