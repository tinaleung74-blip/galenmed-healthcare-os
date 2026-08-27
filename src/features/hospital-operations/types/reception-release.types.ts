import type {
  LaboratoryResultMetadata,
} from "@/features/hospital-operations/types/laboratory-result.types"

export const RECEPTION_DOCUMENT_TYPES = [
  "prescription",
  "laboratory_result",
  "radiology_report",
  "consultation_summary",
  "diagnosis_summary",
  "medical_certificate",
  "official_receipt",
  "other",
] as const

export type ReceptionDocumentType =
  (typeof RECEPTION_DOCUMENT_TYPES)[number]

export const RECEPTION_DOCUMENT_STATUSES = [
  "finalized",
  "corrected",
] as const

export type ReceptionDocumentStatus =
  (typeof RECEPTION_DOCUMENT_STATUSES)[number]

export const RECEPTION_RELEASE_STATUSES = [
  "not_ready",
  "payment_pending",
  "ready",
  "released",
  "blocked",
  "voided",
] as const

export type ReceptionReleaseStatus =
  (typeof RECEPTION_RELEASE_STATUSES)[number]

export const RECEPTION_PAYMENT_STATUSES = [
  "pending",
  "partially_cleared",
  "cleared",
  "waived",
  "blocked",
  "revoked",
] as const

export type ReceptionPaymentStatus =
  (typeof RECEPTION_PAYMENT_STATUSES)[number]

export const RECEPTION_RELEASE_METHODS = [
  "physical_print",
  "patient_portal",
  "email",
  "digital_download",
  "other",
] as const

export type ReceptionReleaseMethod =
  (typeof RECEPTION_RELEASE_METHODS)[number]

export const RECEPTION_PRINT_PURPOSES = [
  "patient_original",
  "patient_copy",
  "admin_copy",
  "reprint",
] as const

export type ReceptionPrintPurpose =
  (typeof RECEPTION_PRINT_PURPOSES)[number]

export interface ReceptionReleasePatient {
  id: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex: string
}

export interface ReceptionDocumentReleaseRecord {
  id: string
  releaseNumber: string
  releaseMethod: ReceptionReleaseMethod
  recipientName: string
  recipientRelationship: string | null
  recipientIdentifierMasked: string | null
  copyNumber: number
  releasedAt: string
  notes: string | null
}

export interface ReceptionDocumentPrintLog {
  id: number
  releaseRecordId: string | null
  printPurpose: ReceptionPrintPurpose
  copyNumber: number
  printedAt: string
  printReason: string | null
}

export interface ReceptionReleaseItem {
  documentId: string
  documentNumber: string
  documentType: ReceptionDocumentType
  title: string
  sourceModule: string
  versionNumber: number
  documentStatus: ReceptionDocumentStatus
  sensitivity: string
  paymentRequired: boolean
  finalizedAt: string | null
  createdAt: string
  updatedAt: string

  patient: ReceptionReleasePatient

  visitId: string
  visitNumber: string
  branchId: string
  branchName: string

  serviceRequestId: string | null
  requestNumber: string | null
  serviceType: string | null
  serviceName: string | null

  paymentClearanceId: string | null
  paymentStatus: ReceptionPaymentStatus | null
  requiredAmountCentavos: number
  clearedAmountCentavos: number
  paymentClearedAt: string | null
  paymentReason: string | null

  releaseClearanceId: string | null
  releaseStatus: ReceptionReleaseStatus
  clinicalReadyAt: string | null
  readyAt: string | null
  releasedAt: string | null
  blockedReason: string | null

  laboratoryResult: LaboratoryResultMetadata | null
  rawMetadata: unknown

  releaseRecords: ReceptionDocumentReleaseRecord[]
  printLogs: ReceptionDocumentPrintLog[]
}

export interface ReceptionReleaseCenterPageData {
  items: ReceptionReleaseItem[]
}

export interface ReceptionReleaseMutationResponse {
  releaseRecordId: string
  releaseNumber: string
  documentId: string
  releaseMethod: ReceptionReleaseMethod
  copyNumber: number
  releasedAt: string
  idempotentReplay: boolean
}

export interface ReceptionPrintMutationResponse {
  printLogId: number
  documentId: string
  printPurpose: ReceptionPrintPurpose
  copyNumber: number
  printedAt: string
  idempotentReplay: boolean
}

export interface ReceptionReleaseActionResult<
  Data = undefined,
> {
  success: boolean
  message: string
  data?: Data
}
