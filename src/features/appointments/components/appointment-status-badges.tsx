import {
  APPOINTMENT_PRIORITY_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from "@/features/appointments/constants/appointment.constants"
import type {
  AppointmentPriority,
  AppointmentStatus,
} from "@/features/appointments/types/appointment.types"
import { cn } from "@/lib/utils"

const appointmentStatusStyles: Record<
  AppointmentStatus,
  string
> = {
  scheduled:
    "border-slate-200 bg-slate-50 text-slate-600",

  confirmed:
    "border-sky-200 bg-sky-50 text-sky-700",

  "checked-in":
    "border-amber-200 bg-amber-50 text-amber-700",

  "in-consultation":
    "border-violet-200 bg-violet-50 text-violet-700",

  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",

  "no-show":
    "border-rose-200 bg-rose-50 text-rose-700",
}

const appointmentPriorityStyles: Record<
  AppointmentPriority,
  string
> = {
  routine:
    "border-slate-200 bg-slate-50 text-slate-600",

  urgent:
    "border-rose-200 bg-rose-50 text-rose-700",
}

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus
}

export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        appointmentStatusStyles[status]
      )}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  )
}

interface AppointmentPriorityBadgeProps {
  priority: AppointmentPriority
}

export function AppointmentPriorityBadge({
  priority,
}: AppointmentPriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        appointmentPriorityStyles[priority]
      )}
    >
      {APPOINTMENT_PRIORITY_LABELS[priority]}
    </span>
  )
}
