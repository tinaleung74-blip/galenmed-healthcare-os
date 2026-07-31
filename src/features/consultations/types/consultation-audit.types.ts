export const CONSULTATION_AUDIT_EVENT_CATEGORIES = [
  "encounter",
  "soap",
  "diagnosis",
  "prescription",
  "follow-up",
  "signature",
] as const

export type ConsultationAuditEventCategory =
  (typeof CONSULTATION_AUDIT_EVENT_CATEGORIES)[number]

export const CONSULTATION_AUDIT_EVENT_ACTIONS = [
  "created",
  "checked-in",
  "started",
  "recorded",
  "saved",
  "updated",
  "activated",
  "archived",
  "finalized",
  "completed",
  "cancelled",
  "no-show",
] as const

export type ConsultationAuditEventAction =
  (typeof CONSULTATION_AUDIT_EVENT_ACTIONS)[number]

export interface ConsultationAuditEventDetail {
  label: string
  value: string
  sensitive?: boolean
}

export interface ConsultationAuditEvent {
  id: string
  consultationId: string
  patientId: string

  occurredAt: string
  category: ConsultationAuditEventCategory
  action: ConsultationAuditEventAction

  title: string
  summary: string

  actor: string | null
  reference: string | null

  details: ConsultationAuditEventDetail[]
}

export interface ConsultationAuditFilters {
  search: string

  category:
    | ConsultationAuditEventCategory
    | "all"

  action:
    | ConsultationAuditEventAction
    | "all"
}
