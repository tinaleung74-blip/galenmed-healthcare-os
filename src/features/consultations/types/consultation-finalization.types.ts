export const CONSULTATION_FOLLOW_UP_DISPOSITIONS = [
  "none",
  "scheduled",
  "as-needed",
  "external-referral",
] as const

export type ConsultationFollowUpDisposition =
  (typeof CONSULTATION_FOLLOW_UP_DISPOSITIONS)[number]

export const CONSULTATION_FOLLOW_UP_MODES = [
  "in-person",
  "telemedicine",
] as const

export type ConsultationFollowUpMode =
  (typeof CONSULTATION_FOLLOW_UP_MODES)[number]

export const CONSULTATION_FINALIZATION_STATUSES = [
  "draft",
  "finalized",
] as const

export type ConsultationFinalizationStatus =
  (typeof CONSULTATION_FINALIZATION_STATUSES)[number]

export const CONSULTATION_SIGNATURE_METHODS = [
  "typed-name",
] as const

export type ConsultationSignatureMethod =
  (typeof CONSULTATION_SIGNATURE_METHODS)[number]

export const CONSULTATION_FINALIZATION_REVISION_ACTIONS = [
  "created",
  "saved",
  "finalized",
  "amended",
] as const

export type ConsultationFinalizationRevisionAction =
  (typeof CONSULTATION_FINALIZATION_REVISION_ACTIONS)[number]

export interface ConsultationSignatureMetadata {
  signerName: string
  signerRole: string
  professionalRegistrationNumber: string
  signatureMethod: ConsultationSignatureMethod
  attestationText: string
  signedAt: string
}

export interface ConsultationFinalizationRecord {
  id: string
  consultationId: string
  patientId: string

  followUpDisposition:
    ConsultationFollowUpDisposition

  followUpDate: string | null
  followUpMode: ConsultationFollowUpMode | null
  followUpReason: string | null

  patientInstructions: string
  returnPrecautions: string

  referralFacility: string | null
  referralProvider: string | null
  referralReason: string | null

  status: ConsultationFinalizationStatus
  version: number

  signature: ConsultationSignatureMetadata | null

  createdBy: string
  createdAt: string

  updatedBy: string
  updatedAt: string

  finalizedBy: string | null
  finalizedAt: string | null
}

export interface ConsultationFinalizationRevision {
  id: string
  finalizationRecordId: string
  consultationId: string
  patientId: string

  version: number
  action: ConsultationFinalizationRevisionAction

  followUpDisposition:
    ConsultationFollowUpDisposition

  followUpDate: string | null
  followUpMode: ConsultationFollowUpMode | null
  followUpReason: string | null

  patientInstructions: string
  returnPrecautions: string

  referralFacility: string | null
  referralProvider: string | null
  referralReason: string | null

  changedBy: string
  changedAt: string
}
