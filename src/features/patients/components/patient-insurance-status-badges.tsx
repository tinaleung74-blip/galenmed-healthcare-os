import {
  INSURANCE_COVERAGE_STATUS_LABELS,
  INSURANCE_PRIORITY_LABELS,
  INSURANCE_RECORD_STATUS_LABELS,
  INSURANCE_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-insurance.constants"
import type {
  InsuranceCoverageStatus,
  InsurancePriority,
  InsuranceRecordStatus,
  InsuranceVerificationStatus,
} from "@/features/patients/types/patient-insurance.types"
import { cn } from "@/lib/utils"

const coverageStatusStyles: Record<
  InsuranceCoverageStatus,
  string
> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  inactive:
    "border-slate-200 bg-slate-50 text-slate-600",
  expired:
    "border-rose-200 bg-rose-50 text-rose-700",
  cancelled:
    "border-red-200 bg-red-50 text-red-700",
}

const verificationStatusStyles: Record<
  InsuranceVerificationStatus,
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

const priorityStyles: Record<
  InsurancePriority,
  string
> = {
  primary:
    "border-violet-200 bg-violet-50 text-violet-700",
  secondary:
    "border-sky-200 bg-sky-50 text-sky-700",
  tertiary:
    "border-slate-200 bg-slate-50 text-slate-600",
}

const recordStatusStyles: Record<
  InsuranceRecordStatus,
  string
> = {
  current:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
}

interface InsuranceCoverageStatusBadgeProps {
  status: InsuranceCoverageStatus
}

export function InsuranceCoverageStatusBadge({
  status,
}: InsuranceCoverageStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        coverageStatusStyles[status]
      )}
    >
      {INSURANCE_COVERAGE_STATUS_LABELS[status]}
    </span>
  )
}

interface InsuranceVerificationBadgeProps {
  status: InsuranceVerificationStatus
}

export function InsuranceVerificationBadge({
  status,
}: InsuranceVerificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        verificationStatusStyles[status]
      )}
    >
      {INSURANCE_VERIFICATION_STATUS_LABELS[status]}
    </span>
  )
}

interface InsurancePriorityBadgeProps {
  priority: InsurancePriority
}

export function InsurancePriorityBadge({
  priority,
}: InsurancePriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        priorityStyles[priority]
      )}
    >
      {INSURANCE_PRIORITY_LABELS[priority]}
    </span>
  )
}

interface InsuranceRecordStatusBadgeProps {
  status: InsuranceRecordStatus
}

export function InsuranceRecordStatusBadge({
  status,
}: InsuranceRecordStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        recordStatusStyles[status]
      )}
    >
      {INSURANCE_RECORD_STATUS_LABELS[status]}
    </span>
  )
}
