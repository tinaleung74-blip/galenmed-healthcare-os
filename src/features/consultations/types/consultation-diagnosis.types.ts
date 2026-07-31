export const CONSULTATION_DIAGNOSIS_ROLES = [
  "primary",
  "secondary",
  "differential",
] as const

export type ConsultationDiagnosisRole =
  (typeof CONSULTATION_DIAGNOSIS_ROLES)[number]

export const CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES = [
  "provisional",
  "confirmed",
  "refuted",
] as const

export type ConsultationDiagnosisVerificationStatus =
  (typeof CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES)[number]

export const CONSULTATION_DIAGNOSIS_RECORD_STATUSES = [
  "current",
  "archived",
] as const

export type ConsultationDiagnosisRecordStatus =
  (typeof CONSULTATION_DIAGNOSIS_RECORD_STATUSES)[number]

export interface ConsultationDiagnosisRecord {
  id: string
  consultationId: string
  patientId: string

  diagnosisName: string
  icd10Code: string | null
  codeSystem: "ICD-10"

  role: ConsultationDiagnosisRole
  verificationStatus:
    ConsultationDiagnosisVerificationStatus

  onsetDate: string | null
  clinicalNotes: string | null

  recordStatus:
    ConsultationDiagnosisRecordStatus

  recordedBy: string
  recordedAt: string
  updatedBy: string
  updatedAt: string

  archivedAt: string | null
  archivedBy: string | null
  archiveReason: string | null
}
