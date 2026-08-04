import type {
  RadiologyReportRecord,
} from "@/features/radiology/types/radiology-report.types"
import type {
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"

export const PATIENT_RADIOLOGY_REPORT_FILTERS = [
  "all",
  "routine",
  "significant",
  "critical",
] as const

export type PatientRadiologyReportFilter =
  (typeof PATIENT_RADIOLOGY_REPORT_FILTERS)[number]

export interface PatientReleasedRadiologyReportRecord {
  id: string

  order: RadiologyOrder
  report: RadiologyReportRecord
}
