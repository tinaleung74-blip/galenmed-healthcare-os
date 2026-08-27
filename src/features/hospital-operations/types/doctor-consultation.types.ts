export const DOCTOR_QUEUE_STATUSES = [
  "waiting",
  "called",
  "in_service",
  "completed",
  "no_show",
  "cancelled",
] as const

export type DoctorQueueStatus =
  (typeof DOCTOR_QUEUE_STATUSES)[number]

export const DOCTOR_REQUEST_STATUSES = [
  "requested",
  "queued",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
] as const

export type DoctorRequestStatus =
  (typeof DOCTOR_REQUEST_STATUSES)[number]

export const DOCTOR_CONSULTATION_STATUSES = [
  "in_progress",
  "completed",
  "cancelled",
] as const

export type DoctorConsultationStatus =
  (typeof DOCTOR_CONSULTATION_STATUSES)[number]

export const DOCTOR_PRIORITIES = [
  "routine",
  "urgent",
  "stat",
  "emergency",
] as const

export type DoctorPriority =
  (typeof DOCTOR_PRIORITIES)[number]

export interface DoctorBranchOption {
  id: string
  code: string
  name: string
  isPrimary: boolean
}

export interface DoctorAssignmentOption {
  id: string
  employeeId: string | null
  fullName: string
  jobTitle: string | null
  branches: DoctorBranchOption[]
}

export interface ReceptionDoctorAssignmentRequest {
  serviceRequestId: string
  requestNumber: string
  patientId: string
  patientName: string
  medicalRecordNumber: string
  visitNumber: string
  branchId: string
  branchName: string
  priority: DoctorPriority
  requestStatus: DoctorRequestStatus
  queueNumber: string | null
  queueStatus: DoctorQueueStatus | null
  assignedDoctorId: string | null
  assignedDoctorName: string | null
  requestedAt: string
}

export interface ReceptionDoctorAssignmentPageData {
  doctors: DoctorAssignmentOption[]
  requests: ReceptionDoctorAssignmentRequest[]
}

export interface DoctorQueueRecord {
  serviceRequestId: string
  requestNumber: string
  patientId: string
  patientName: string
  medicalRecordNumber: string
  dateOfBirth: string
  biologicalSex: string
  visitNumber: string
  chiefConcern: string | null
  branchId: string
  branchName: string
  priority: DoctorPriority
  requestStatus: DoctorRequestStatus
  queueId: string | null
  queueNumber: string | null
  queueStatus: DoctorQueueStatus | null
  calledAt: string | null
  serviceStartedAt: string | null
  consultationId: string | null
  consultationNumber: string | null
  consultationStatus: DoctorConsultationStatus | null
  startedAt: string | null
  completedAt: string | null
  requestedAt: string
}

export interface DoctorConsultationRequestDetails {
  id: string
  requestNumber: string
  status: DoctorRequestStatus
  priority: DoctorPriority
  requestNotes: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export interface DoctorPatientDetails {
  id: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex: string
  mobileNumber: string | null
  emailAddress: string | null
  address: string
  emergencyContactName: string
  emergencyContactNumber: string
  status: string
}

export interface DoctorVisitDetails {
  id: string
  visitNumber: string
  arrivalMode: string
  initialServiceType: string
  chiefConcern: string | null
  status: string
  registeredAt: string
  checkedInAt: string | null
}

export interface DoctorQueueDetails {
  id: string
  queueNumber: string
  queueSequence: number
  priority: DoctorPriority
  status: DoctorQueueStatus
  calledAt: string | null
  serviceStartedAt: string | null
  serviceCompletedAt: string | null
}

export interface DoctorConsultationDetails {
  id: string
  consultationNumber: string
  status: DoctorConsultationStatus
  chiefComplaint: string | null
  historyOfPresentIllness: string | null
  physicalExamination: string | null
  assessment: string | null
  diagnosisCode: string | null
  diagnosisText: string | null
  treatmentPlan: string | null
  clinicalNotes: string | null
  revisionNumber: number
  startedAt: string
  completedAt: string | null
  summaryDocumentId: string | null
  updatedAt: string
}

export interface DoctorClinicalDocument {
  id: string
  documentNumber: string
  documentType: string
  title: string
  status: string
  versionNumber: number
  finalizedAt: string | null
  metadata: Record<string, unknown>
}

export interface DoctorConsultationWorkspaceData {
  request: DoctorConsultationRequestDetails
  patient: DoctorPatientDetails
  visit: DoctorVisitDetails
  branch: {
    id: string
    code: string
    name: string
  }
  queue: DoctorQueueDetails
  consultation: DoctorConsultationDetails | null
  clinicalDocuments: DoctorClinicalDocument[]
}

export interface DoctorWorkflowActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

export interface StartedConsultationResult {
  consultationId: string
  consultationNumber: string
  status: DoctorConsultationStatus
}

export interface CompletedConsultationResult {
  consultationId: string
  consultationNumber: string
  status: DoctorConsultationStatus
  summaryDocumentId: string
  summaryDocumentNumber: string
}
