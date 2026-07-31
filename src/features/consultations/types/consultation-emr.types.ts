export const CONSULTATION_SOAP_NOTE_STATUSES = [
  "draft",
  "finalized",
] as const

export type ConsultationSoapNoteStatus =
  (typeof CONSULTATION_SOAP_NOTE_STATUSES)[number]

export const CONSULTATION_SOAP_REVISION_ACTIONS = [
  "created",
  "saved",
  "finalized",
  "amended",
] as const

export type ConsultationSoapRevisionAction =
  (typeof CONSULTATION_SOAP_REVISION_ACTIONS)[number]

export interface ConsultationSoapNote {
  id: string
  consultationId: string
  patientId: string

  subjective: string
  objective: string
  assessment: string
  plan: string

  status: ConsultationSoapNoteStatus
  version: number

  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string

  finalizedBy: string | null
  finalizedAt: string | null
}

export interface ConsultationSoapNoteRevision {
  id: string
  soapNoteId: string
  consultationId: string
  patientId: string

  version: number
  action: ConsultationSoapRevisionAction

  subjective: string
  objective: string
  assessment: string
  plan: string

  changedBy: string
  changedAt: string
}
