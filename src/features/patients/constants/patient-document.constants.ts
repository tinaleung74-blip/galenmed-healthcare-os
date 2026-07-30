import type {
  PatientDocumentCategory,
  PatientDocumentConfidentialityLevel,
  PatientDocumentFilters,
  PatientDocumentRecordStatus,
  PatientDocumentSource,
  PatientDocumentStatus,
  PatientDocumentVerificationStatus,
} from "@/features/patients/types/patient-document.types"

export const PATIENT_DOCUMENT_CATEGORY_LABELS: Record<
  PatientDocumentCategory,
  string
> = {
  identification: "Identification",
  consent: "Consent",
  referral: "Referral",
  insurance: "Insurance",
  clinical: "Clinical document",
  laboratory: "Laboratory",
  radiology: "Radiology",
  billing: "Billing",
  correspondence: "Correspondence",
  other: "Other",
}

export const PATIENT_DOCUMENT_STATUS_LABELS: Record<
  PatientDocumentStatus,
  string
> = {
  active: "Active",
  expired: "Expired",
  superseded: "Superseded",
  revoked: "Revoked",
}

export const PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS: Record<
  PatientDocumentVerificationStatus,
  string
> = {
  unverified: "Unverified",
  verified: "Verified",
  "needs-review": "Needs review",
  rejected: "Rejected",
}

export const PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS: Record<
  PatientDocumentConfidentialityLevel,
  string
> = {
  standard: "Standard",
  restricted: "Restricted",
  "highly-restricted": "Highly restricted",
}

export const PATIENT_DOCUMENT_SOURCE_LABELS: Record<
  PatientDocumentSource,
  string
> = {
  patient: "Patient",
  staff: "Staff",
  "external-facility": "External facility",
  "system-generated": "System-generated",
}

export const PATIENT_DOCUMENT_RECORD_STATUS_LABELS: Record<
  PatientDocumentRecordStatus,
  string
> = {
  current: "Current",
  archived: "Archived",
}

export const DEFAULT_PATIENT_DOCUMENT_FILTERS: PatientDocumentFilters =
  {
    search: "",
    category: "all",
    documentStatus: "all",
    verificationStatus: "all",
    confidentialityLevel: "all",
    recordStatus: "current",
  }

export const PATIENT_DOCUMENT_MOCK_ACTOR =
  "Dr. Maria Santos"
