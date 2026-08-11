import {
  PHILHEALTH_CLAIM_STATUS_LABELS,
  PHILHEALTH_CONNECTION_MODE_LABELS,
  PHILHEALTH_ELIGIBILITY_STATUS_LABELS,
  PHILHEALTH_INTEGRATION_STATUS_LABELS,
  PHILHEALTH_REQUIREMENT_STATUS_LABELS,
} from "@/features/philhealth/constants/philhealth.constants"
import type {
  PhilHealthClaimStatus,
  PhilHealthConnectionMode,
  PhilHealthEligibilityStatus,
  PhilHealthIntegrationStatus,
  PhilHealthRequirementStatus,
} from "@/features/philhealth/types/philhealth.types"
import { cn } from "@/lib/utils"

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

const claimStatusStyles: Record<
  PhilHealthClaimStatus,
  string
> = {
  draft:
    "border-slate-200 bg-slate-50 text-slate-700",

  "eligibility-pending":
    "border-amber-200 bg-amber-50 text-amber-700",

  "requirements-incomplete":
    "border-orange-200 bg-orange-50 text-orange-700",

  "ready-for-review":
    "border-sky-200 bg-sky-50 text-sky-700",

  "under-review":
    "border-indigo-200 bg-indigo-50 text-indigo-700",

  "approved-for-submission":
    "border-violet-200 bg-violet-50 text-violet-700",

  "submitted-manually":
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  "submitted-electronically":
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  returned:
    "border-amber-200 bg-amber-50 text-amber-700",

  denied:
    "border-rose-200 bg-rose-50 text-rose-700",

  paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  reconciled:
    "border-teal-200 bg-teal-50 text-teal-700",

  voided:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const eligibilityStatusStyles: Record<
  PhilHealthEligibilityStatus,
  string
> = {
  "not-checked":
    "border-slate-200 bg-slate-50 text-slate-700",

  pending:
    "border-amber-200 bg-amber-50 text-amber-700",

  eligible:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "not-eligible":
    "border-rose-200 bg-rose-50 text-rose-700",

  mismatch:
    "border-orange-200 bg-orange-50 text-orange-700",

  error:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const requirementStatusStyles: Record<
  PhilHealthRequirementStatus,
  string
> = {
  missing:
    "border-rose-200 bg-rose-50 text-rose-700",

  provided:
    "border-sky-200 bg-sky-50 text-sky-700",

  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  rejected:
    "border-rose-200 bg-rose-50 text-rose-700",

  "not-required":
    "border-slate-200 bg-slate-100 text-slate-600",
}

const connectionModeStyles: Record<
  PhilHealthConnectionMode,
  string
> = {
  manual:
    "border-amber-200 bg-amber-50 text-amber-700",

  certification:
    "border-violet-200 bg-violet-50 text-violet-700",

  live:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
}

const integrationStatusStyles: Record<
  PhilHealthIntegrationStatus,
  string
> = {
  "not-configured":
    "border-slate-200 bg-slate-50 text-slate-700",

  "awaiting-credentials":
    "border-amber-200 bg-amber-50 text-amber-700",

  testing:
    "border-sky-200 bg-sky-50 text-sky-700",

  certification:
    "border-violet-200 bg-violet-50 text-violet-700",

  ready:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  blocked:
    "border-rose-200 bg-rose-50 text-rose-700",
}

export function PhilHealthClaimStatusBadge({
  status,
}: {
  status: PhilHealthClaimStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        claimStatusStyles[status]
      )}
    >
      {
        PHILHEALTH_CLAIM_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function PhilHealthEligibilityStatusBadge({
  status,
}: {
  status:
    PhilHealthEligibilityStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        eligibilityStatusStyles[
          status
        ]
      )}
    >
      {
        PHILHEALTH_ELIGIBILITY_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function PhilHealthRequirementStatusBadge({
  status,
}: {
  status:
    PhilHealthRequirementStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        requirementStatusStyles[
          status
        ]
      )}
    >
      {
        PHILHEALTH_REQUIREMENT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function PhilHealthConnectionModeBadge({
  mode,
}: {
  mode: PhilHealthConnectionMode
}) {
  return (
    <span
      className={cn(
        baseClassName,
        connectionModeStyles[mode]
      )}
    >
      {
        PHILHEALTH_CONNECTION_MODE_LABELS[
          mode
        ]
      }
    </span>
  )
}

export function PhilHealthIntegrationStatusBadge({
  status,
}: {
  status:
    PhilHealthIntegrationStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        integrationStatusStyles[
          status
        ]
      )}
    >
      {
        PHILHEALTH_INTEGRATION_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
