import type {
  LaboratoryDocumentStatus,
  LaboratoryPaymentStatus,
  LaboratoryReleaseStatus,
  LaboratoryResultFlag,
} from "@/features/hospital-operations/types/laboratory-result.types"
import {
  LABORATORY_DOCUMENT_STATUS_LABELS,
  LABORATORY_PAYMENT_STATUS_LABELS,
  LABORATORY_RELEASE_STATUS_LABELS,
  LABORATORY_RESULT_FLAG_LABELS,
} from "@/features/hospital-operations/utils/laboratory-result.utils"
import { cn } from "@/lib/utils"

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

const documentStyles: Record<
  LaboratoryDocumentStatus,
  string
> = {
  draft:
    "border-slate-200 bg-slate-50 text-slate-700",
  for_review:
    "border-violet-200 bg-violet-50 text-violet-700",
  finalized:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  corrected:
    "border-sky-200 bg-sky-50 text-sky-700",
  superseded:
    "border-slate-200 bg-slate-100 text-slate-600",
  voided:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const paymentStyles: Record<
  LaboratoryPaymentStatus,
  string
> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  partially_cleared:
    "border-orange-200 bg-orange-50 text-orange-700",
  cleared:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  waived:
    "border-sky-200 bg-sky-50 text-sky-700",
  blocked:
    "border-rose-200 bg-rose-50 text-rose-700",
  revoked:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const releaseStyles: Record<
  LaboratoryReleaseStatus,
  string
> = {
  not_ready:
    "border-slate-200 bg-slate-50 text-slate-700",
  payment_pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  ready:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  released:
    "border-teal-200 bg-teal-50 text-teal-700",
  blocked:
    "border-rose-200 bg-rose-50 text-rose-700",
  voided:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const flagStyles: Record<
  LaboratoryResultFlag,
  string
> = {
  normal:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  high:
    "border-rose-200 bg-rose-50 text-rose-700",
  low:
    "border-sky-200 bg-sky-50 text-sky-700",
  abnormal:
    "border-orange-200 bg-orange-50 text-orange-700",
  critical:
    "border-red-300 bg-red-100 text-red-800",
  not_applicable:
    "border-slate-200 bg-slate-50 text-slate-600",
}

export function LaboratoryDocumentStatusBadge({
  status,
}: {
  status: LaboratoryDocumentStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        documentStyles[status]
      )}
    >
      {
        LABORATORY_DOCUMENT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function LaboratoryPaymentStatusBadge({
  status,
}: {
  status: LaboratoryPaymentStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        paymentStyles[status]
      )}
    >
      {
        LABORATORY_PAYMENT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function LaboratoryReleaseStatusBadge({
  status,
}: {
  status: LaboratoryReleaseStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        releaseStyles[status]
      )}
    >
      {
        LABORATORY_RELEASE_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function LaboratoryResultFlagBadge({
  flag,
}: {
  flag: LaboratoryResultFlag
}) {
  return (
    <span
      className={cn(
        baseClassName,
        flagStyles[flag]
      )}
    >
      {
        LABORATORY_RESULT_FLAG_LABELS[
          flag
        ]
      }
    </span>
  )
}
