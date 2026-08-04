import type {
  RadiologyModality,
} from "@/features/radiology/types/radiology.types"

export const RADIOLOGY_REPORT_STATUSES = [
  "draft",
  "verified",
  "released",
] as const

export type RadiologyReportStatus =
  (typeof RADIOLOGY_REPORT_STATUSES)[number]

export const RADIOLOGY_FINDING_LEVELS = [
  "routine",
  "significant",
  "critical",
] as const

export type RadiologyFindingLevel =
  (typeof RADIOLOGY_FINDING_LEVELS)[number]

export const RADIOLOGY_CRITICAL_COMMUNICATION_METHODS = [
  "phone",
  "in-person",
  "secure-message",
  "emergency-escalation",
] as const

export type RadiologyCriticalCommunicationMethod =
  (typeof RADIOLOGY_CRITICAL_COMMUNICATION_METHODS)[number]

export interface RadiologyReportRecord {
  id: string

  orderId: string
  patientId: string

  procedureCode: string
  procedureName: string
  modality: RadiologyModality
  bodyRegion: string

  status: RadiologyReportStatus
  version: number

  findings: string
  impression: string
  recommendation: string | null

  findingLevel:
    RadiologyFindingLevel

  criticalFindingSummary:
    string | null

  criticalCommunicatedAt:
    string | null

  criticalCommunicatedBy:
    string | null

  criticalCommunicatedTo:
    string | null

  criticalCommunicationMethod:
    RadiologyCriticalCommunicationMethod | null

  criticalCommunicationNote:
    string | null

  draftedBy: string
  draftedAt: string

  verifiedBy: string | null
  verifiedAt: string | null

  radiologistRegistrationNumber:
    string | null

  verificationNote: string | null

  releasedBy: string | null
  releasedAt: string | null
  releaseNote: string | null

  createdAt: string
  updatedAt: string
}
