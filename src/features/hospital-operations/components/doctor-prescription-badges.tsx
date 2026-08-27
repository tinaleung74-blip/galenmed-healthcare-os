import type { DoctorPrescriptionStatus } from "@/features/hospital-operations/types/doctor-prescription.types"
import { DOCTOR_PRESCRIPTION_STATUS_LABELS } from "@/features/hospital-operations/utils/doctor-prescription.utils"
import { cn } from "@/lib/utils"

const styles: Record<DoctorPrescriptionStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  submitted: "border-sky-200 bg-sky-50 text-sky-700",
  returned: "border-amber-200 bg-amber-50 text-amber-800",
  finalized: "border-emerald-200 bg-emerald-50 text-emerald-800",
  voided: "border-rose-200 bg-rose-50 text-rose-700",
}

export function DoctorPrescriptionStatusBadge({ status }: { status: DoctorPrescriptionStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", styles[status])}>
      {DOCTOR_PRESCRIPTION_STATUS_LABELS[status]}
    </span>
  )
}
