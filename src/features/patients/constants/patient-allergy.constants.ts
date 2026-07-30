import type {
  AllergyCategory,
  AllergyClinicalStatus,
  AllergyCriticality,
  AllergyInformationSource,
  AllergyIntoleranceType,
  AllergyReactionSeverity,
  AllergyRecordStatus,
  AllergyVerificationStatus,
  PatientAllergyFilters,
} from "@/features/patients/types/patient-allergy.types"

export const ALLERGY_INTOLERANCE_TYPE_LABELS: Record<
  AllergyIntoleranceType,
  string
> = {
  allergy: "Allergy",
  intolerance: "Intolerance",
}

export const ALLERGY_CATEGORY_LABELS: Record<
  AllergyCategory,
  string
> = {
  medication: "Medication",
  food: "Food",
  environment: "Environmental",
  biologic: "Biologic",
}

export const ALLERGY_CLINICAL_STATUS_LABELS: Record<
  AllergyClinicalStatus,
  string
> = {
  active: "Active",
  inactive: "Inactive",
  resolved: "Resolved",
}

export const ALLERGY_VERIFICATION_STATUS_LABELS: Record<
  AllergyVerificationStatus,
  string
> = {
  unconfirmed: "Unconfirmed",
  presumed: "Presumed",
  confirmed: "Confirmed",
  refuted: "Refuted",
}

export const ALLERGY_CRITICALITY_LABELS: Record<
  AllergyCriticality,
  string
> = {
  low: "Low criticality",
  high: "High criticality",
  "unable-to-assess": "Unable to assess",
}

export const ALLERGY_REACTION_SEVERITY_LABELS: Record<
  AllergyReactionSeverity,
  string
> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
}

export const ALLERGY_INFORMATION_SOURCE_LABELS: Record<
  AllergyInformationSource,
  string
> = {
  patient: "Patient",
  clinician: "Clinician",
  "external-record": "External record",
  "family-member": "Family member",
}

export const ALLERGY_RECORD_STATUS_LABELS: Record<
  AllergyRecordStatus,
  string
> = {
  current: "Current",
  archived: "Archived",
}

export const DEFAULT_PATIENT_ALLERGY_FILTERS: PatientAllergyFilters =
  {
    search: "",
    category: "all",
    clinicalStatus: "all",
    verificationStatus: "all",
    recordStatus: "current",
  }

export const ALLERGY_MOCK_CLINICAL_ACTOR =
  "Dr. Maria Santos"
