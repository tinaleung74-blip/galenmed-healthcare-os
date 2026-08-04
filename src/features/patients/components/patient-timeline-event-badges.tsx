import {
  PATIENT_TIMELINE_ACTION_LABELS,
  PATIENT_TIMELINE_CATEGORY_LABELS,
} from "@/features/patients/constants/patient-timeline.constants"
import type {
  PatientTimelineEventAction,
  PatientTimelineEventCategory,
} from "@/features/patients/types/patient-timeline.types"
import { cn } from "@/lib/utils"

const categoryStyles: Record<
  PatientTimelineEventCategory,
  string
> = {
  patient:
    "border-teal-200 bg-teal-50 text-teal-700",
  "medical-history":
    "border-violet-200 bg-violet-50 text-violet-700",
  "vital-signs":
    "border-sky-200 bg-sky-50 text-sky-700",
  allergy:
    "border-rose-200 bg-rose-50 text-rose-700",
  insurance:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
  document:
    "border-amber-200 bg-amber-50 text-amber-700",

  laboratory:
    "border-teal-200 bg-teal-50 text-teal-700",
}

const actionStyles: Record<
  PatientTimelineEventAction,
  string
> = {
  registered:
    "border-teal-200 bg-teal-50 text-teal-700",
  recorded:
    "border-blue-200 bg-blue-50 text-blue-700",
  measured:
    "border-sky-200 bg-sky-50 text-sky-700",
  uploaded:
    "border-violet-200 bg-violet-50 text-violet-700",
  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  updated:
    "border-amber-200 bg-amber-50 text-amber-700",
  archived:
    "border-slate-200 bg-slate-100 text-slate-600",

  released:
    "border-teal-200 bg-teal-50 text-teal-700",
}

interface PatientTimelineCategoryBadgeProps {
  category: PatientTimelineEventCategory
}

export function PatientTimelineCategoryBadge({
  category,
}: PatientTimelineCategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        categoryStyles[category]
      )}
    >
      {PATIENT_TIMELINE_CATEGORY_LABELS[category]}
    </span>
  )
}

interface PatientTimelineActionBadgeProps {
  action: PatientTimelineEventAction
}

export function PatientTimelineActionBadge({
  action,
}: PatientTimelineActionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        actionStyles[action]
      )}
    >
      {PATIENT_TIMELINE_ACTION_LABELS[action]}
    </span>
  )
}
