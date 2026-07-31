import {
  CONSULTATION_PRIORITY_LABELS,
  CONSULTATION_STATUS_LABELS,
} from "@/features/consultations/constants/consultation.constants"
import type {
  ConsultationPriority,
  ConsultationStatus,
} from "@/features/consultations/types/consultation.types"
import { cn } from "@/lib/utils"

const consultationStatusStyles: Record<
  ConsultationStatus,
  string
> = {
  waiting:
    "border-amber-200 bg-amber-50 text-amber-700",
  "in-progress":
    "border-sky-200 bg-sky-50 text-sky-700",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",
  "no-show":
    "border-rose-200 bg-rose-50 text-rose-700",
}

const consultationPriorityStyles: Record<
  ConsultationPriority,
  string
> = {
  routine:
    "border-slate-200 bg-slate-50 text-slate-600",
  urgent:
    "border-rose-200 bg-rose-50 text-rose-700",
}

interface ConsultationStatusBadgeProps {
  status: ConsultationStatus
}

export function ConsultationStatusBadge({
  status,
}: ConsultationStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        consultationStatusStyles[status]
      )}
    >
      {CONSULTATION_STATUS_LABELS[status]}
    </span>
  )
}

interface ConsultationPriorityBadgeProps {
  priority: ConsultationPriority
}

export function ConsultationPriorityBadge({
  priority,
}: ConsultationPriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        consultationPriorityStyles[priority]
      )}
    >
      {CONSULTATION_PRIORITY_LABELS[priority]}
    </span>
  )
}
