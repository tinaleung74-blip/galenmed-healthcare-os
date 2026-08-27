import {
  CASHIER_BILLING_STATUS_LABELS,
  CASHIER_CLEARANCE_STATUS_LABELS,
  CASHIER_PAYMENT_STATUS_LABELS,
} from "@/features/hospital-operations/utils/cashier-billing.utils"
import type {
  CashierBillingAccountStatus,
  CashierPaymentClearanceStatus,
  CashierPaymentTransactionStatus,
} from "@/features/hospital-operations/types/cashier-billing.types"
import { cn } from "@/lib/utils"

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

const billingStyles: Record<
  CashierBillingAccountStatus,
  string
> = {
  open:
    "border-amber-200 bg-amber-50 text-amber-700",
  partially_paid:
    "border-sky-200 bg-sky-50 text-sky-700",
  paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  waived:
    "border-violet-200 bg-violet-50 text-violet-700",
  refunded:
    "border-slate-200 bg-slate-100 text-slate-700",
  voided:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const paymentStyles: Record<
  CashierPaymentTransactionStatus,
  string
> = {
  posted:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  voided:
    "border-rose-200 bg-rose-50 text-rose-700",
  refunded:
    "border-slate-200 bg-slate-100 text-slate-700",
}

const clearanceStyles: Record<
  CashierPaymentClearanceStatus,
  string
> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  partially_cleared:
    "border-sky-200 bg-sky-50 text-sky-700",
  cleared:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  waived:
    "border-violet-200 bg-violet-50 text-violet-700",
  blocked:
    "border-rose-200 bg-rose-50 text-rose-700",
  revoked:
    "border-slate-200 bg-slate-100 text-slate-700",
}

export function CashierBillingStatusBadge({
  status,
}: {
  status:
    CashierBillingAccountStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        billingStyles[status]
      )}
    >
      {
        CASHIER_BILLING_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function CashierPaymentStatusBadge({
  status,
}: {
  status:
    CashierPaymentTransactionStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        paymentStyles[status]
      )}
    >
      {
        CASHIER_PAYMENT_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function CashierClearanceStatusBadge({
  status,
}: {
  status:
    CashierPaymentClearanceStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        clearanceStyles[status]
      )}
    >
      {
        CASHIER_CLEARANCE_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
