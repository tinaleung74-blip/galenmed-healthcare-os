import {
  LABORATORY_ORDER_PRIORITY_LABELS,
  LABORATORY_ORDER_STATUS_LABELS,
  LABORATORY_SPECIMEN_STATUS_LABELS,
} from "@/features/laboratory/constants/laboratory.constants"
import type {
  LaboratoryOrderPriority,
  LaboratoryOrderStatus,
  LaboratorySpecimenStatus,
} from "@/features/laboratory/types/laboratory.types"
import { cn } from "@/lib/utils"

const orderStatusStyles: Record<
  LaboratoryOrderStatus,
  string
> = {
  ordered:
    "border-slate-200 bg-slate-50 text-slate-700",
  "specimen-collected":
    "border-amber-200 bg-amber-50 text-amber-700",
  received:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
  "in-process":
    "border-sky-200 bg-sky-50 text-sky-700",
  completed:
    "border-violet-200 bg-violet-50 text-violet-700",
  verified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  released:
    "border-teal-200 bg-teal-50 text-teal-700",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-700",
  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const priorityStyles: Record<
  LaboratoryOrderPriority,
  string
> = {
  routine:
    "border-slate-200 bg-slate-50 text-slate-600",
  urgent:
    "border-amber-200 bg-amber-50 text-amber-700",
  stat:
    "border-rose-200 bg-rose-50 text-rose-700",
}

const specimenStatusStyles: Record<
  LaboratorySpecimenStatus,
  string
> = {
  collected:
    "border-amber-200 bg-amber-50 text-amber-700",
  received:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-700",
}

interface LaboratoryOrderStatusBadgeProps {
  status: LaboratoryOrderStatus
}

export function LaboratoryOrderStatusBadge({
  status,
}: LaboratoryOrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        orderStatusStyles[status]
      )}
    >
      {LABORATORY_ORDER_STATUS_LABELS[status]}
    </span>
  )
}

interface LaboratoryOrderPriorityBadgeProps {
  priority: LaboratoryOrderPriority
}

export function LaboratoryOrderPriorityBadge({
  priority,
}: LaboratoryOrderPriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        priorityStyles[priority]
      )}
    >
      {LABORATORY_ORDER_PRIORITY_LABELS[priority]}
    </span>
  )
}

interface LaboratorySpecimenStatusBadgeProps {
  status: LaboratorySpecimenStatus
}

export function LaboratorySpecimenStatusBadge({
  status,
}: LaboratorySpecimenStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        specimenStatusStyles[status]
      )}
    >
      {LABORATORY_SPECIMEN_STATUS_LABELS[status]}
    </span>
  )
}
