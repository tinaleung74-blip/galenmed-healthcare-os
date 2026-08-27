export const LABORATORY_RESULT_FLAGS = [
  "normal",
  "high",
  "low",
  "abnormal",
  "critical",
  "not_applicable",
] as const

export type LaboratoryResultFlag =
  (typeof LABORATORY_RESULT_FLAGS)[number]

export const LABORATORY_DOCUMENT_STATUSES = [
  "draft",
  "for_review",
  "finalized",
  "corrected",
  "superseded",
  "voided",
] as const

export type LaboratoryDocumentStatus =
  (typeof LABORATORY_DOCUMENT_STATUSES)[number]

export const LABORATORY_RELEASE_STATUSES = [
  "not_ready",
  "payment_pending",
  "ready",
  "released",
  "blocked",
  "voided",
] as const

export type LaboratoryReleaseStatus =
  (typeof LABORATORY_RELEASE_STATUSES)[number]

export const LABORATORY_PAYMENT_STATUSES = [
  "pending",
  "partially_cleared",
  "cleared",
  "waived",
  "blocked",
  "revoked",
] as const

export type LaboratoryPaymentStatus =
  (typeof LABORATORY_PAYMENT_STATUSES)[number]

export interface LaboratoryResultItem {
  id: string
  testName: string
  resultValue: string
  unit: string
  referenceRange: string
  flag: LaboratoryResultFlag
  remarks: string
}

export interface LaboratoryResultMetadata {
  schemaVersion: number
  specimenType: string
  collectionReference: string | null
  resultItems: LaboratoryResultItem[]
  interpretation: string | null
  notes: string | null
  entryStatus: string
  correctionReason: string | null
  verificationNotes: string | null
}

export interface LaboratoryResultPatient {
  id: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex: string
}

export interface LaboratoryResultWorkItem {
  serviceRequestId: string
  requestNumber: string
  requestStatus: string
  requestNotes: string | null
  priority: string
  branchId: string
  branchName: string
  visitId: string
  visitNumber: string
  queueNumber: string | null
  queueStatus: string | null
  patient: LaboratoryResultPatient
  serviceCode: string | null
  serviceName: string
  paymentStatus:
    LaboratoryPaymentStatus | null
  requiredAmountCentavos: number
  clearedAmountCentavos: number
  documentId: string | null
  documentNumber: string | null
  documentStatus:
    LaboratoryDocumentStatus | null
  documentTitle: string | null
  documentVersion: number | null
  createdBy: string | null
  finalizedBy: string | null
  finalizedAt: string | null
  documentUpdatedAt: string | null
  metadata: LaboratoryResultMetadata | null
  releaseStatus:
    LaboratoryReleaseStatus | null
}

export interface LaboratoryResultsPageData {
  workItems: LaboratoryResultWorkItem[]
}

export interface LaboratoryResultMutationResponse {
  documentId: string
  documentNumber: string
  status: LaboratoryDocumentStatus
  serviceRequestId: string | null
  versionNumber: number | null
  releaseStatus:
    LaboratoryReleaseStatus | null
  finalizedAt: string | null
  idempotentReplay: boolean
}

export interface LaboratoryResultActionResult<
  Data = undefined,
> {
  success: boolean
  message: string
  data?: Data
}
