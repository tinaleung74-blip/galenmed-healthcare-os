import {
  VITAL_SIGN_INTERPRETATION_LABELS,
  VITAL_SIGNS_RECORD_STATUS_LABELS,
} from "@/features/patients/constants/vital-signs.constants"
import type {
  VitalSignInterpretation,
  VitalSignsRecordStatus,
} from "@/features/patients/types/vital-signs.types"
import { cn } from "@/lib/utils"

const recordStatusStyles: Record<
  VitalSignsRecordStatus,
  string
> = {
  current:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const interpretationStyles: Record<
  VitalSignInterpretation,
  string
> = {
  "not-evaluated":
    "border-slate-200 bg-slate-50 text-slate-600",
  "within-configured-range":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  low:
    "border-sky-200 bg-sky-50 text-sky-700",
  high:
    "border-amber-200 bg-amber-50 text-amber-700",
  critical:
    "border-rose-200 bg-rose-50 text-rose-700",
}

interface VitalSignsRecordStatusBadgeProps {
  status: VitalSignsRecordStatus
}

export function VitalSignsRecordStatusBadge({
  status,
}: VitalSignsRecordStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        recordStatusStyles[status]
      )}
    >
      {VITAL_SIGNS_RECORD_STATUS_LABELS[status]}
    </span>
  )
}

interface VitalSignInterpretationBadgeProps {
  interpretation: VitalSignInterpretation
}

export function VitalSignInterpretationBadge({
  interpretation,
}: VitalSignInterpretationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        interpretationStyles[interpretation]
      )}
    >
      {VITAL_SIGN_INTERPRETATION_LABELS[interpretation]}
    </span>
  )
}
