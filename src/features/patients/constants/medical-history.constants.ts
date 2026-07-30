import type {
  MedicalConditionClinicalStatus,
  MedicalHistoryFilters,
  MedicalHistoryRecordStatus,
  MedicalHistorySource,
  MedicalHistoryVerificationStatus,
} from "@/features/patients/types/medical-history.types"

export const MEDICAL_CONDITION_STATUS_LABELS: Record<
  MedicalConditionClinicalStatus,
  string
> = {
  active: "Active",
  inactive: "Inactive",
  resolved: "Resolved",
}

export const MEDICAL_HISTORY_VERIFICATION_LABELS: Record<
  MedicalHistoryVerificationStatus,
  string
> = {
  confirmed: "Confirmed",
  provisional: "Provisional",
  "patient-reported": "Patient-reported",
}

export const MEDICAL_HISTORY_SOURCE_LABELS: Record<
  MedicalHistorySource,
  string
> = {
  patient: "Patient",
  clinician: "Clinician",
  "external-record": "External record",
  "family-member": "Family member",
}

export const MEDICAL_HISTORY_RECORD_STATUS_LABELS: Record<
  MedicalHistoryRecordStatus,
  string
> = {
  current: "Current",
  archived: "Archived",
}

export const DEFAULT_MEDICAL_HISTORY_FILTERS: MedicalHistoryFilters = {
  search: "",
  clinicalStatus: "all",
  verificationStatus: "all",
  recordStatus: "current",
}

export const MOCK_CLINICAL_ACTOR = "Dr. Maria Santos"
