import type {
  ConsultationSoapNoteStatus,
  ConsultationSoapRevisionAction,
} from "@/features/consultations/types/consultation-emr.types"

export const CONSULTATION_SOAP_NOTE_STATUS_LABELS: Record<
  ConsultationSoapNoteStatus,
  string
> = {
  draft: "Draft",
  finalized: "Finalized",
}

export const CONSULTATION_SOAP_REVISION_ACTION_LABELS: Record<
  ConsultationSoapRevisionAction,
  string
> = {
  created: "Draft created",
  saved: "Draft saved",
  finalized: "Note finalized",
  amended: "Note amended",
}
