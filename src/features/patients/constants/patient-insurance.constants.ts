import type {
  InsuranceCoverageStatus,
  InsuranceCoverageType,
  InsuranceInformationSource,
  InsurancePriority,
  InsuranceRecordStatus,
  InsuranceSubscriberRelationship,
  InsuranceVerificationStatus,
  PatientInsuranceFilters,
} from "@/features/patients/types/patient-insurance.types"

export const INSURANCE_COVERAGE_TYPE_LABELS: Record<
  InsuranceCoverageType,
  string
> = {
  hmo: "HMO",
  "private-insurance": "Private insurance",
  government: "Government coverage",
  "employer-sponsored": "Employer-sponsored",
  other: "Other coverage",
}

export const INSURANCE_COVERAGE_STATUS_LABELS: Record<
  InsuranceCoverageStatus,
  string
> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  expired: "Expired",
  cancelled: "Cancelled",
}

export const INSURANCE_VERIFICATION_STATUS_LABELS: Record<
  InsuranceVerificationStatus,
  string
> = {
  unverified: "Unverified",
  verified: "Verified",
  "needs-review": "Needs review",
  rejected: "Rejected",
}

export const INSURANCE_PRIORITY_LABELS: Record<
  InsurancePriority,
  string
> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
}

export const INSURANCE_SUBSCRIBER_RELATIONSHIP_LABELS: Record<
  InsuranceSubscriberRelationship,
  string
> = {
  self: "Self",
  spouse: "Spouse",
  child: "Child",
  parent: "Parent",
  guardian: "Guardian",
  other: "Other",
}

export const INSURANCE_INFORMATION_SOURCE_LABELS: Record<
  InsuranceInformationSource,
  string
> = {
  patient: "Patient",
  "insurance-card": "Insurance card",
  "payer-portal": "Payer portal",
  employer: "Employer",
  "external-record": "External record",
}

export const INSURANCE_RECORD_STATUS_LABELS: Record<
  InsuranceRecordStatus,
  string
> = {
  current: "Current",
  archived: "Archived",
}

export const DEFAULT_PATIENT_INSURANCE_FILTERS: PatientInsuranceFilters =
  {
    search: "",
    coverageType: "all",
    coverageStatus: "all",
    verificationStatus: "all",
    recordStatus: "current",
  }

export const INSURANCE_MOCK_CLINICAL_ACTOR =
  "Dr. Maria Santos"
