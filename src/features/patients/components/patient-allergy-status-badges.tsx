import {
  ALLERGY_CLINICAL_STATUS_LABELS,
  ALLERGY_CRITICALITY_LABELS,
  ALLERGY_RECORD_STATUS_LABELS,
  ALLERGY_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-allergy.constants"
import type {
  AllergyClinicalStatus,
  AllergyCriticality,
  AllergyRecordStatus,
  AllergyVerificationStatus,
} from "@/features/patients/types/patient-allergy.types"
import { cn } from "@/lib/utils"

const clinicalStatusStyles: Record<
  AllergyClinicalStatus,
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
  AllergyVerificationStatus,
  string
> = {
  unconfirmed:
    "border-slate-200 bg-slate-50 text-slate-600",
  presumed:
    "border-violet-200 bg-violet-50 text-violet-700",
  confirmed:
    "border-sky-200 bg-sky-50 text-sky-700",
  refuted:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const criticalityStyles: Record<
  AllergyCriticality,
  string
> = {
  low:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  high:
    "border-rose-200 bg-rose-50 text-rose-700",
  "unable-to-assess":
    "border-slate-200 bg-slate-50 text-slate-600",
}

const recordStatusStyles: Record<
  AllergyRecordStatus,
  string
> = {
  current:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
}

interface AllergyClinicalStatusBadgeProps {
  status: AllergyClinicalStatus
}

export function AllergyClinicalStatusBadge({
  status,
}: AllergyClinicalStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        clinicalStatusStyles[status]
      )}
    >
      {ALLERGY_CLINICAL_STATUS_LABELS[status]}
    </span>
  )
}

interface AllergyVerificationBadgeProps {
  status: AllergyVerificationStatus
}

export function AllergyVerificationBadge({
  status,
}: AllergyVerificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        verificationStatusStyles[status]
      )}
    >
      {ALLERGY_VERIFICATION_STATUS_LABELS[status]}
    </span>
  )
}

interface AllergyCriticalityBadgeProps {
  criticality: AllergyCriticality
}

export function AllergyCriticalityBadge({
  criticality,
}: AllergyCriticalityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        criticalityStyles[criticality]
      )}
    >
      {ALLERGY_CRITICALITY_LABELS[criticality]}
    </span>
  )
}

interface AllergyRecordStatusBadgeProps {
  status: AllergyRecordStatus
}

export function AllergyRecordStatusBadge({
  status,
}: AllergyRecordStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        recordStatusStyles[status]
      )}
    >
      {ALLERGY_RECORD_STATUS_LABELS[status]}
    </span>
  )
}
