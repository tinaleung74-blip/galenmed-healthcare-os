import {
  LABORATORY_RESULT_FLAG_LABELS,
  LABORATORY_RESULT_STATUS_LABELS,
} from "@/features/laboratory/constants/laboratory-result.constants"
import type {
  LaboratoryResultFlag,
  LaboratoryResultStatus,
} from "@/features/laboratory/types/laboratory-result.types"
import { cn } from "@/lib/utils"

const resultStatusStyles: Record<
  LaboratoryResultStatus,
  string
> = {
  draft:
    "border-amber-200 bg-amber-50 text-amber-700",

  completed:
    "border-violet-200 bg-violet-50 text-violet-700",

  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  released:
    "border-teal-200 bg-teal-50 text-teal-700",
}

const resultFlagStyles: Record<
  LaboratoryResultFlag,
  string
> = {
  normal:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  low:
    "border-amber-200 bg-amber-50 text-amber-700",

  high:
    "border-amber-200 bg-amber-50 text-amber-700",

  "critical-low":
    "border-rose-300 bg-rose-100 text-rose-800",

  "critical-high":
    "border-rose-300 bg-rose-100 text-rose-800",

  abnormal:
    "border-rose-200 bg-rose-50 text-rose-700",

  "not-applicable":
    "border-slate-200 bg-slate-50 text-slate-600",
}

export function LaboratoryResultStatusBadge({
  status,
}: {
  status: LaboratoryResultStatus
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        resultStatusStyles[status]
      )}
    >
      {
        LABORATORY_RESULT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function LaboratoryResultFlagBadge({
  flag,
}: {
  flag: LaboratoryResultFlag
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        resultFlagStyles[flag]
      )}
    >
      {
        LABORATORY_RESULT_FLAG_LABELS[
          flag
        ]
      }
    </span>
  )
}
