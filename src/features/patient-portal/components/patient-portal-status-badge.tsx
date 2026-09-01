import type {
  PatientPortalAccountStatus,
} from "@/features/patient-portal/types/patient-portal.types"
import { cn } from "@/lib/utils"

const STATUS_LABELS: Record<
  PatientPortalAccountStatus,
  string
> = {
  invited: "Invited",
  active: "Active",
  locked: "Locked",
  suspended: "Suspended",
  archived: "Archived",
}

const STATUS_CLASSES: Record<
  PatientPortalAccountStatus,
  string
> = {
  invited:
    "border-amber-200 bg-amber-50 text-amber-800",
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  locked:
    "border-rose-200 bg-rose-50 text-rose-800",
  suspended:
    "border-orange-200 bg-orange-50 text-orange-800",
  archived:
    "border-slate-200 bg-slate-100 text-slate-700",
}

interface PatientPortalStatusBadgeProps {
  status:
    PatientPortalAccountStatus
}

export function PatientPortalStatusBadge({
  status,
}: PatientPortalStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASSES[
          status
        ]
      )}
    >
      {
        STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
