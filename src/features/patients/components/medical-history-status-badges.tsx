import {
  MEDICAL_CONDITION_STATUS_LABELS,
  MEDICAL_HISTORY_RECORD_STATUS_LABELS,
  MEDICAL_HISTORY_VERIFICATION_LABELS,
} from "@/features/patients/constants/medical-history.constants"
import type {
  MedicalConditionClinicalStatus,
  MedicalHistoryRecordStatus,
  MedicalHistoryVerificationStatus,
} from "@/features/patients/types/medical-history.types"
import { cn } from "@/lib/utils"

const clinicalStatusStyles: Record<
  MedicalConditionClinicalStatus,
  string
> = {
  active:
    "border-rose-200 bg-rose-50 text-rose-700",
  inactive:
    "border-amber-200 bg-amber-50 text-amber-700",
  resolved:
    "border-teal-200 bg-teal-50 text-teal-700",
}

const verificationStatusStyles: Record<
  MedicalHistoryVerificationStatus,
  string
> = {
  confirmed:
    "border-sky-200 bg-sky-50 text-sky-700",
  provisional:
    "border-violet-200 bg-violet-50 text-violet-700",
  "patient-reported":
    "border-slate-200 bg-slate-50 text-slate-700",
}

const recordStatusStyles: Record<
  MedicalHistoryRecordStatus,
  string
> = {
  current:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
}

interface MedicalConditionStatusBadgeProps {
  status: MedicalConditionClinicalStatus
}

export function MedicalConditionStatusBadge({
  status,
}: MedicalConditionStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        clinicalStatusStyles[status]
      )}
    >
      {MEDICAL_CONDITION_STATUS_LABELS[status]}
    </span>
  )
}

interface MedicalHistoryVerificationBadgeProps {
  status: MedicalHistoryVerificationStatus
}

export function MedicalHistoryVerificationBadge({
  status,
}: MedicalHistoryVerificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        verificationStatusStyles[status]
      )}
    >
      {MEDICAL_HISTORY_VERIFICATION_LABELS[status]}
    </span>
  )
}

interface MedicalHistoryRecordStatusBadgeProps {
  status: MedicalHistoryRecordStatus
}

export function MedicalHistoryRecordStatusBadge({
  status,
}: MedicalHistoryRecordStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        recordStatusStyles[status]
      )}
    >
      {MEDICAL_HISTORY_RECORD_STATUS_LABELS[status]}
    </span>
  )
}
