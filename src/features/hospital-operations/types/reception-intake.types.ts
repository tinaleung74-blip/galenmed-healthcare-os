import type {
  HospitalServiceType,
} from "@/features/hospital-operations/types/service-catalog.types"

export const RECEPTION_ARRIVAL_MODES = [
  "walk_in",
  "appointment",
  "emergency",
  "admission",
  "follow_up",
  "other",
] as const

export type ReceptionArrivalMode =
  (typeof RECEPTION_ARRIVAL_MODES)[number]

export const RECEPTION_SERVICE_PRIORITIES = [
  "routine",
  "urgent",
  "stat",
  "emergency",
] as const

export type ReceptionServicePriority =
  (typeof RECEPTION_SERVICE_PRIORITIES)[number]

export const RECEPTION_VISIT_STATUSES = [
  "registered",
  "checked_in",
  "active",
  "completed",
  "cancelled",
] as const

export type ReceptionVisitStatus =
  (typeof RECEPTION_VISIT_STATUSES)[number]

export const RECEPTION_REQUEST_STATUSES = [
  "requested",
  "queued",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
] as const

export type ReceptionRequestStatus =
  (typeof RECEPTION_REQUEST_STATUSES)[number]

export const RECEPTION_QUEUE_STATUSES = [
  "waiting",
  "called",
  "in_service",
  "completed",
  "no_show",
  "cancelled",
] as const

export type ReceptionQueueStatus =
  (typeof RECEPTION_QUEUE_STATUSES)[number]

export interface ReceptionBranch {
  id: string
  code: string
  name: string
  isPrimary: boolean
}

export interface ReceptionPatientRecord {
  id: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex:
    | "male"
    | "female"
    | "intersex"
    | "unknown"
  mobileNumber: string | null
  emailAddress: string | null
  branchId: string
  branchName: string
  status:
    | "active"
    | "inactive"
    | "archived"
  createdAt: string
  updatedAt: string
}

export interface ReceptionVisitRecord {
  id: string
  visitNumber: string
  patientId: string
  branchId: string
  branchName: string
  arrivalMode: ReceptionArrivalMode
  initialServiceType: HospitalServiceType
  chiefConcern: string | null
  status: ReceptionVisitStatus
  registeredAt: string
  checkedInAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ReceptionServiceCatalogItem {
  id: string
  code: string
  name: string
  description: string | null
  serviceType: HospitalServiceType
  departmentId: string
  departmentCode: string
  departmentName: string
  branchId: string | null
  defaultPriceCentavos: number
  doctorOrderRequired: boolean
  allowsPatientRequest: boolean
}

export interface ReceptionServiceRequestRecord {
  id: string
  requestNumber: string
  visitId: string
  patientId: string
  branchId: string
  serviceCatalogItemId: string | null
  serviceName: string
  serviceType: HospitalServiceType
  departmentId: string
  departmentName: string
  priority: ReceptionServicePriority
  status: ReceptionRequestStatus
  queuedAt: string | null
  createdAt: string
  queueNumber: string | null
  queueStatus: ReceptionQueueStatus | null
  clearanceStatus: string | null
  requiredAmountCentavos: number
  clearedAmountCentavos: number
}

export interface ReceptionIntakePageData {
  branches: ReceptionBranch[]
  patients: ReceptionPatientRecord[]
  activeVisits: ReceptionVisitRecord[]
  catalogItems: ReceptionServiceCatalogItem[]
  activeRequests: ReceptionServiceRequestRecord[]
}

export interface RegisteredPatientResult {
  patientId: string
  medicalRecordNumber: string
  fullName: string
  status: string
  idempotentReplay: boolean
}

export interface CreatedVisitResult {
  visitId: string
  visitNumber: string
  visitStatus: ReceptionVisitStatus
  billingAccountId: string
  billingNumber: string
  idempotentReplay: boolean
}

export interface CheckedInVisitResult {
  visitId: string
  visitNumber: string
  status: ReceptionVisitStatus
  idempotentReplay: boolean
}

export interface CreatedServiceRequestResult {
  serviceRequestId: string
  requestNumber: string
  status: ReceptionRequestStatus
  serviceType: HospitalServiceType
  queueEntryId: string | null
  queueNumber: string | null
  billingAccountId: string
  billingNumber: string
  paymentClearanceId: string
  requiredAmountCentavos: number
  idempotentReplay: boolean
}

export interface ReceptionActionResult<
  Data = undefined,
> {
  success: boolean
  message: string
  data?: Data
}
