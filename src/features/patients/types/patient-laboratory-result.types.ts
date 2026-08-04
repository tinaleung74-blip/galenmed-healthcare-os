import type {
  LaboratoryResultSet,
} from "@/features/laboratory/types/laboratory-result.types"
import type {
  LaboratoryOrder,
  LaboratoryOrderItem,
} from "@/features/laboratory/types/laboratory.types"

export const PATIENT_LABORATORY_RESULT_FILTERS = [
  "all",
  "normal",
  "abnormal",
  "critical",
] as const

export type PatientLaboratoryResultFilter =
  (typeof PATIENT_LABORATORY_RESULT_FILTERS)[number]

export interface PatientLaboratoryReleasedResultRecord {
  id: string

  order: LaboratoryOrder
  orderItem: LaboratoryOrderItem

  resultSet: LaboratoryResultSet
}
