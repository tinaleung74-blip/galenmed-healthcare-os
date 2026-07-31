import type {
  ConsultationFinalizationRevisionAction,
  ConsultationFinalizationStatus,
  ConsultationFollowUpDisposition,
  ConsultationFollowUpMode,
  ConsultationSignatureMethod,
} from "@/features/consultations/types/consultation-finalization.types"

export const CONSULTATION_FOLLOW_UP_DISPOSITION_LABELS: Record<
  ConsultationFollowUpDisposition,
  string
> = {
  none: "No scheduled follow-up",
  scheduled: "Scheduled follow-up",
  "as-needed": "Follow-up as needed",
  "external-referral": "External referral",
}

export const CONSULTATION_FOLLOW_UP_MODE_LABELS: Record<
  ConsultationFollowUpMode,
  string
> = {
  "in-person": "In person",
  telemedicine: "Telemedicine",
}

export const CONSULTATION_FINALIZATION_STATUS_LABELS: Record<
  ConsultationFinalizationStatus,
  string
> = {
  draft: "Draft",
  finalized: "Finalized",
}

export const CONSULTATION_SIGNATURE_METHOD_LABELS: Record<
  ConsultationSignatureMethod,
  string
> = {
  "typed-name": "Typed-name attestation",
}

export const CONSULTATION_FINALIZATION_REVISION_ACTION_LABELS: Record<
  ConsultationFinalizationRevisionAction,
  string
> = {
  created: "Follow-up draft created",
  saved: "Follow-up draft saved",
  finalized: "Encounter finalized",
  amended: "Finalized encounter amended",
}

export const CONSULTATION_CLINICAL_ATTESTATION_TEXT =
  "I attest that I reviewed this encounter documentation and that it accurately reflects the care documented in this development record."
