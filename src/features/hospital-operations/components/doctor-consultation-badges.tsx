import type {
  DoctorConsultationStatus,
  DoctorPriority,
  DoctorQueueStatus,
} from "@/features/hospital-operations/types/doctor-consultation.types"
import {
  DOCTOR_PRIORITY_LABELS,
  DOCTOR_QUEUE_STATUS_LABELS,
} from "@/features/hospital-operations/utils/doctor-consultation.utils"
import { cn } from "@/lib/utils"

const baseClassName =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"

const priorityStyles: Record<
  DoctorPriority,
  string
> = {
  routine:
    "border-slate-200 bg-slate-50 text-slate-700",
  urgent:
    "border-amber-200 bg-amber-50 text-amber-800",
  stat:
    "border-orange-200 bg-orange-50 text-orange-800",
  emergency:
    "border-rose-200 bg-rose-50 text-rose-800",
}

const queueStyles: Record<
  DoctorQueueStatus,
  string
> = {
  waiting:
    "border-sky-200 bg-sky-50 text-sky-800",
  called:
    "border-violet-200 bg-violet-50 text-violet-800",
  in_service:
    "border-teal-200 bg-teal-50 text-teal-800",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  no_show:
    "border-slate-200 bg-slate-100 text-slate-700",
  cancelled:
    "border-rose-200 bg-rose-50 text-rose-800",
}

const consultationStyles: Record<
  DoctorConsultationStatus,
  string
> = {
  in_progress:
    "border-teal-200 bg-teal-50 text-teal-800",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled:
    "border-rose-200 bg-rose-50 text-rose-800",
}

export function DoctorPriorityBadge({
  priority,
}: {
  priority: DoctorPriority
}) {
  return (
    <span
      className={cn(
        baseClassName,
        priorityStyles[priority]
      )}
    >
      {
        DOCTOR_PRIORITY_LABELS[
          priority
        ]
      }
    </span>
  )
}

export function DoctorQueueStatusBadge({
  status,
}: {
  status: DoctorQueueStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        queueStyles[status]
      )}
    >
      {
        DOCTOR_QUEUE_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}

export function DoctorConsultationStatusBadge({
  status,
}: {
  status: DoctorConsultationStatus
}) {
  return (
    <span
      className={cn(
        baseClassName,
        consultationStyles[status]
      )}
    >
      {status === "in_progress"
        ? "In Progress"
        : status === "completed"
          ? "Completed"
          : "Cancelled"}
    </span>
  )
}
