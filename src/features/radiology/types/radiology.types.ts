export const RADIOLOGY_ORDER_STATUSES = [
  "ordered",
  "scheduled",
  "checked-in",
  "ready",
  "in-progress",
  "images-acquired",
  "technically-completed",
  "report-draft",
  "verified",
  "released",
  "cancelled",
  "no-show",
] as const

export type RadiologyOrderStatus =
  (typeof RADIOLOGY_ORDER_STATUSES)[number]

export const RADIOLOGY_ORDER_PRIORITIES = [
  "routine",
  "urgent",
  "stat",
] as const

export type RadiologyOrderPriority =
  (typeof RADIOLOGY_ORDER_PRIORITIES)[number]

export const RADIOLOGY_ORDER_SOURCES = [
  "consultation",
  "outpatient",
  "inpatient",
  "emergency",
  "external-referral",
] as const

export type RadiologyOrderSource =
  (typeof RADIOLOGY_ORDER_SOURCES)[number]

export const RADIOLOGY_MODALITIES = [
  "x-ray",
  "ultrasound",
  "ct",
  "mri",
  "mammography",
] as const

export type RadiologyModality =
  (typeof RADIOLOGY_MODALITIES)[number]

export const RADIOLOGY_CONTRAST_PROTOCOLS = [
  "not-required",
  "without-contrast",
  "with-contrast",
  "with-and-without-contrast",
] as const

export type RadiologyContrastProtocol =
  (typeof RADIOLOGY_CONTRAST_PROTOCOLS)[number]

export const RADIOLOGY_DATE_VIEWS = [
  "day",
  "next-7-days",
  "all",
] as const

export type RadiologyDateView =
  (typeof RADIOLOGY_DATE_VIEWS)[number]

export interface RadiologyPreparationItemDefinition {
  code: string
  label: string
  required: boolean
}

export interface RadiologyPreparationChecklistItem {
  id: string
  code: string
  label: string
  required: boolean

  completed: boolean
  completedAt: string | null
  completedBy: string | null

  notes: string | null
}

export interface RadiologyProcedureDefinition {
  code: string
  name: string

  modality: RadiologyModality
  bodyRegion: string

  defaultDurationMinutes: number

  contrastProtocol:
    RadiologyContrastProtocol

  requiresFasting: boolean
  requiresPregnancyScreening: boolean
  requiresRenalFunctionReview: boolean

  preparationItems:
    readonly RadiologyPreparationItemDefinition[]
}

export interface RadiologyRoomDefinition {
  id: string
  name: string

  branchId: string

  supportedModalities:
    readonly RadiologyModality[]
}

export interface RadiologyOrder {
  id: string
  orderNumber: string

  patientId: string

  consultationId: string | null
  consultationNumber: string | null

  branchId: string
  branchName: string

  orderedByName: string

  priority: RadiologyOrderPriority
  source: RadiologyOrderSource
  status: RadiologyOrderStatus

  procedureCode: string
  procedureName: string

  modality: RadiologyModality
  bodyRegion: string

  contrastProtocol:
    RadiologyContrastProtocol

  clinicalIndication: string
  specialInstructions: string | null

  requiresFasting: boolean
  requiresPregnancyScreening: boolean
  requiresRenalFunctionReview: boolean

  preparationChecklist:
    RadiologyPreparationChecklistItem[]

  scheduledStartAt: string | null
  scheduledEndAt: string | null
  durationMinutes: number | null

  roomId: string | null
  roomName: string | null

  schedulingNotes: string | null

  checkedInAt: string | null
  checkedInBy: string | null

  readyAt: string | null
  readyBy: string | null

  imagingStartedAt: string | null
  imagingStartedBy: string | null

  imagesAcquiredAt: string | null
  imagesAcquiredBy: string | null

  technicalCompletedAt: string | null
  technicalCompletedBy: string | null

  reportId: string | null

  cancelledAt: string | null
  cancelledBy: string | null
  cancellationReason: string | null

  noShowAt: string | null
  noShowMarkedBy: string | null

  createdAt: string
  updatedAt: string
  updatedBy: string
}

export interface RadiologyOrderFilters {
  search: string

  status:
    | RadiologyOrderStatus
    | "all"

  priority:
    | RadiologyOrderPriority
    | "all"

  modality:
    | RadiologyModality
    | "all"

  source:
    | RadiologyOrderSource
    | "all"

  branchId: string | "all"

  dateView: RadiologyDateView
  selectedDate: string
}
