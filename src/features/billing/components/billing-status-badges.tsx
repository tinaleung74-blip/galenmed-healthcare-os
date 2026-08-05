import {
  BILLING_CHARGE_SOURCE_LABELS,
  BILLING_CHARGE_STATUS_LABELS,
  BILLING_PAYMENT_METHOD_LABELS,
  BILLING_STATEMENT_STATUS_LABELS,
} from "@/features/billing/constants/billing.constants"
import type {
  BillingChargeSource,
  BillingChargeStatus,
  BillingPaymentMethod,
  BillingStatementStatus,
} from "@/features/billing/types/billing.types"
import { cn } from "@/lib/utils"

const statementStatusStyles: Record<
  BillingStatementStatus,
  string
> = {
  draft:
    "border-slate-200 bg-slate-50 text-slate-700",

  issued:
    "border-sky-200 bg-sky-50 text-sky-700",

  "partially-paid":
    "border-amber-200 bg-amber-50 text-amber-700",

  paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  voided:
    "border-slate-200 bg-slate-100 text-slate-600",

  refunded:
    "border-violet-200 bg-violet-50 text-violet-700",
}

const chargeSourceStyles: Record<
  BillingChargeSource,
  string
> = {
  appointment:
    "border-sky-200 bg-sky-50 text-sky-700",

  consultation:
    "border-indigo-200 bg-indigo-50 text-indigo-700",

  laboratory:
    "border-violet-200 bg-violet-50 text-violet-700",

  radiology:
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  pharmacy:
    "border-teal-200 bg-teal-50 text-teal-700",

  manual:
    "border-slate-200 bg-slate-50 text-slate-700",
}

const chargeStatusStyles: Record<
  BillingChargeStatus,
  string
> = {
  draft:
    "border-slate-200 bg-slate-50 text-slate-700",

  posted:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  voided:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const paymentMethodStyles: Record<
  BillingPaymentMethod,
  string
> = {
  cash:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  card:
    "border-indigo-200 bg-indigo-50 text-indigo-700",

  "bank-transfer":
    "border-sky-200 bg-sky-50 text-sky-700",

  "e-wallet":
    "border-violet-200 bg-violet-50 text-violet-700",

  check:
    "border-amber-200 bg-amber-50 text-amber-700",

  other:
    "border-slate-200 bg-slate-50 text-slate-700",
}

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

export function BillingStatementStatusBadge({
  status,
}: {
  status: BillingStatementStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        statementStatusStyles[
          status
        ]
      )}
    >
      {
        BILLING_STATEMENT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function BillingChargeSourceBadge({
  source,
}: {
  source: BillingChargeSource
}) {
  return (
    <span
      className={cn(
        baseClassName,
        chargeSourceStyles[source]
      )}
    >
      {
        BILLING_CHARGE_SOURCE_LABELS[
          source
        ]
      }
    </span>
  )
}

export function BillingChargeStatusBadge({
  status,
}: {
  status: BillingChargeStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        chargeStatusStyles[status]
      )}
    >
      {
        BILLING_CHARGE_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function BillingPaymentMethodBadge({
  method,
}: {
  method: BillingPaymentMethod
}) {
  return (
    <span
      className={cn(
        baseClassName,
        paymentMethodStyles[method]
      )}
    >
      {
        BILLING_PAYMENT_METHOD_LABELS[
          method
        ]
      }
    </span>
  )
}

export function BillingBalanceBadge({
  balanceDueCentavos,
  creditBalanceCentavos,
}: {
  balanceDueCentavos: number
  creditBalanceCentavos: number
}) {
  if (creditBalanceCentavos > 0) {
    return (
      <span
        className={cn(
          baseClassName,
          "border-violet-200 bg-violet-50 text-violet-700"
        )}
      >
        Credit Balance
      </span>
    )
  }

  if (balanceDueCentavos > 0) {
    return (
      <span
        className={cn(
          baseClassName,
          "border-amber-200 bg-amber-50 text-amber-700"
        )}
      >
        Open Balance
      </span>
    )
  }

  return (
    <span
      className={cn(
        baseClassName,
        "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      Fully Settled
    </span>
  )
}
