import {
  RECEPTION_DOCUMENT_STATUS_LABELS,
  RECEPTION_PAYMENT_STATUS_LABELS,
  RECEPTION_RELEASE_STATUS_LABELS,
} from "@/features/hospital-operations/utils/reception-release.utils"
import type {
  ReceptionDocumentStatus,
  ReceptionPaymentStatus,
  ReceptionReleaseStatus,
} from "@/features/hospital-operations/types/reception-release.types"
import { cn } from "@/lib/utils"

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

const releaseStyles: Record<
  ReceptionReleaseStatus,
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

const paymentStyles: Record<
  ReceptionPaymentStatus,
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

const documentStyles: Record<
  ReceptionDocumentStatus,
  string
> = {
  finalized:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  corrected:
    "border-violet-200 bg-violet-50 text-violet-700",
}

export function ReceptionReleaseStatusBadge({
  status,
}: {
  status: ReceptionReleaseStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        releaseStyles[status]
      )}
    >
      {
        RECEPTION_RELEASE_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function ReceptionPaymentStatusBadge({
  status,
}: {
  status: ReceptionPaymentStatus | null
}) {
  if (!status) {
    return (
      <span
        className={cn(
          baseClassName,
          "border-slate-200 bg-slate-50 text-slate-600"
        )}
      >
        Not linked
      </span>
    )
  }

  return (
    <span
      className={cn(
        baseClassName,
        paymentStyles[status]
      )}
    >
      {
        RECEPTION_PAYMENT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function ReceptionDocumentStatusBadge({
  status,
}: {
  status: ReceptionDocumentStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        documentStyles[status]
      )}
    >
      {
        RECEPTION_DOCUMENT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
