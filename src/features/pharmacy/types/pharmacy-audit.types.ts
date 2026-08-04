export const PHARMACY_AUDIT_EVENT_CATEGORIES = [
  "prescription",
  "safety-review",
  "dispensing",
  "verification",
  "counseling",
  "release",
] as const

export type PharmacyAuditEventCategory =
  (typeof PHARMACY_AUDIT_EVENT_CATEGORIES)[number]

export const PHARMACY_AUDIT_EVENT_ACTIONS = [
  "created",
  "allergy-reviewed",
  "interaction-reviewed",
  "dispensed",
  "pharmacist-verified",
  "counseling-completed",
  "released",
  "cancelled",
] as const

export type PharmacyAuditEventAction =
  (typeof PHARMACY_AUDIT_EVENT_ACTIONS)[number]

export interface PharmacyAuditEventDetail {
  label: string
  value: string
  sensitive?: boolean
}

export interface PharmacyAuditEvent {
  id: string

  prescriptionId: string
  patientId: string

  occurredAt: string

  category:
    PharmacyAuditEventCategory

  action:
    PharmacyAuditEventAction

  title: string
  summary: string

  actor: string | null
  reference: string | null

  details:
    PharmacyAuditEventDetail[]
}

export interface PharmacyAuditFilters {
  search: string

  category:
    | PharmacyAuditEventCategory
    | "all"

  action:
    | PharmacyAuditEventAction
    | "all"
}
