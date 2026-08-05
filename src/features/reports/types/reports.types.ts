export const REPORT_MODULES = [
  "patients",
  "appointments",
  "consultations",
  "laboratory",
  "radiology",
  "pharmacy",
  "billing",
] as const

export type ReportModule =
  (typeof REPORT_MODULES)[number]

export const REPORT_DATE_PRESETS = [
  "selected-day",
  "last-7-days",
  "last-30-days",
  "month-to-date",
  "custom",
  "all",
] as const

export type ReportDatePreset =
  (typeof REPORT_DATE_PRESETS)[number]

export const REPORT_METRIC_FORMATS = [
  "count",
  "currency-centavos",
  "percentage",
  "duration-minutes",
  "decimal",
] as const

export type ReportMetricFormat =
  (typeof REPORT_METRIC_FORMATS)[number]

export const REPORT_METRIC_TONES = [
  "neutral",
  "information",
  "success",
  "warning",
  "danger",
] as const

export type ReportMetricTone =
  (typeof REPORT_METRIC_TONES)[number]

export const REPORT_DRILLDOWN_SEVERITIES = [
  "neutral",
  "information",
  "success",
  "warning",
  "danger",
] as const

export type ReportDrilldownSeverity =
  (typeof REPORT_DRILLDOWN_SEVERITIES)[number]

export interface ReportsFilters {
  branchId: string | "all"

  datePreset:
    ReportDatePreset

  selectedDate: string

  customStartDate: string
  customEndDate: string
}

export interface ReportDateRange {
  startAt: string | null
  endAt: string | null

  label: string
}

export interface ReportMetric {
  id: string

  label: string
  description: string | null

  value: number

  format:
    ReportMetricFormat

  tone:
    ReportMetricTone

  precision: number | null
}

export interface ReportMetricGroup {
  id: string

  module: ReportModule

  title: string
  description: string

  metrics: ReportMetric[]
}

export interface ReportDrilldownRow {
  id: string

  module: ReportModule

  occurredAt: string

  patientId: string | null
  branchId: string | null

  title: string
  subtitle: string | null

  reference: string | null
  status: string | null

  severity:
    ReportDrilldownSeverity

  amountCentavos: number | null

  metadata: Record<
    string,
    string | number | null
  >
}

export interface ReportModuleSnapshot {
  module: ReportModule

  metrics: ReportMetric[]

  drilldownRows:
    ReportDrilldownRow[]
}

export interface ReportsSnapshot {
  generatedAt: string

  filters: ReportsFilters

  dateRange:
    ReportDateRange

  modules:
    ReportModuleSnapshot[]
}
