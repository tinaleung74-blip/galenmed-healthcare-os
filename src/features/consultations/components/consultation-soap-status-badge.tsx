import {
  CONSULTATION_SOAP_NOTE_STATUS_LABELS,
} from "@/features/consultations/constants/consultation-emr.constants"
import type { ConsultationSoapNoteStatus } from "@/features/consultations/types/consultation-emr.types"
import { cn } from "@/lib/utils"

const soapStatusStyles: Record<
  ConsultationSoapNoteStatus,
  string
> = {
  draft:
    "border-amber-200 bg-amber-50 text-amber-700",
  finalized:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
}

interface ConsultationSoapStatusBadgeProps {
  status: ConsultationSoapNoteStatus
}

export function ConsultationSoapStatusBadge({
  status,
}: ConsultationSoapStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        soapStatusStyles[status]
      )}
    >
      {
        CONSULTATION_SOAP_NOTE_STATUS_LABELS[
          status
        ]
      }
    </span>
  )
}
