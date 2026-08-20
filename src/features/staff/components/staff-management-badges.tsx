import type {
  StaffAccountStatus,
} from "@/features/auth/types/staff-auth.types"
import { cn } from "@/lib/utils"

const statusStyles: Record<
  StaffAccountStatus,
  string
> = {
  invited:
    "border-sky-200 bg-sky-50 text-sky-700",
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  locked:
    "border-amber-200 bg-amber-50 text-amber-700",
  suspended:
    "border-orange-200 bg-orange-50 text-orange-700",
  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
}

const statusLabels: Record<
  StaffAccountStatus,
  string
> = {
  invited: "Invited",
  active: "Active",
  locked: "Locked",
  suspended: "Suspended",
  archived: "Archived",
}

export function StaffAccountStatusBadge({
  status,
}: {
  status: StaffAccountStatus
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
