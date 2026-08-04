import {
  RADIOLOGY_ORDER_PRIORITY_LABELS,
  RADIOLOGY_ORDER_STATUS_LABELS,
} from "@/features/radiology/constants/radiology.constants"
import type {
  RadiologyOrderPriority,
  RadiologyOrderStatus,
} from "@/features/radiology/types/radiology.types"
import { cn } from "@/lib/utils"

const statusStyles: Record<
  RadiologyOrderStatus,
  string
> = {
  ordered:
    "border-slate-200 bg-slate-50 text-slate-700",

  scheduled:
    "border-sky-200 bg-sky-50 text-sky-700",

  "checked-in":
    "border-amber-200 bg-amber-50 text-amber-700",

  ready:
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  "in-progress":
    "border-violet-200 bg-violet-50 text-violet-700",

  "images-acquired":
    "border-indigo-200 bg-indigo-50 text-indigo-700",

  "technically-completed":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "report-draft":
    "border-amber-200 bg-amber-50 text-amber-700",

  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  released:
    "border-teal-200 bg-teal-50 text-teal-700",

  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",

  "no-show":
    "border-rose-200 bg-rose-50 text-rose-700",
}

const priorityStyles: Record<
  RadiologyOrderPriority,
  string
> = {
  routine:
    "border-slate-200 bg-slate-50 text-slate-600",

  urgent:
    "border-amber-200 bg-amber-50 text-amber-700",

  stat:
    "border-rose-200 bg-rose-50 text-rose-700",
}

export function RadiologyOrderStatusBadge({
  status,
}: {
  status: RadiologyOrderStatus
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {
        RADIOLOGY_ORDER_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function RadiologyOrderPriorityBadge({
  priority,
}: {
  priority: RadiologyOrderPriority
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        priorityStyles[priority]
      )}
    >
      {
        RADIOLOGY_ORDER_PRIORITY_LABELS[
          priority
        ]
      }
    </span>
  )
}
