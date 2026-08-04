export const LABORATORY_AUDIT_EVENT_CATEGORIES = [
  "order",
  "specimen",
  "processing",
  "result",
  "verification",
  "release",
] as const

export type LaboratoryAuditEventCategory =
  (typeof LABORATORY_AUDIT_EVENT_CATEGORIES)[number]

export const LABORATORY_AUDIT_EVENT_ACTIONS = [
  "created",
  "collected",
  "received",
  "rejected",
  "processing-started",
  "result-entered",
  "completed",
  "verified",
  "released",
  "cancelled",
] as const

export type LaboratoryAuditEventAction =
  (typeof LABORATORY_AUDIT_EVENT_ACTIONS)[number]

export interface LaboratoryAuditEventDetail {
  label: string
  value: string
  sensitive?: boolean
}

export interface LaboratoryAuditEvent {
  id: string

  orderId: string
  patientId: string

  occurredAt: string

  category:
    LaboratoryAuditEventCategory

  action:
    LaboratoryAuditEventAction

  title: string
  summary: string

  actor: string | null
  reference: string | null

  details:
    LaboratoryAuditEventDetail[]
}

export interface LaboratoryAuditFilters {
  search: string

  category:
    | LaboratoryAuditEventCategory
    | "all"

  action:
    | LaboratoryAuditEventAction
    | "all"
}
