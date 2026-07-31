import {
  CONSULTATION_AUDIT_ACTION_LABELS,
  CONSULTATION_AUDIT_CATEGORY_LABELS,
} from "@/features/consultations/constants/consultation-audit.constants"
import type {
  ConsultationAuditEventAction,
  ConsultationAuditEventCategory,
} from "@/features/consultations/types/consultation-audit.types"
import { cn } from "@/lib/utils"

const categoryStyles: Record<
  ConsultationAuditEventCategory,
  string
> = {
  encounter:
    "border-teal-200 bg-teal-50 text-teal-700",

  soap:
    "border-violet-200 bg-violet-50 text-violet-700",

  diagnosis:
    "border-rose-200 bg-rose-50 text-rose-700",

  prescription:
    "border-sky-200 bg-sky-50 text-sky-700",

  "follow-up":
    "border-amber-200 bg-amber-50 text-amber-700",

  signature:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
}

const actionStyles: Record<
  ConsultationAuditEventAction,
  string
> = {
  created:
    "border-slate-200 bg-slate-50 text-slate-600",

  "checked-in":
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  started:
    "border-sky-200 bg-sky-50 text-sky-700",

  recorded:
    "border-blue-200 bg-blue-50 text-blue-700",

  saved:
    "border-amber-200 bg-amber-50 text-amber-700",

  updated:
    "border-violet-200 bg-violet-50 text-violet-700",

  activated:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  archived:
    "border-slate-200 bg-slate-100 text-slate-600",

  finalized:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  cancelled:
    "border-rose-200 bg-rose-50 text-rose-700",

  "no-show":
    "border-red-200 bg-red-50 text-red-700",
}

interface ConsultationAuditCategoryBadgeProps {
  category: ConsultationAuditEventCategory
}

export function ConsultationAuditCategoryBadge({
  category,
}: ConsultationAuditCategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        categoryStyles[category]
      )}
    >
      {
        CONSULTATION_AUDIT_CATEGORY_LABELS[
          category
        ]
      }
    </span>
  )
}

interface ConsultationAuditActionBadgeProps {
  action: ConsultationAuditEventAction
}

export function ConsultationAuditActionBadge({
  action,
}: ConsultationAuditActionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        actionStyles[action]
      )}
    >
      {
        CONSULTATION_AUDIT_ACTION_LABELS[
          action
        ]
      }
    </span>
  )
}
