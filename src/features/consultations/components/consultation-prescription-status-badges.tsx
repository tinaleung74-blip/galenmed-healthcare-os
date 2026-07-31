import {
  CONSULTATION_ALLERGY_REVIEW_STATUS_LABELS,
  CONSULTATION_PRESCRIPTION_RECORD_STATUS_LABELS,
  CONSULTATION_PRESCRIPTION_STATUS_LABELS,
} from "@/features/consultations/constants/consultation-prescription.constants"
import type {
  ConsultationAllergyReviewStatus,
  ConsultationPrescriptionRecordStatus,
  ConsultationPrescriptionStatus,
} from "@/features/consultations/types/consultation-prescription.types"
import { cn } from "@/lib/utils"

const prescriptionStatusStyles: Record<
  ConsultationPrescriptionStatus,
  string
> = {
  draft:
    "border-amber-200 bg-amber-50 text-amber-700",

  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  discontinued:
    "border-slate-200 bg-slate-100 text-slate-600",

  cancelled:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const allergyReviewStyles: Record<
  ConsultationAllergyReviewStatus,
  string
> = {
  "not-reviewed":
    "border-amber-200 bg-amber-50 text-amber-700",

  "reviewed-no-conflict":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "reviewed-with-warning":
    "border-rose-200 bg-rose-50 text-rose-700",
}

const recordStatusStyles: Record<
  ConsultationPrescriptionRecordStatus,
  string
> = {
  current:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
}

interface PrescriptionStatusBadgeProps {
  status: ConsultationPrescriptionStatus
}

export function PrescriptionStatusBadge({
  status,
}: PrescriptionStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        prescriptionStatusStyles[status]
      )}
    >
      {
        CONSULTATION_PRESCRIPTION_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

interface PrescriptionAllergyReviewBadgeProps {
  status: ConsultationAllergyReviewStatus
}

export function PrescriptionAllergyReviewBadge({
  status,
}: PrescriptionAllergyReviewBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        allergyReviewStyles[status]
      )}
    >
      {
        CONSULTATION_ALLERGY_REVIEW_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

interface PrescriptionRecordStatusBadgeProps {
  status: ConsultationPrescriptionRecordStatus
}

export function PrescriptionRecordStatusBadge({
  status,
}: PrescriptionRecordStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        recordStatusStyles[status]
      )}
    >
      {
        CONSULTATION_PRESCRIPTION_RECORD_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
