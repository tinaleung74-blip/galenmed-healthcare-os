import type {
  ConsultationDiagnosisRecordStatus,
  ConsultationDiagnosisRole,
  ConsultationDiagnosisVerificationStatus,
} from "@/features/consultations/types/consultation-diagnosis.types"

export const CONSULTATION_DIAGNOSIS_ROLE_LABELS: Record<
  ConsultationDiagnosisRole,
  string
> = {
  primary: "Primary diagnosis",
  secondary: "Secondary diagnosis",
  differential: "Differential diagnosis",
}

export const CONSULTATION_DIAGNOSIS_VERIFICATION_LABELS: Record<
  ConsultationDiagnosisVerificationStatus,
  string
> = {
  provisional: "Provisional",
  confirmed: "Confirmed",
  refuted: "Refuted",
}

export const CONSULTATION_DIAGNOSIS_RECORD_STATUS_LABELS: Record<
  ConsultationDiagnosisRecordStatus,
  string
> = {
  current: "Current",
  archived: "Archived",
}

export const CONSULTATION_DIAGNOSIS_CODE_SYSTEM =
  "ICD-10" as const
