import {
  BILLING_AUDIT_ACTION_LABELS,
  BILLING_AUDIT_CATEGORY_LABELS,
} from "@/features/billing/constants/billing-audit.constants"
import type {
  BillingAuditEventAction,
  BillingAuditEventCategory,
} from "@/features/billing/types/billing-audit.types"
import { cn } from "@/lib/utils"

const categoryStyles: Record<
  BillingAuditEventCategory,
  string
> = {
  statement:
    "border-slate-200 bg-slate-50 text-slate-700",

  charge:
    "border-sky-200 bg-sky-50 text-sky-700",

  adjustment:
    "border-amber-200 bg-amber-50 text-amber-700",

  coverage:
    "border-violet-200 bg-violet-50 text-violet-700",

  payment:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  refund:
    "border-indigo-200 bg-indigo-50 text-indigo-700",
}

const actionStyles: Record<
  BillingAuditEventAction,
  string
> = {
  created:
    "border-slate-200 bg-slate-50 text-slate-700",

  "charge-posted":
    "border-sky-200 bg-sky-50 text-sky-700",

  issued:
    "border-sky-200 bg-sky-50 text-sky-700",

  "adjustment-posted":
    "border-amber-200 bg-amber-50 text-amber-700",

  "adjustment-reversed":
    "border-rose-200 bg-rose-50 text-rose-700",

  "coverage-allocated":
    "border-violet-200 bg-violet-50 text-violet-700",

  "coverage-reversed":
    "border-rose-200 bg-rose-50 text-rose-700",

  "payment-posted":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "payment-reversed":
    "border-rose-200 bg-rose-50 text-rose-700",

  "refund-posted":
    "border-indigo-200 bg-indigo-50 text-indigo-700",

  "refund-reversed":
    "border-rose-200 bg-rose-50 text-rose-700",

  closed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  voided:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

export function BillingAuditCategoryBadge({
  category,
}: {
  category:
    BillingAuditEventCategory
}) {
  return (
    <span
      className={cn(
        baseClassName,
        categoryStyles[category]
      )}
    >
      {
        BILLING_AUDIT_CATEGORY_LABELS[
          category
        ]
      }
    </span>
  )
}

export function BillingAuditActionBadge({
  action,
}: {
  action:
    BillingAuditEventAction
}) {
  return (
    <span
      className={cn(
        baseClassName,
        actionStyles[action]
      )}
    >
      {
        BILLING_AUDIT_ACTION_LABELS[
          action
        ]
      }
    </span>
  )
}
