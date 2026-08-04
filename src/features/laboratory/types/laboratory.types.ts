export const LABORATORY_ORDER_STATUSES = [
  "ordered",
  "specimen-collected",
  "received",
  "in-process",
  "completed",
  "verified",
  "released",
  "rejected",
  "cancelled",
] as const

export type LaboratoryOrderStatus =
  (typeof LABORATORY_ORDER_STATUSES)[number]

export const LABORATORY_ORDER_PRIORITIES = [
  "routine",
  "urgent",
  "stat",
] as const

export type LaboratoryOrderPriority =
  (typeof LABORATORY_ORDER_PRIORITIES)[number]

export const LABORATORY_ORDER_SOURCES = [
  "consultation",
  "outpatient",
  "inpatient",
  "external-referral",
] as const

export type LaboratoryOrderSource =
  (typeof LABORATORY_ORDER_SOURCES)[number]

export const LABORATORY_SPECIMEN_TYPES = [
  "whole-blood",
  "serum",
  "plasma",
  "urine",
  "stool",
  "swab",
  "sputum",
  "tissue",
  "other",
] as const

export type LaboratorySpecimenType =
  (typeof LABORATORY_SPECIMEN_TYPES)[number]

export const LABORATORY_COLLECTION_METHODS = [
  "venipuncture",
  "capillary",
  "clean-catch-urine",
  "midstream-urine",
  "swab",
  "expectoration",
  "other",
] as const

export type LaboratoryCollectionMethod =
  (typeof LABORATORY_COLLECTION_METHODS)[number]

export const LABORATORY_SPECIMEN_STATUSES = [
  "collected",
  "received",
  "rejected",
] as const

export type LaboratorySpecimenStatus =
  (typeof LABORATORY_SPECIMEN_STATUSES)[number]

export const LABORATORY_ORDER_ITEM_STATUSES = [
  "pending",
  "in-process",
  "completed",
  "verified",
  "released",
  "cancelled",
] as const

export type LaboratoryOrderItemStatus =
  (typeof LABORATORY_ORDER_ITEM_STATUSES)[number]

export const LABORATORY_DATE_VIEWS = [
  "day",
  "last-7-days",
  "all",
] as const

export type LaboratoryDateView =
  (typeof LABORATORY_DATE_VIEWS)[number]

export interface LaboratoryTestDefinition {
  code: string
  name: string
  category: string

  specimenType: LaboratorySpecimenType
  defaultContainer: string

  estimatedTurnaroundMinutes: number
  requiresFasting: boolean
}

export interface LaboratoryOrderItem {
  id: string

  testCode: string
  testName: string
  category: string

  specimenType: LaboratorySpecimenType
  containerType: string

  estimatedTurnaroundMinutes: number

  status: LaboratoryOrderItemStatus
}

export interface LaboratorySpecimenRecord {
  id: string
  accessionNumber: string

  orderItemIds: string[]

  specimenType: LaboratorySpecimenType
  collectionMethod: LaboratoryCollectionMethod
  containerType: string

  status: LaboratorySpecimenStatus

  collectedAt: string
  collectedBy: string

  receivedAt: string | null
  receivedBy: string | null

  rejectedAt: string | null
  rejectedBy: string | null
  rejectionReason: string | null

  notes: string | null
}

export interface LaboratoryOrder {
  id: string
  orderNumber: string

  patientId: string

  consultationId: string | null
  consultationNumber: string | null

  branchId: string
  branchName: string

  orderedByName: string

  priority: LaboratoryOrderPriority
  source: LaboratoryOrderSource
  status: LaboratoryOrderStatus

  clinicalIndication: string

  fastingRequired: boolean

  patientInstructions: string | null
  internalNotes: string | null

  items: LaboratoryOrderItem[]
  specimens: LaboratorySpecimenRecord[]

  processingStartedAt: string | null
  processingStartedBy: string | null

  completedAt: string | null
  completedBy: string | null

  verifiedAt: string | null
  verifiedBy: string | null

  releasedAt: string | null
  releasedBy: string | null

  cancelledAt: string | null
  cancelledBy: string | null
  cancellationReason: string | null

  createdAt: string

  updatedAt: string
  updatedBy: string
}

export interface LaboratoryOrderFilters {
  search: string

  status:
    | LaboratoryOrderStatus
    | "all"

  priority:
    | LaboratoryOrderPriority
    | "all"

  source:
    | LaboratoryOrderSource
    | "all"

  branchId: string | "all"

  dateView: LaboratoryDateView
  selectedDate: string
}
