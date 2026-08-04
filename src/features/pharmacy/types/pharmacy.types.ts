export const PHARMACY_PRESCRIPTION_STATUSES = [
  "received",
  "pending-review",
  "on-hold",
  "approved",
  "partially-dispensed",
  "dispensed",
  "cancelled",
] as const

export type PharmacyPrescriptionStatus =
  (typeof PHARMACY_PRESCRIPTION_STATUSES)[number]

export const PHARMACY_PRESCRIPTION_PRIORITIES = [
  "routine",
  "urgent",
  "stat",
] as const

export type PharmacyPrescriptionPriority =
  (typeof PHARMACY_PRESCRIPTION_PRIORITIES)[number]

export const PHARMACY_PRESCRIPTION_SOURCES = [
  "consultation",
  "outpatient",
  "inpatient",
  "emergency",
  "external-prescription",
] as const

export type PharmacyPrescriptionSource =
  (typeof PHARMACY_PRESCRIPTION_SOURCES)[number]

export const PHARMACY_REVIEW_STATUSES = [
  "pending",
  "clear",
  "warning",
  "blocked",
  "not-applicable",
] as const

export type PharmacyReviewStatus =
  (typeof PHARMACY_REVIEW_STATUSES)[number]

export const PHARMACY_DOSAGE_FORMS = [
  "tablet",
  "capsule",
  "syrup",
  "suspension",
  "solution",
  "cream",
  "ointment",
  "inhaler",
  "injection",
  "sachet",
] as const

export type PharmacyDosageForm =
  (typeof PHARMACY_DOSAGE_FORMS)[number]

export const PHARMACY_MEDICATION_ROUTES = [
  "oral",
  "topical",
  "inhalation",
  "intramuscular",
  "intravenous",
  "subcutaneous",
  "ophthalmic",
  "otic",
  "nasal",
  "rectal",
] as const

export type PharmacyMedicationRoute =
  (typeof PHARMACY_MEDICATION_ROUTES)[number]

export const PHARMACY_INVENTORY_STATUSES = [
  "available",
  "low-stock",
  "out-of-stock",
  "inactive",
] as const

export type PharmacyInventoryStatus =
  (typeof PHARMACY_INVENTORY_STATUSES)[number]

export const PHARMACY_PRESCRIPTION_ITEM_STATUSES = [
  "pending",
  "partially-dispensed",
  "dispensed",
  "cancelled",
] as const

export type PharmacyPrescriptionItemStatus =
  (typeof PHARMACY_PRESCRIPTION_ITEM_STATUSES)[number]

export const PHARMACY_DATE_VIEWS = [
  "day",
  "last-7-days",
  "all",
] as const

export type PharmacyDateView =
  (typeof PHARMACY_DATE_VIEWS)[number]

export interface PharmacyMedicationDefinition {
  id: string
  sku: string

  genericName: string
  brandName: string | null

  strength: string
  dosageForm: PharmacyDosageForm
  defaultRoute: PharmacyMedicationRoute

  unitOfMeasure: string

  requiresPrescription: boolean
  controlledSubstance: boolean

  active: boolean
}

export interface PharmacyInventoryItem {
  id: string

  medicationId: string

  branchId: string
  branchName: string

  batchNumber: string
  expiresAt: string

  onHandQuantity: number
  reservedQuantity: number
  reorderLevel: number

  status: PharmacyInventoryStatus

  updatedAt: string
  updatedBy: string
}

export interface PharmacyPrescriptionItem {
  id: string

  medicationId: string
  medicationSku: string

  genericName: string
  brandName: string | null

  strength: string
  dosageForm: PharmacyDosageForm

  dose: string
  route: PharmacyMedicationRoute
  frequency: string

  durationDays: number | null

  quantityPrescribed: number
  quantityDispensed: number

  instructions: string
  substitutionAllowed: boolean

  status: PharmacyPrescriptionItemStatus
}

export interface PharmacyDispensingRecord {
  id: string

  prescriptionId: string
  prescriptionItemId: string

  medicationId: string
  medicationSku: string

  genericName: string
  strength: string

  inventoryItemId: string
  batchNumber: string

  quantityDispensed: number

  dispensedAt: string
  dispensedBy: string

  labelReviewConfirmed: boolean
}

export interface PharmacyPrescription {
  id: string
  prescriptionNumber: string

  patientId: string

  consultationId: string | null
  consultationNumber: string | null

  branchId: string
  branchName: string

  prescriberName: string

  source: PharmacyPrescriptionSource
  priority: PharmacyPrescriptionPriority
  status: PharmacyPrescriptionStatus

  clinicalNotes: string | null

  items: PharmacyPrescriptionItem[]

  dispensingRecords?:
    PharmacyDispensingRecord[]

  allergyReviewStatus: PharmacyReviewStatus
  allergyReviewAt: string | null
  allergyReviewBy: string | null
  allergyReviewNotes: string | null

  interactionReviewStatus: PharmacyReviewStatus
  interactionReviewAt: string | null
  interactionReviewBy: string | null
  interactionReviewNotes: string | null

  pharmacistVerifiedAt: string | null
  pharmacistVerifiedBy: string | null
  pharmacistVerificationNotes: string | null

  counselingCompletedAt: string | null
  counselingCompletedBy: string | null
  counselingNotes: string | null

  releasedAt: string | null
  releasedBy: string | null

  cancelledAt: string | null
  cancelledBy: string | null
  cancellationReason: string | null

  createdAt: string
  updatedAt: string
  updatedBy: string
}

export interface PharmacyPrescriptionFilters {
  search: string

  status:
    | PharmacyPrescriptionStatus
    | "all"

  priority:
    | PharmacyPrescriptionPriority
    | "all"

  source:
    | PharmacyPrescriptionSource
    | "all"

  allergyReviewStatus:
    | PharmacyReviewStatus
    | "all"

  inventoryStatus:
    | PharmacyInventoryStatus
    | "all"

  branchId: string | "all"

  dateView: PharmacyDateView
  selectedDate: string
}
