import type {
  ReportDatePreset,
  ReportMetricFormat,
  ReportMetricTone,
  ReportModule,
  ReportsFilters,
} from "@/features/reports/types/reports.types"

export const REPORT_MODULE_LABELS: Record<
  ReportModule,
  string
> = {
  patients:
    "Patient Census",

  appointments:
    "Appointment Operations",

  consultations:
    "Consultation Operations",

  laboratory:
    "Laboratory Operations",

  radiology:
    "Radiology Operations",

  pharmacy:
    "Pharmacy Operations",

  billing:
    "Billing and Collections",
}

export const REPORT_MODULE_DESCRIPTIONS: Record<
  ReportModule,
  string
> = {
  patients:
    "Patient registrations, active records, and branch census.",

  appointments:
    "Scheduled appointments, check-ins, cancellations, and no-shows.",

  consultations:
    "Waiting, active, completed, cancelled, and no-show consultations.",

  laboratory:
    "Laboratory orders, specimens, results, verification, and release.",

  radiology:
    "Imaging orders, acquisition, reporting, verification, and release.",

  pharmacy:
    "Prescription review, dispensing, verification, counseling, and release.",

  billing:
    "Statements, patient responsibility, collections, refunds, and balances.",
}

export const REPORT_DATE_PRESET_LABELS: Record<
  ReportDatePreset,
  string
> = {
  "selected-day":
    "Selected Date",

  "last-7-days":
    "Last Seven Days",

  "last-30-days":
    "Last Thirty Days",

  "month-to-date":
    "Month to Date",

  custom:
    "Custom Date Range",

  all:
    "All Available Records",
}

export const REPORT_METRIC_FORMAT_LABELS: Record<
  ReportMetricFormat,
  string
> = {
  count: "Count",

  "currency-centavos":
    "Philippine Peso",

  percentage:
    "Percentage",

  "duration-minutes":
    "Duration",

  decimal:
    "Decimal",
}

export const REPORT_METRIC_TONE_LABELS: Record<
  ReportMetricTone,
  string
> = {
  neutral: "Neutral",
  information: "Information",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
}

export const REPORT_MODULE_ORDER =
  [
    "patients",
    "appointments",
    "consultations",
    "laboratory",
    "radiology",
    "pharmacy",
    "billing",
  ] as const satisfies
    readonly ReportModule[]

export const DEFAULT_REPORTS_FILTERS:
  ReportsFilters = {
  branchId: "all",

  datePreset:
    "selected-day",

  selectedDate:
    "2026-08-04",

  customStartDate:
    "2026-08-01",

  customEndDate:
    "2026-08-04",
}

export const REPORTS_SYNTHETIC_NOTICE =
  "Report totals, amounts, turnaround times, rates, dates, patients, clinicians, staff members, and operational records are derived from synthetic development data."

export const REPORTS_READ_ONLY_NOTICE =
  "Reports are read-only derived views. They do not create, duplicate, or modify source module records."

export const REPORTS_INITIAL_DRILLDOWN_ROWS =
  15
