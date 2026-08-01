export const APPOINTMENT_AUDIT_ACTIONS = [
  "created",
  "updated",
  "rescheduled",
  "confirmed",
  "checked-in",
  "queued",
  "consultation-started",
  "completed",
  "cancelled",
  "no-show",
] as const

export type AppointmentAuditAction =
  (typeof APPOINTMENT_AUDIT_ACTIONS)[number]

export interface AppointmentAuditEventDetail {
  label: string
  value: string
  sensitive?: boolean
}

export interface AppointmentAuditEvent {
  id: string

  appointmentId: string
  patientId: string

  occurredAt: string
  action: AppointmentAuditAction

  title: string
  summary: string

  actor: string | null
  reference: string | null

  details: AppointmentAuditEventDetail[]
}

export interface AppointmentAuditFilters {
  search: string

  action:
    | AppointmentAuditAction
    | "all"
}
