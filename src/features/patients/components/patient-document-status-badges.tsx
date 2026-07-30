import {
  PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS,
  PATIENT_DOCUMENT_RECORD_STATUS_LABELS,
  PATIENT_DOCUMENT_STATUS_LABELS,
  PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-document.constants"
import type {
  PatientDocumentConfidentialityLevel,
  PatientDocumentRecordStatus,
  PatientDocumentStatus,
  PatientDocumentVerificationStatus,
} from "@/features/patients/types/patient-document.types"
import { cn } from "@/lib/utils"

const documentStatusStyles: Record<
  PatientDocumentStatus,
  string
> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  expired:
    "border-rose-200 bg-rose-50 text-rose-700",
  superseded:
    "border-amber-200 bg-amber-50 text-amber-700",
  revoked:
    "border-red-200 bg-red-50 text-red-700",
}

const verificationStyles: Record<
  PatientDocumentVerificationStatus,
  string
> = {
  unverified:
    "border-slate-200 bg-slate-50 text-slate-600",
  verified:
    "border-sky-200 bg-sky-50 text-sky-700",
  "needs-review":
    "border-amber-200 bg-amber-50 text-amber-700",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const confidentialityStyles: Record<
  PatientDocumentConfidentialityLevel,
  string
> = {
  standard:
    "border-slate-200 bg-slate-50 text-slate-600",
  restricted:
    "border-violet-200 bg-violet-50 text-violet-700",
  "highly-restricted":
    "border-rose-200 bg-rose-50 text-rose-700",
}

const recordStatusStyles: Record<
  PatientDocumentRecordStatus,
  string
> = {
  current:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
}

interface DocumentStatusBadgeProps {
  status: PatientDocumentStatus
}

export function DocumentStatusBadge({
  status,
}: DocumentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        documentStatusStyles[status]
      )}
    >
      {PATIENT_DOCUMENT_STATUS_LABELS[status]}
    </span>
  )
}

interface DocumentVerificationBadgeProps {
  status: PatientDocumentVerificationStatus
}

export function DocumentVerificationBadge({
  status,
}: DocumentVerificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        verificationStyles[status]
      )}
    >
      {
        PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

interface DocumentConfidentialityBadgeProps {
  level: PatientDocumentConfidentialityLevel
}

export function DocumentConfidentialityBadge({
  level,
}: DocumentConfidentialityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        confidentialityStyles[level]
      )}
    >
      {
        PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS[
          level
        ]
      }
    </span>
  )
}

interface DocumentRecordStatusBadgeProps {
  status: PatientDocumentRecordStatus
}

export function DocumentRecordStatusBadge({
  status,
}: DocumentRecordStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        recordStatusStyles[status]
      )}
    >
      {
        PATIENT_DOCUMENT_RECORD_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
