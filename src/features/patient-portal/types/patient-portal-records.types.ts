export const PATIENT_PORTAL_DOCUMENT_TYPES = [
  "prescription",
  "laboratory_result",
  "radiology_report",
  "consultation_summary",
  "diagnosis_summary",
  "medical_certificate",
  "official_receipt",
  "other",
] as const

export type PatientPortalDocumentType =
  (typeof PATIENT_PORTAL_DOCUMENT_TYPES)[number]

export interface PatientPortalPrescriptionItem {
  id: string | null
  sequence: number
  genericName: string
  brandName: string | null
  dosageForm: string
  strength: string
  dose: string
  route: string
  frequency: string
  duration: string
  quantity: number
  quantityUnit: string
  instructions: string | null
}

export interface PatientPortalPrescriptionContent {
  kind: "prescription"
  prescriptionNumber: string | null
  diagnosisCode: string | null
  diagnosisText: string | null
  generalInstructions: string | null
  doctor: {
    fullName: string | null
    employeeId: string | null
    jobTitle: string | null
  }
  items: PatientPortalPrescriptionItem[]
}

export interface PatientPortalLaboratoryResultItem {
  testName: string
  resultValue: string
  unit: string | null
  referenceRange: string | null
  flag: string
}

export interface PatientPortalLaboratoryContent {
  kind: "laboratory_result"
  specimenType: string | null
  collectionReference: string | null
  resultItems: PatientPortalLaboratoryResultItem[]
  interpretation: string | null
}

export interface PatientPortalGenericDocumentContent {
  kind: "generic"
  summary: string | null
}

export type PatientPortalDocumentContent =
  | PatientPortalPrescriptionContent
  | PatientPortalLaboratoryContent
  | PatientPortalGenericDocumentContent

export interface PatientPortalReleasedDocument {
  id: string
  documentNumber: string
  documentType: PatientPortalDocumentType
  title: string
  versionNumber: number
  status: string
  paymentRequired: boolean
  paymentStatus: string
  releaseStatus: string
  releaseNumber: string
  releaseMethod: string
  releasedAt: string
  finalizedAt: string | null
  finalizedByName: string | null
  visitNumber: string
  serviceRequestNumber: string | null
  branchName: string
  content: PatientPortalDocumentContent
}

export interface PatientPortalReleasedDocumentsData {
  documents: PatientPortalReleasedDocument[]
}

export interface PatientPortalBillingCharge {
  id: string
  description: string
  quantity: number
  unitAmountCentavos: number
  totalAmountCentavos: number
  status: string
  postedAt: string
  serviceRequestNumber: string | null
  serviceName: string | null
}

export interface PatientPortalPayment {
  id: string
  paymentNumber: string
  amountCentavos: number
  paymentMethod: string
  status: string
  externalReference: string | null
  officialReceiptNumber: string | null
  postedAt: string
}

export interface PatientPortalPaymentClearance {
  id: string
  serviceRequestNumber: string
  serviceName: string | null
  clearanceStatus: string
  requiredAmountCentavos: number
  clearedAmountCentavos: number
  clearedAt: string | null
}

export interface PatientPortalBillingAccount {
  id: string
  billingNumber: string
  status: string
  currencyCode: string
  grossAmountCentavos: number
  discountAmountCentavos: number
  coverageAmountCentavos: number
  paidAmountCentavos: number
  refundedAmountCentavos: number
  balanceAmountCentavos: number
  createdAt: string
  updatedAt: string
  visit: {
    id: string
    visitNumber: string
    status: string
    registeredAt: string
  }
  branch: {
    id: string
    code: string
    name: string
  }
  charges: PatientPortalBillingCharge[]
  payments: PatientPortalPayment[]
  clearances: PatientPortalPaymentClearance[]
}

export interface PatientPortalBillingData {
  totalOutstandingCentavos: number
  totalPaidCentavos: number
  accounts: PatientPortalBillingAccount[]
}

export interface PatientPortalDashboardData {
  releasedPrescriptionsCount: number
  releasedLaboratoryResultsCount: number
  outstandingBalanceCentavos: number
  openBillingAccountsCount: number
  recentDocuments: PatientPortalReleasedDocument[]
}

export interface PatientPortalRecordActionResult {
  success: boolean
  message: string
}
