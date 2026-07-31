export const CONSULTATION_PRESCRIPTION_STATUSES = [
  "draft",
  "active",
  "discontinued",
  "cancelled",
] as const

export type ConsultationPrescriptionStatus =
  (typeof CONSULTATION_PRESCRIPTION_STATUSES)[number]

export const CONSULTATION_MEDICATION_ROUTES = [
  "oral",
  "sublingual",
  "topical",
  "inhaled",
  "intramuscular",
  "intravenous",
  "subcutaneous",
  "rectal",
  "ophthalmic",
  "otic",
  "nasal",
  "other",
] as const

export type ConsultationMedicationRoute =
  (typeof CONSULTATION_MEDICATION_ROUTES)[number]

export const CONSULTATION_MEDICATION_DOSE_UNITS = [
  "mg",
  "mcg",
  "g",
  "mL",
  "tablet",
  "capsule",
  "puff",
  "drop",
  "unit",
  "application",
  "other",
] as const

export type ConsultationMedicationDoseUnit =
  (typeof CONSULTATION_MEDICATION_DOSE_UNITS)[number]

export const CONSULTATION_MEDICATION_FREQUENCIES = [
  "once",
  "once-daily",
  "twice-daily",
  "three-times-daily",
  "four-times-daily",
  "every-4-hours",
  "every-6-hours",
  "every-8-hours",
  "every-12-hours",
  "as-needed",
  "custom",
] as const

export type ConsultationMedicationFrequency =
  (typeof CONSULTATION_MEDICATION_FREQUENCIES)[number]

export const CONSULTATION_MEDICATION_DURATION_UNITS = [
  "days",
  "weeks",
  "months",
  "ongoing",
] as const

export type ConsultationMedicationDurationUnit =
  (typeof CONSULTATION_MEDICATION_DURATION_UNITS)[number]

export const CONSULTATION_ALLERGY_REVIEW_STATUSES = [
  "not-reviewed",
  "reviewed-no-conflict",
  "reviewed-with-warning",
] as const

export type ConsultationAllergyReviewStatus =
  (typeof CONSULTATION_ALLERGY_REVIEW_STATUSES)[number]

export const CONSULTATION_PRESCRIPTION_RECORD_STATUSES = [
  "current",
  "archived",
] as const

export type ConsultationPrescriptionRecordStatus =
  (typeof CONSULTATION_PRESCRIPTION_RECORD_STATUSES)[number]

export interface ConsultationPrescriptionRecord {
  id: string
  prescriptionNumber: string

  consultationId: string
  patientId: string

  medicationName: string
  strength: string | null

  doseAmount: number
  doseUnit: ConsultationMedicationDoseUnit
  route: ConsultationMedicationRoute

  frequency: ConsultationMedicationFrequency
  frequencyDetails: string | null

  durationValue: number | null
  durationUnit: ConsultationMedicationDurationUnit

  quantity: number
  quantityUnit: string
  refillsAllowed: number

  startDate: string
  endDate: string | null

  indication: string
  patientInstructions: string
  prescriberNotes: string | null

  substitutionAllowed: boolean

  allergyReviewStatus:
    ConsultationAllergyReviewStatus

  allergyWarningNote: string | null

  status: ConsultationPrescriptionStatus
  recordStatus:
    ConsultationPrescriptionRecordStatus

  prescribedBy: string
  prescribedAt: string

  updatedBy: string
  updatedAt: string

  discontinuedAt: string | null
  discontinuedBy: string | null
  discontinuationReason: string | null

  archivedAt: string | null
  archivedBy: string | null
  archiveReason: string | null
}
