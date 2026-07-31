import {
  CONSULTATION_FINALIZATION_STATUS_LABELS,
} from "@/features/consultations/constants/consultation-finalization.constants"
import type { ConsultationFinalizationStatus } from "@/features/consultations/types/consultation-finalization.types"
import { cn } from "@/lib/utils"

const finalizationStatusStyles: Record<
  ConsultationFinalizationStatus,
  string
> = {
  draft:
    "border-amber-200 bg-amber-50 text-amber-700",

  finalized:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
}

interface ConsultationFinalizationStatusBadgeProps {
  status: ConsultationFinalizationStatus
}

export function ConsultationFinalizationStatusBadge({
  status,
}: ConsultationFinalizationStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        finalizationStatusStyles[status]
      )}
    >
      {
        CONSULTATION_FINALIZATION_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
