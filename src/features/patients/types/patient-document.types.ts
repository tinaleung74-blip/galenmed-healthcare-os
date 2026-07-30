export const PATIENT_DOCUMENT_CATEGORIES = [
  "identification",
  "consent",
  "referral",
  "insurance",
  "clinical",
  "laboratory",
  "radiology",
  "billing",
  "correspondence",
  "other",
] as const

export type PatientDocumentCategory =
  (typeof PATIENT_DOCUMENT_CATEGORIES)[number]

export const PATIENT_DOCUMENT_STATUSES = [
  "active",
  "expired",
  "superseded",
  "revoked",
] as const

export type PatientDocumentStatus =
  (typeof PATIENT_DOCUMENT_STATUSES)[number]

export const PATIENT_DOCUMENT_VERIFICATION_STATUSES = [
  "unverified",
  "verified",
  "needs-review",
  "rejected",
] as const

export type PatientDocumentVerificationStatus =
  (typeof PATIENT_DOCUMENT_VERIFICATION_STATUSES)[number]

export const PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS = [
  "standard",
  "restricted",
  "highly-restricted",
] as const

export type PatientDocumentConfidentialityLevel =
  (typeof PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS)[number]

export const PATIENT_DOCUMENT_SOURCES = [
  "patient",
  "staff",
  "external-facility",
  "system-generated",
] as const

export type PatientDocumentSource =
  (typeof PATIENT_DOCUMENT_SOURCES)[number]

export const PATIENT_DOCUMENT_RECORD_STATUSES = [
  "current",
  "archived",
] as const

export type PatientDocumentRecordStatus =
  (typeof PATIENT_DOCUMENT_RECORD_STATUSES)[number]

export interface PatientDocumentRecord {
  id: string
  patientId: string

  title: string
  description: string | null
  category: PatientDocumentCategory
  documentStatus: PatientDocumentStatus
  verificationStatus: PatientDocumentVerificationStatus
  confidentialityLevel: PatientDocumentConfidentialityLevel

  issuedBy: string | null
  issueDate: string | null
  expirationDate: string | null

  fileName: string
  mimeType: string
  fileSizeBytes: number
  fileExtension: string

  binaryAvailable: boolean
  storageObjectKey: string | null

  versionNumber: number
  supersedesDocumentId: string | null

  source: PatientDocumentSource
  sourceDetails: string | null
  relatedEncounterReference: string | null
  verificationReference: string | null
  notes: string | null

  verifiedBy: string | null
  verifiedAt: string | null

  recordStatus: PatientDocumentRecordStatus

  uploadedBy: string
  uploadedAt: string
  updatedBy: string
  updatedAt: string

  archivedAt: string | null
  archivedBy: string | null
  archiveReason: string | null
}

export interface PatientDocumentFilters {
  search: string
  category: PatientDocumentCategory | "all"
  documentStatus: PatientDocumentStatus | "all"
  verificationStatus:
    | PatientDocumentVerificationStatus
    | "all"
  confidentialityLevel:
    | PatientDocumentConfidentialityLevel
    | "all"
  recordStatus: PatientDocumentRecordStatus | "all"
}
