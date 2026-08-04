import {
  PHARMACY_AUDIT_ACTION_LABELS,
  PHARMACY_AUDIT_CATEGORY_LABELS,
} from "@/features/pharmacy/constants/pharmacy-audit.constants"
import type {
  PharmacyAuditEventAction,
  PharmacyAuditEventCategory,
} from "@/features/pharmacy/types/pharmacy-audit.types"
import { cn } from "@/lib/utils"

const categoryStyles: Record<
  PharmacyAuditEventCategory,
  string
> = {
  prescription:
    "border-slate-200 bg-slate-50 text-slate-700",

  "safety-review":
    "border-amber-200 bg-amber-50 text-amber-700",

  dispensing:
    "border-violet-200 bg-violet-50 text-violet-700",

  verification:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  counseling:
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  release:
    "border-teal-200 bg-teal-50 text-teal-700",
}

const actionStyles: Record<
  PharmacyAuditEventAction,
  string
> = {
  created:
    "border-slate-200 bg-slate-50 text-slate-600",

  "allergy-reviewed":
    "border-amber-200 bg-amber-50 text-amber-700",

  "interaction-reviewed":
    "border-amber-200 bg-amber-50 text-amber-700",

  dispensed:
    "border-violet-200 bg-violet-50 text-violet-700",

  "pharmacist-verified":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "counseling-completed":
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  released:
    "border-teal-200 bg-teal-50 text-teal-700",

  cancelled:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

export function PharmacyAuditCategoryBadge({
  category,
}: {
  category:
    PharmacyAuditEventCategory
}) {
  return (
    <span
      className={cn(
        baseClassName,
        categoryStyles[category]
      )}
    >
      {
        PHARMACY_AUDIT_CATEGORY_LABELS[
          category
        ]
      }
    </span>
  )
}

export function PharmacyAuditActionBadge({
  action,
}: {
  action:
    PharmacyAuditEventAction
}) {
  return (
    <span
      className={cn(
        baseClassName,
        actionStyles[action]
      )}
    >
      {
        PHARMACY_AUDIT_ACTION_LABELS[
          action
        ]
      }
    </span>
  )
}
