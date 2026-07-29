import type { PatientStatus } from "@/features/patients/types/patient.types"
import { PATIENT_STATUS_LABELS } from "@/features/patients/constants/patient.constants"
import { cn } from "@/lib/utils"

const patientStatusStyles: Record<PatientStatus, string> = {
  active: "border-teal-200 bg-teal-50 text-teal-700",
  inactive: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
}

interface PatientStatusBadgeProps {
  status: PatientStatus
}

export function PatientStatusBadge({
  status,
}: PatientStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        patientStatusStyles[status]
      )}
    >
      {PATIENT_STATUS_LABELS[status]}
    </span>
  )
}
