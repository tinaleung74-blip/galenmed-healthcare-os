import {
  RADIOLOGY_FINDING_LEVEL_LABELS,
  RADIOLOGY_REPORT_STATUS_LABELS,
} from "@/features/radiology/constants/radiology-report.constants"
import type {
  RadiologyFindingLevel,
  RadiologyReportStatus,
} from "@/features/radiology/types/radiology-report.types"
import { cn } from "@/lib/utils"

const reportStatusStyles: Record<
  RadiologyReportStatus,
  string
> = {
  draft:
    "border-amber-200 bg-amber-50 text-amber-700",

  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  released:
    "border-teal-200 bg-teal-50 text-teal-700",
}

const findingLevelStyles: Record<
  RadiologyFindingLevel,
  string
> = {
  routine:
    "border-slate-200 bg-slate-50 text-slate-700",

  significant:
    "border-amber-200 bg-amber-50 text-amber-700",

  critical:
    "border-rose-300 bg-rose-100 text-rose-800",
}

export function RadiologyReportStatusBadge({
  status,
}: {
  status: RadiologyReportStatus
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        reportStatusStyles[status]
      )}
    >
      {
        RADIOLOGY_REPORT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function RadiologyFindingLevelBadge({
  findingLevel,
}: {
  findingLevel: RadiologyFindingLevel
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        findingLevelStyles[findingLevel]
      )}
    >
      {
        RADIOLOGY_FINDING_LEVEL_LABELS[
          findingLevel
        ]
      }
    </span>
  )
}
