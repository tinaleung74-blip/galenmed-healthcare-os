export const DOCTOR_PRESCRIPTION_STATUSES = [
  "draft",
  "submitted",
  "returned",
  "finalized",
  "voided",
] as const

export type DoctorPrescriptionStatus =
  (typeof DOCTOR_PRESCRIPTION_STATUSES)[number]

export interface DoctorPrescriptionItem {
  id: string
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

export interface DoctorPrescriptionQueueRecord {
  consultationId: string
  consultationNumber: string
  consultationStatus: "in_progress" | "completed" | "cancelled"
  serviceRequestId: string
  patientId: string
  patientName: string
  medicalRecordNumber: string
  visitNumber: string
  branchName: string
  diagnosisCode: string | null
  diagnosisText: string | null
  completedAt: string | null
  prescriptionId: string | null
  prescriptionNumber: string | null
  prescriptionStatus: DoctorPrescriptionStatus | null
  prescriptionRevision: number | null
  prescriptionUpdatedAt: string | null
  clinicalDocumentId: string | null
}

export interface DoctorPrescriptionWorkspaceData {
  consultation: {
    id: string
    consultationNumber: string
    status: "in_progress" | "completed" | "cancelled"
    diagnosisCode: string | null
    diagnosisText: string | null
    treatmentPlan: string | null
    completedAt: string | null
  }
  patient: {
    id: string
    medicalRecordNumber: string
    firstName: string
    middleName: string | null
    lastName: string
    dateOfBirth: string
    biologicalSex: string
  }
  visit: {
    id: string
    visitNumber: string
  }
  branch: {
    id: string
    code: string
    name: string
  }
  doctor: {
    id: string
    employeeId: string | null
    fullName: string
    jobTitle: string | null
  }
  prescription: {
    id: string
    prescriptionNumber: string
    status: DoctorPrescriptionStatus
    diagnosisCode: string | null
    diagnosisText: string
    generalInstructions: string | null
    revisionNumber: number
    submittedAt: string | null
    returnReason: string | null
    approvedAt: string | null
    approvalNotes: string | null
    clinicalDocumentId: string | null
    updatedAt: string
    items: DoctorPrescriptionItem[]
  } | null
}

export interface PrescriptionReviewHistoryItem {
  id: string
  action: "submitted" | "returned_for_correction" | "approved_for_release"
  actorUserId: string
  reason: string | null
  createdAt: string
}

export interface ReceptionPrescriptionReviewRecord {
  prescriptionId: string
  prescriptionNumber: string
  status: DoctorPrescriptionStatus
  revisionNumber: number
  diagnosisCode: string | null
  diagnosisText: string
  generalInstructions: string | null
  submittedAt: string | null
  returnReason: string | null
  approvedAt: string | null
  approvalNotes: string | null
  clinicalDocumentId: string | null
  patientId: string
  patientName: string
  medicalRecordNumber: string
  dateOfBirth: string
  biologicalSex: string
  visitNumber: string
  requestNumber: string
  consultationNumber: string
  branchId: string
  branchName: string
  doctorName: string
  doctorJobTitle: string | null
  documentNumber: string | null
  documentStatus: string | null
  releaseStatus: string | null
  items: DoctorPrescriptionItem[]
  reviewHistory: PrescriptionReviewHistoryItem[]
}

export interface DoctorPrescriptionMutationResponse {
  prescriptionId: string
  prescriptionNumber: string
  status: DoctorPrescriptionStatus
  clinicalDocumentId?: string
  releaseStatus?: string
  idempotentReplay: boolean
}

export interface DoctorPrescriptionActionResult<Data = undefined> {
  success: boolean
  message: string
  data?: Data
}
