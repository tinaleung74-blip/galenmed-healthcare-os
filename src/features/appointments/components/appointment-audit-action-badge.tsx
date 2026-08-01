import {
  APPOINTMENT_AUDIT_ACTION_LABELS,
} from "@/features/appointments/constants/appointment-audit.constants"
import type { AppointmentAuditAction } from "@/features/appointments/types/appointment-audit.types"
import { cn } from "@/lib/utils"

const actionStyles: Record<
  AppointmentAuditAction,
  string
> = {
  created:
    "border-slate-200 bg-slate-50 text-slate-600",

  updated:
    "border-violet-200 bg-violet-50 text-violet-700",

  rescheduled:
    "border-amber-200 bg-amber-50 text-amber-700",

  confirmed:
    "border-sky-200 bg-sky-50 text-sky-700",

  "checked-in":
    "border-amber-200 bg-amber-50 text-amber-700",

  queued:
    "border-cyan-200 bg-cyan-50 text-cyan-700",

  "consultation-started":
    "border-violet-200 bg-violet-50 text-violet-700",

  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600",

  "no-show":
    "border-rose-200 bg-rose-50 text-rose-700",
}

interface AppointmentAuditActionBadgeProps {
  action: AppointmentAuditAction
}

export function AppointmentAuditActionBadge({
  action,
}: AppointmentAuditActionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        actionStyles[action]
      )}
    >
      {
        APPOINTMENT_AUDIT_ACTION_LABELS[
          action
        ]
      }
    </span>
  )
}
