export const RADIOLOGY_AUDIT_EVENT_CATEGORIES = [
  "order",
  "preparation",
  "imaging",
  "report",
  "verification",
  "release",
] as const

export type RadiologyAuditEventCategory =
  (typeof RADIOLOGY_AUDIT_EVENT_CATEGORIES)[number]

export const RADIOLOGY_AUDIT_EVENT_ACTIONS = [
  "created",
  "prepared",
  "checked-in",
  "ready",
  "imaging-started",
  "images-acquired",
  "technically-completed",
  "report-drafted",
  "critical-communicated",
  "verified",
  "released",
  "cancelled",
  "no-show",
] as const

export type RadiologyAuditEventAction =
  (typeof RADIOLOGY_AUDIT_EVENT_ACTIONS)[number]

export interface RadiologyAuditEventDetail {
  label: string
  value: string
  sensitive?: boolean
}

export interface RadiologyAuditEvent {
  id: string

  orderId: string
  patientId: string

  occurredAt: string

  category:
    RadiologyAuditEventCategory

  action:
    RadiologyAuditEventAction

  title: string
  summary: string

  actor: string | null
  reference: string | null

  details:
    RadiologyAuditEventDetail[]
}

export interface RadiologyAuditFilters {
  search: string

  category:
    | RadiologyAuditEventCategory
    | "all"

  action:
    | RadiologyAuditEventAction
    | "all"
}
