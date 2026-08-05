import type {
  BillingAuditEventAction,
  BillingAuditEventCategory,
  BillingAuditFilters,
} from "@/features/billing/types/billing-audit.types"

export const BILLING_AUDIT_CATEGORY_LABELS: Record<
  BillingAuditEventCategory,
  string
> = {
  statement:
    "Billing Statement",

  charge:
    "Patient Charge",

  adjustment:
    "Adjustment / Discount",

  coverage:
    "Coverage Allocation",

  payment:
    "Payment / Receipt",

  refund:
    "Refund",
}

export const BILLING_AUDIT_ACTION_LABELS: Record<
  BillingAuditEventAction,
  string
> = {
  created:
    "Statement Created",

  "charge-posted":
    "Charge Posted",

  issued:
    "Statement Issued",

  "adjustment-posted":
    "Adjustment Posted",

  "adjustment-reversed":
    "Adjustment Reversed",

  "coverage-allocated":
    "Coverage Allocated",

  "coverage-reversed":
    "Coverage Reversed",

  "payment-posted":
    "Payment Posted",

  "payment-reversed":
    "Payment Reversed",

  "refund-posted":
    "Refund Posted",

  "refund-reversed":
    "Refund Reversed",

  closed:
    "Statement Settled",

  voided:
    "Statement Voided",
}

export const DEFAULT_BILLING_AUDIT_FILTERS: BillingAuditFilters =
  {
    search: "",
    category: "all",
    action: "all",
  }

export const BILLING_AUDIT_INITIAL_VISIBLE_EVENTS =
  15
