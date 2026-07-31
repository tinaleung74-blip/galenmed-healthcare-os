import {
  CONSULTATION_DIAGNOSIS_RECORD_STATUS_LABELS,
  CONSULTATION_DIAGNOSIS_ROLE_LABELS,
  CONSULTATION_DIAGNOSIS_VERIFICATION_LABELS,
} from "@/features/consultations/constants/consultation-diagnosis.constants"
import type {
  ConsultationDiagnosisRecordStatus,
  ConsultationDiagnosisRole,
  ConsultationDiagnosisVerificationStatus,
} from "@/features/consultations/types/consultation-diagnosis.types"
import { cn } from "@/lib/utils"

const roleStyles: Record<
  ConsultationDiagnosisRole,
  string
> = {
  primary:
    "border-rose-200 bg-rose-50 text-rose-700",

  secondary:
    "border-sky-200 bg-sky-50 text-sky-700",

  differential:
    "border-violet-200 bg-violet-50 text-violet-700",
}

const verificationStyles: Record<
  ConsultationDiagnosisVerificationStatus,
  string
> = {
  provisional:
    "border-amber-200 bg-amber-50 text-amber-700",

  confirmed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  refuted:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const recordStatusStyles: Record<
  ConsultationDiagnosisRecordStatus,
  string
> = {
  current:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
}

interface DiagnosisRoleBadgeProps {
  role: ConsultationDiagnosisRole
}

export function DiagnosisRoleBadge({
  role,
}: DiagnosisRoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        roleStyles[role]
      )}
    >
      {
        CONSULTATION_DIAGNOSIS_ROLE_LABELS[
          role
        ]
      }
    </span>
  )
}

interface DiagnosisVerificationBadgeProps {
  status:
    ConsultationDiagnosisVerificationStatus
}

export function DiagnosisVerificationBadge({
  status,
}: DiagnosisVerificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        verificationStyles[status]
      )}
    >
      {
        CONSULTATION_DIAGNOSIS_VERIFICATION_LABELS[
          status
        ]
      }
    </span>
  )
}

interface DiagnosisRecordStatusBadgeProps {
  status:
    ConsultationDiagnosisRecordStatus
}

export function DiagnosisRecordStatusBadge({
  status,
}: DiagnosisRecordStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        recordStatusStyles[status]
      )}
    >
      {
        CONSULTATION_DIAGNOSIS_RECORD_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
