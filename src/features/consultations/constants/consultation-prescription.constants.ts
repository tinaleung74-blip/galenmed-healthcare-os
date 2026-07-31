import type {
  ConsultationAllergyReviewStatus,
  ConsultationMedicationDoseUnit,
  ConsultationMedicationDurationUnit,
  ConsultationMedicationFrequency,
  ConsultationMedicationRoute,
  ConsultationPrescriptionRecordStatus,
  ConsultationPrescriptionStatus,
} from "@/features/consultations/types/consultation-prescription.types"

export const CONSULTATION_PRESCRIPTION_STATUS_LABELS: Record<
  ConsultationPrescriptionStatus,
  string
> = {
  draft: "Draft",
  active: "Active",
  discontinued: "Discontinued",
  cancelled: "Cancelled",
}

export const CONSULTATION_MEDICATION_ROUTE_LABELS: Record<
  ConsultationMedicationRoute,
  string
> = {
  oral: "Oral",
  sublingual: "Sublingual",
  topical: "Topical",
  inhaled: "Inhaled",
  intramuscular: "Intramuscular",
  intravenous: "Intravenous",
  subcutaneous: "Subcutaneous",
  rectal: "Rectal",
  ophthalmic: "Ophthalmic",
  otic: "Otic",
  nasal: "Nasal",
  other: "Other",
}

export const CONSULTATION_MEDICATION_DOSE_UNIT_LABELS: Record<
  ConsultationMedicationDoseUnit,
  string
> = {
  mg: "mg",
  mcg: "mcg",
  g: "g",
  mL: "mL",
  tablet: "tablet(s)",
  capsule: "capsule(s)",
  puff: "puff(s)",
  drop: "drop(s)",
  unit: "unit(s)",
  application: "application(s)",
  other: "Other",
}

export const CONSULTATION_MEDICATION_FREQUENCY_LABELS: Record<
  ConsultationMedicationFrequency,
  string
> = {
  once: "Once",
  "once-daily": "Once daily",
  "twice-daily": "Twice daily",
  "three-times-daily": "Three times daily",
  "four-times-daily": "Four times daily",
  "every-4-hours": "Every 4 hours",
  "every-6-hours": "Every 6 hours",
  "every-8-hours": "Every 8 hours",
  "every-12-hours": "Every 12 hours",
  "as-needed": "As needed",
  custom: "Custom schedule",
}

export const CONSULTATION_MEDICATION_DURATION_UNIT_LABELS: Record<
  ConsultationMedicationDurationUnit,
  string
> = {
  days: "Day(s)",
  weeks: "Week(s)",
  months: "Month(s)",
  ongoing: "Ongoing",
}

export const CONSULTATION_ALLERGY_REVIEW_STATUS_LABELS: Record<
  ConsultationAllergyReviewStatus,
  string
> = {
  "not-reviewed": "Not reviewed",
  "reviewed-no-conflict": "Reviewed — no known conflict",
  "reviewed-with-warning": "Reviewed — warning acknowledged",
}

export const CONSULTATION_PRESCRIPTION_RECORD_STATUS_LABELS: Record<
  ConsultationPrescriptionRecordStatus,
  string
> = {
  current: "Current",
  archived: "Archived",
}
