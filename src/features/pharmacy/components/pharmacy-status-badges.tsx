import {
  PHARMACY_INVENTORY_STATUS_LABELS,
  PHARMACY_PRESCRIPTION_PRIORITY_LABELS,
  PHARMACY_PRESCRIPTION_STATUS_LABELS,
  PHARMACY_REVIEW_STATUS_LABELS,
} from "@/features/pharmacy/constants/pharmacy.constants"
import type {
  PharmacyInventoryStatus,
  PharmacyPrescriptionPriority,
  PharmacyPrescriptionStatus,
  PharmacyReviewStatus,
} from "@/features/pharmacy/types/pharmacy.types"
import { cn } from "@/lib/utils"

const prescriptionStatusStyles: Record<
  PharmacyPrescriptionStatus,
  string
> = {
  received:
    "border-slate-200 bg-slate-50 text-slate-700",

  "pending-review":
    "border-amber-200 bg-amber-50 text-amber-700",

  "on-hold":
    "border-rose-200 bg-rose-50 text-rose-700",

  approved:
    "border-sky-200 bg-sky-50 text-sky-700",

  "partially-dispensed":
    "border-violet-200 bg-violet-50 text-violet-700",

  dispensed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const priorityStyles: Record<
  PharmacyPrescriptionPriority,
  string
> = {
  routine:
    "border-slate-200 bg-slate-50 text-slate-600",

  urgent:
    "border-amber-200 bg-amber-50 text-amber-700",

  stat:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const reviewStyles: Record<
  PharmacyReviewStatus,
  string
> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",

  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  warning:
    "border-amber-200 bg-amber-50 text-amber-700",

  blocked:
    "border-rose-200 bg-rose-50 text-rose-700",

  "not-applicable":
    "border-slate-200 bg-slate-50 text-slate-600",
}

const inventoryStyles: Record<
  PharmacyInventoryStatus,
  string
> = {
  available:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "low-stock":
    "border-amber-200 bg-amber-50 text-amber-700",

  "out-of-stock":
    "border-rose-200 bg-rose-50 text-rose-700",

  inactive:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

export function PharmacyPrescriptionStatusBadge({
  status,
}: {
  status: PharmacyPrescriptionStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        prescriptionStatusStyles[
          status
        ]
      )}
    >
      {
        PHARMACY_PRESCRIPTION_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function PharmacyPrescriptionPriorityBadge({
  priority,
}: {
  priority: PharmacyPrescriptionPriority
}) {
  return (
    <span
      className={cn(
        baseClassName,
        priorityStyles[priority]
      )}
    >
      {
        PHARMACY_PRESCRIPTION_PRIORITY_LABELS[
          priority
        ]
      }
    </span>
  )
}

export function PharmacyReviewStatusBadge({
  status,
}: {
  status: PharmacyReviewStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        reviewStyles[status]
      )}
    >
      {
        PHARMACY_REVIEW_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function PharmacyInventoryStatusBadge({
  status,
}: {
  status: PharmacyInventoryStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        inventoryStyles[status]
      )}
    >
      {
        PHARMACY_INVENTORY_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
