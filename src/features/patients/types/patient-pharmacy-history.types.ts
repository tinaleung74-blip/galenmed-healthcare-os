import type {
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"

export const PATIENT_PHARMACY_HISTORY_FILTERS = [
  "all",
  "routine",
  "urgent",
  "stat",
] as const

export type PatientPharmacyHistoryFilter =
  (typeof PATIENT_PHARMACY_HISTORY_FILTERS)[number]

export interface PatientReleasedMedicationRecord {
  id: string

  prescription:
    PharmacyPrescription
}
