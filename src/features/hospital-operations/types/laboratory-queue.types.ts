export const LABORATORY_QUEUE_STATUSES = [
  "waiting",
  "called",
  "in_service",
  "completed",
  "no_show",
  "cancelled",
] as const

export type LaboratoryQueueStatus =
  (typeof LABORATORY_QUEUE_STATUSES)[number]

export const LABORATORY_QUEUE_PRIORITIES = [
  "routine",
  "urgent",
  "stat",
  "emergency",
] as const

export type LaboratoryQueuePriority =
  (typeof LABORATORY_QUEUE_PRIORITIES)[number]

export const LABORATORY_QUEUE_ACTIONS = [
  "call",
  "start",
  "complete",
  "no_show",
  "cancel",
] as const

export type LaboratoryQueueAction =
  (typeof LABORATORY_QUEUE_ACTIONS)[number]

export const LABORATORY_PAYMENT_CLEARANCE_STATUSES = [
  "pending",
  "partially_cleared",
  "cleared",
  "waived",
  "blocked",
  "revoked",
] as const

export type LaboratoryPaymentClearanceStatus =
  (typeof LABORATORY_PAYMENT_CLEARANCE_STATUSES)[number]

export interface LaboratoryQueueBranch {
  id: string
  code: string
  name: string
  isPrimary: boolean
}

export interface LaboratoryQueuePatient {
  id: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex: string
}

export interface LaboratoryQueueEntryRecord {
  id: string
  queueNumber: string
  queueDate: string
  queueSequence: number
  status: LaboratoryQueueStatus
  priority: LaboratoryQueuePriority
  calledAt: string | null
  serviceStartedAt: string | null
  serviceCompletedAt: string | null
  noShowAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string

  branchId: string
  branchName: string
  departmentId: string
  assignedStaffId: string | null

  serviceRequestId: string
  requestNumber: string
  requestStatus: string
  requestNotes: string | null
  doctorOrderRequired: boolean
  doctorOrderReference: string | null

  visitId: string
  visitNumber: string

  patient: LaboratoryQueuePatient

  serviceCatalogItemId: string | null
  serviceCode: string | null
  serviceName: string
  serviceDescription: string | null

  paymentClearanceStatus:
    LaboratoryPaymentClearanceStatus | null
  requiredAmountCentavos: number
  clearedAmountCentavos: number
}

export interface LaboratoryQueuePageData {
  branches: LaboratoryQueueBranch[]
  queueEntries: LaboratoryQueueEntryRecord[]
}

export interface LaboratoryQueueAdvanceResult {
  queueEntryId: string
  queueNumber: string | null
  queueStatus: LaboratoryQueueStatus
  serviceRequestStatus: string | null
  idempotentReplay: boolean
}

export interface LaboratoryQueueActionResult<
  Data = undefined,
> {
  success: boolean
  message: string
  data?: Data
}
