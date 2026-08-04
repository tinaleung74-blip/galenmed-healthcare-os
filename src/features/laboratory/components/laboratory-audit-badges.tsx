import {
  LABORATORY_AUDIT_ACTION_LABELS,
  LABORATORY_AUDIT_CATEGORY_LABELS,
} from "@/features/laboratory/constants/laboratory-audit.constants"
import type {
  LaboratoryAuditEventAction,
  LaboratoryAuditEventCategory,
} from "@/features/laboratory/types/laboratory-audit.types"
import { cn } from "@/lib/utils"

const categoryStyles: Record<
  LaboratoryAuditEventCategory,
  string
> = {
  order:
    "border-slate-200 bg-slate-50 text-slate-700",

  specimen:
    "border-amber-200 bg-amber-50 text-amber-700",

  processing:
    "border-sky-200 bg-sky-50 text-sky-700",

  result:
    "border-violet-200 bg-violet-50 text-violet-700",

  verification:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  release:
    "border-teal-200 bg-teal-50 text-teal-700",
}

const actionStyles: Record<
  LaboratoryAuditEventAction,
  string
> = {
  created:
    "border-slate-200 bg-slate-50 text-slate-600",

  collected:
    "border-amber-200 bg-amber-50 text-amber-700",

  received:
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  rejected:
    "border-rose-200 bg-rose-50 text-rose-700",

  "processing-started":
    "border-sky-200 bg-sky-50 text-sky-700",

  "result-entered":
    "border-violet-200 bg-violet-50 text-violet-700",

  completed:
    "border-violet-200 bg-violet-50 text-violet-700",

  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  released:
    "border-teal-200 bg-teal-50 text-teal-700",

  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",
}

export function LaboratoryAuditCategoryBadge({
  category,
}: {
  category:
    LaboratoryAuditEventCategory
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        categoryStyles[category]
      )}
    >
      {
        LABORATORY_AUDIT_CATEGORY_LABELS[
          category
        ]
      }
    </span>
  )
}

export function LaboratoryAuditActionBadge({
  action,
}: {
  action:
    LaboratoryAuditEventAction
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        actionStyles[action]
      )}
    >
      {
        LABORATORY_AUDIT_ACTION_LABELS[
          action
        ]
      }
    </span>
  )
}
