import {
  RADIOLOGY_AUDIT_ACTION_LABELS,
  RADIOLOGY_AUDIT_CATEGORY_LABELS,
} from "@/features/radiology/constants/radiology-audit.constants"
import type {
  RadiologyAuditEventAction,
  RadiologyAuditEventCategory,
} from "@/features/radiology/types/radiology-audit.types"
import { cn } from "@/lib/utils"

const categoryStyles: Record<
  RadiologyAuditEventCategory,
  string
> = {
  order:
    "border-slate-200 bg-slate-50 text-slate-700",

  preparation:
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  imaging:
    "border-violet-200 bg-violet-50 text-violet-700",

  report:
    "border-amber-200 bg-amber-50 text-amber-700",

  verification:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  release:
    "border-teal-200 bg-teal-50 text-teal-700",
}

const actionStyles: Record<
  RadiologyAuditEventAction,
  string
> = {
  created:
    "border-slate-200 bg-slate-50 text-slate-600",

  prepared:
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  "checked-in":
    "border-amber-200 bg-amber-50 text-amber-700",

  ready:
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  "imaging-started":
    "border-violet-200 bg-violet-50 text-violet-700",

  "images-acquired":
    "border-indigo-200 bg-indigo-50 text-indigo-700",

  "technically-completed":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "report-drafted":
    "border-amber-200 bg-amber-50 text-amber-700",

  "critical-communicated":
    "border-rose-300 bg-rose-100 text-rose-800",

  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  released:
    "border-teal-200 bg-teal-50 text-teal-700",

  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",

  "no-show":
    "border-rose-200 bg-rose-50 text-rose-700",
}

export function RadiologyAuditCategoryBadge({
  category,
}: {
  category:
    RadiologyAuditEventCategory
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        categoryStyles[category]
      )}
    >
      {
        RADIOLOGY_AUDIT_CATEGORY_LABELS[
          category
        ]
      }
    </span>
  )
}

export function RadiologyAuditActionBadge({
  action,
}: {
  action:
    RadiologyAuditEventAction
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        actionStyles[action]
      )}
    >
      {
        RADIOLOGY_AUDIT_ACTION_LABELS[
          action
        ]
      }
    </span>
  )
}
