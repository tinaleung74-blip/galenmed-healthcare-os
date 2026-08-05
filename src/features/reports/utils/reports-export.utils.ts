import {
  REPORT_MODULE_LABELS,
} from "@/features/reports/constants/reports.constants"
import type {
  ReportModule,
  ReportsSnapshot,
} from "@/features/reports/types/reports.types"
import {
  formatReportMetricValue,
} from "@/features/reports/utils/reports.utils"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"

type CsvCell =
  | string
  | number
  | null

interface ReportsCsvExportOptions {
  snapshot: ReportsSnapshot

  modules?:
    readonly ReportModule[]

  branchLabel: string
}

const REPORTS_CSV_HEADERS = [
  "row_type",
  "generated_at",
  "reporting_period",
  "branch_scope",
  "module",
  "metric_id",
  "metric_label",
  "metric_raw_value",
  "metric_formatted_value",
  "metric_tone",
  "occurred_at",
  "record_title",
  "record_subtitle",
  "record_reference",
  "record_status",
  "record_severity",
  "amount_centavos",
  "formatted_amount",
  "metadata",
] as const

function protectCsvFormula(
  value: string
): string {
  if (
    /^[\t\r\n ]*[=+\-@]/.test(
      value
    )
  ) {
    return `'${value}`
  }

  return value
}

function escapeCsvCell(
  value: CsvCell
): string {
  if (value === null) {
    return '""'
  }

  const textValue =
    typeof value === "number"
      ? String(value)
      : protectCsvFormula(
          String(value)
        )

  return `"${textValue.replace(
    /"/g,
    '""'
  )}"`
}

function serializeCsvRow(
  values:
    readonly CsvCell[]
): string {
  return values
    .map(escapeCsvCell)
    .join(",")
}

function sanitizeFileToken(
  value: string
): string {
  return (
    value
      .trim()
      .toLocaleLowerCase(
        "en-PH"
      )
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      ) ||
    "report"
  )
}

function getReportRangeFileToken(
  snapshot:
    ReportsSnapshot
): string {
  const {
    datePreset,
    selectedDate,
    customStartDate,
    customEndDate,
  } = snapshot.filters

  if (datePreset === "all") {
    return "all-records"
  }

  if (datePreset === "custom") {
    return sanitizeFileToken(
      `${customStartDate}-to-${customEndDate}`
    )
  }

  return sanitizeFileToken(
    `${datePreset}-${selectedDate}`
  )
}

function getModuleFileToken(
  modules:
    readonly ReportModule[]
    | undefined
): string {
  if (
    !modules ||
    modules.length === 0
  ) {
    return "all-modules"
  }

  if (modules.length === 1) {
    return modules[0]
  }

  return `${modules.length}-modules`
}

function createReportsCsvFileName({
  snapshot,
  modules,
}: Pick<
  ReportsCsvExportOptions,
  "snapshot" | "modules"
>): string {
  const moduleToken =
    getModuleFileToken(
      modules
    )

  const rangeToken =
    getReportRangeFileToken(
      snapshot
    )

  const generatedToken =
    sanitizeFileToken(
      snapshot.generatedAt
    )

  return [
    "galenmed-reports",
    moduleToken,
    rangeToken,
    generatedToken,
  ].join("-") + ".csv"
}

export function buildReportsSnapshotCsv({
  snapshot,
  modules,
  branchLabel,
}: ReportsCsvExportOptions): string {
  const requestedModules =
    modules &&
    modules.length > 0
      ? new Set<ReportModule>(
          modules
        )
      : null

  const selectedSnapshots =
    requestedModules
      ? snapshot.modules.filter(
          (moduleSnapshot) =>
            requestedModules.has(
              moduleSnapshot.module
            )
        )
      : snapshot.modules

  const rows:
    CsvCell[][] = [
      [
        ...REPORTS_CSV_HEADERS,
      ],
    ]

  selectedSnapshots.forEach(
    (moduleSnapshot) => {
      const moduleLabel =
        REPORT_MODULE_LABELS[
          moduleSnapshot.module
        ]

      moduleSnapshot.metrics.forEach(
        (metric) => {
          rows.push([
            "metric",

            snapshot.generatedAt,

            snapshot.dateRange.label,

            branchLabel,

            moduleLabel,

            metric.id,

            metric.label,

            metric.value,

            formatReportMetricValue(
              metric
            ),

            metric.tone,

            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,

            JSON.stringify({
              description:
                metric.description,

              format:
                metric.format,

              precision:
                metric.precision,
            }),
          ])
        }
      )

      moduleSnapshot.drilldownRows.forEach(
        (row) => {
          rows.push([
            "record",

            snapshot.generatedAt,

            snapshot.dateRange.label,

            branchLabel,

            moduleLabel,

            null,
            null,
            null,
            null,
            null,

            row.occurredAt,

            row.title,

            row.subtitle,

            row.reference,

            row.status,

            row.severity,

            row.amountCentavos,

            row.amountCentavos ===
            null
              ? null
              : formatBillingAmount(
                  row.amountCentavos
                ),

            JSON.stringify(
              row.metadata
            ),
          ])
        }
      )
    }
  )

  return rows
    .map(serializeCsvRow)
    .join("\r\n")
}

export function downloadReportsSnapshotCsv(
  options:
    ReportsCsvExportOptions
): string {
  if (
    typeof document ===
      "undefined" ||
    typeof URL ===
      "undefined"
  ) {
    throw new Error(
      "Reports CSV export is available only in the browser."
    )
  }

  const csvContent =
    buildReportsSnapshotCsv(
      options
    )

  const fileName =
    createReportsCsvFileName({
      snapshot:
        options.snapshot,

      modules:
        options.modules,
    })

  const blob =
    new Blob(
      [
        "\uFEFF",
        csvContent,
      ],
      {
        type:
          "text/csv;charset=utf-8",
      }
    )

  const objectUrl =
    URL.createObjectURL(
      blob
    )

  const downloadLink =
    document.createElement(
      "a"
    )

  downloadLink.href =
    objectUrl

  downloadLink.download =
    fileName

  downloadLink.rel =
    "noopener"

  downloadLink.style.display =
    "none"

  document.body.appendChild(
    downloadLink
  )

  downloadLink.click()
  downloadLink.remove()

  globalThis.setTimeout(
    () => {
      URL.revokeObjectURL(
        objectUrl
      )
    },
    0
  )

  return fileName
}
