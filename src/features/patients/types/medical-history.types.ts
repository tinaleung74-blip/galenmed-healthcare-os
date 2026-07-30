export const MEDICAL_CONDITION_CLINICAL_STATUSES = [
  "active",
  "inactive",
  "resolved",
] as const

export type MedicalConditionClinicalStatus =
  (typeof MEDICAL_CONDITION_CLINICAL_STATUSES)[number]

export const MEDICAL_HISTORY_VERIFICATION_STATUSES = [
  "confirmed",
  "provisional",
  "patient-reported",
] as const

export type MedicalHistoryVerificationStatus =
  (typeof MEDICAL_HISTORY_VERIFICATION_STATUSES)[number]

export const MEDICAL_HISTORY_SOURCES = [
  "patient",
  "clinician",
  "external-record",
  "family-member",
] as const

export type MedicalHistorySource =
  (typeof MEDICAL_HISTORY_SOURCES)[number]

export const MEDICAL_HISTORY_RECORD_STATUSES = [
  "current",
  "archived",
] as const

export type MedicalHistoryRecordStatus =
  (typeof MEDICAL_HISTORY_RECORD_STATUSES)[number]

export interface MedicalHistoryRecord {
  id: string
  patientId: string
  conditionName: string
  icd10Code: string | null
  clinicalStatus: MedicalConditionClinicalStatus
  verificationStatus: MedicalHistoryVerificationStatus
  onsetDate: string | null
  resolutionDate: string | null
  notes: string | null
  source: MedicalHistorySource
  sourceDetails: string | null
  recordStatus: MedicalHistoryRecordStatus
  recordedBy: string
  recordedAt: string
  updatedBy: string
  updatedAt: string
  archivedAt: string | null
  archivedBy: string | null
  archiveReason: string | null
}

export interface MedicalHistoryFilters {
  search: string
  clinicalStatus: MedicalConditionClinicalStatus | "all"
  verificationStatus: MedicalHistoryVerificationStatus | "all"
  recordStatus: MedicalHistoryRecordStatus | "all"
}
