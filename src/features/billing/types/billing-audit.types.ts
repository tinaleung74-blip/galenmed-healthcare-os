export const BILLING_AUDIT_EVENT_CATEGORIES = [
  "statement",
  "charge",
  "adjustment",
  "coverage",
  "payment",
  "refund",
] as const

export type BillingAuditEventCategory =
  (typeof BILLING_AUDIT_EVENT_CATEGORIES)[number]

export const BILLING_AUDIT_EVENT_ACTIONS = [
  "created",
  "charge-posted",
  "issued",
  "adjustment-posted",
  "adjustment-reversed",
  "coverage-allocated",
  "coverage-reversed",
  "payment-posted",
  "payment-reversed",
  "refund-posted",
  "refund-reversed",
  "closed",
  "voided",
] as const

export type BillingAuditEventAction =
  (typeof BILLING_AUDIT_EVENT_ACTIONS)[number]

export interface BillingAuditEventDetail {
  label: string
  value: string
  sensitive?: boolean
}

export interface BillingAuditEvent {
  id: string

  statementId: string
  patientId: string

  occurredAt: string

  category:
    BillingAuditEventCategory

  action:
    BillingAuditEventAction

  title: string
  summary: string

  actor: string | null
  reference: string | null

  details:
    BillingAuditEventDetail[]
}

export interface BillingAuditFilters {
  search: string

  category:
    | BillingAuditEventCategory
    | "all"

  action:
    | BillingAuditEventAction
    | "all"
}
