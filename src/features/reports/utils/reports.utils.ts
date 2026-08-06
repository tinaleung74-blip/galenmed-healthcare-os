import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"
import type {
  ReportDateRange,
  ReportDrilldownRow,
  ReportMetric,
  ReportMetricFormat,
  ReportMetricTone,
  ReportsFilters,
} from "@/features/reports/types/reports.types"

const reportDateFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  )

const reportCountFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      maximumFractionDigits: 0,
    }
  )

const reportDecimalFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )

function parseIsoLocalDate(
  value: string
): Date | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return null
  }

  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number)

  const date =
    new Date(
      year,
      month - 1,
      day
    )

  if (
    date.getFullYear() !== year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function getStartOfDay(
  date: Date
): Date {
  const result =
    new Date(date)

  result.setHours(
    0,
    0,
    0,
    0
  )

  return result
}

function getEndOfDay(
  date: Date
): Date {
  const result =
    new Date(date)

  result.setHours(
    23,
    59,
    59,
    999
  )

  return result
}

function formatRangeLabel(
  startDate: Date,
  endDate: Date
): string {
  const startLabel =
    reportDateFormatter.format(
      startDate
    )

  const endLabel =
    reportDateFormatter.format(
      endDate
    )

  return startLabel === endLabel
    ? startLabel
    : `${startLabel} – ${endLabel}`
}

export function resolveReportsDateRange(
  filters: ReportsFilters
): ReportDateRange {
  if (
    filters.datePreset ===
    "all"
  ) {
    return {
      startAt: null,
      endAt: null,
      label:
        "All Available Records",
    }
  }

  const selectedDate =
    parseIsoLocalDate(
      filters.selectedDate
    )

  if (!selectedDate) {
    throw new Error(
      "The selected report date is invalid."
    )
  }

  let startDate:
    Date

  let endDate:
    Date

  switch (
    filters.datePreset
  ) {
    case "selected-day":
      startDate =
        getStartOfDay(
          selectedDate
        )

      endDate =
        getEndOfDay(
          selectedDate
        )

      break

    case "last-7-days":
      startDate =
        getStartOfDay(
          selectedDate
        )

      startDate.setDate(
        startDate.getDate() -
          6
      )

      endDate =
        getEndOfDay(
          selectedDate
        )

      break

    case "last-30-days":
      startDate =
        getStartOfDay(
          selectedDate
        )

      startDate.setDate(
        startDate.getDate() -
          29
      )

      endDate =
        getEndOfDay(
          selectedDate
        )

      break

    case "month-to-date":
      startDate =
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
          0,
          0,
          0,
          0
        )

      endDate =
        getEndOfDay(
          selectedDate
        )

      break

    case "custom": {
      const customStartDate =
        parseIsoLocalDate(
          filters.customStartDate
        )

      const customEndDate =
        parseIsoLocalDate(
          filters.customEndDate
        )

      if (
        !customStartDate ||
        !customEndDate
      ) {
        throw new Error(
          "The custom report date range is invalid."
        )
      }

      startDate =
        getStartOfDay(
          customStartDate
        )

      endDate =
        getEndOfDay(
          customEndDate
        )

      if (
        startDate.getTime() >
        endDate.getTime()
      ) {
        throw new Error(
          "The custom report start date must not be after the end date."
        )
      }

      break
    }


  }

  return {
    startAt:
      startDate.toISOString(),

    endAt:
      endDate.toISOString(),

    label:
      formatRangeLabel(
        startDate,
        endDate
      ),
  }
}

export function isTimestampInReportRange(
  value:
    | string
    | null
    | undefined,

  dateRange:
    ReportDateRange
): boolean {
  if (!value) {
    return false
  }

  const timestamp =
    new Date(value).getTime()

  if (
    Number.isNaN(timestamp)
  ) {
    return false
  }

  const startTimestamp =
    dateRange.startAt
      ? new Date(
          dateRange.startAt
        ).getTime()
      : null

  const endTimestamp =
    dateRange.endAt
      ? new Date(
          dateRange.endAt
        ).getTime()
      : null

  if (
    startTimestamp !== null &&
    timestamp <
      startTimestamp
  ) {
    return false
  }

  if (
    endTimestamp !== null &&
    timestamp >
      endTimestamp
  ) {
    return false
  }

  return true
}

export function isBranchInReportScope(
  recordBranchId:
    | string
    | null
    | undefined,

  selectedBranchId:
    string | "all"
): boolean {
  return (
    selectedBranchId ===
      "all" ||
    recordBranchId ===
      selectedBranchId
  )
}

export function calculateReportPercentage(
  numerator: number,
  denominator: number
): number {
  if (
    !Number.isFinite(
      numerator
    ) ||
    !Number.isFinite(
      denominator
    ) ||
    denominator <= 0
  ) {
    return 0
  }

  return (
    numerator /
    denominator
  ) * 100
}

export function calculateReportAverage(
  values:
    readonly number[]
): number {
  const validValues =
    values.filter(
      (value) =>
        Number.isFinite(value)
    )

  if (
    validValues.length === 0
  ) {
    return 0
  }

  return (
    validValues.reduce(
      (
        total,
        value
      ) =>
        total + value,
      0
    ) /
    validValues.length
  )
}

export function differenceInReportMinutes(
  startValue:
    | string
    | null
    | undefined,

  endValue:
    | string
    | null
    | undefined
): number | null {
  if (
    !startValue ||
    !endValue
  ) {
    return null
  }

  const startTimestamp =
    new Date(
      startValue
    ).getTime()

  const endTimestamp =
    new Date(
      endValue
    ).getTime()

  if (
    Number.isNaN(
      startTimestamp
    ) ||
    Number.isNaN(
      endTimestamp
    ) ||
    endTimestamp <
      startTimestamp
  ) {
    return null
  }

  return (
    endTimestamp -
    startTimestamp
  ) / 60000
}

export function createReportMetric({
  id,
  label,
  description = null,
  value,
  format = "count",
  tone = "neutral",
  precision = null,
}: {
  id: string
  label: string
  description?: string | null
  value: number
  format?:
    ReportMetricFormat
  tone?:
    ReportMetricTone
  precision?: number | null
}): ReportMetric {
  return {
    id,
    label,
    description,

    value:
      Number.isFinite(value)
        ? value
        : 0,

    format,
    tone,
    precision,
  }
}

function formatDurationMinutes(
  value: number
): string {
  if (
    !Number.isFinite(value)
  ) {
    return "—"
  }

  const roundedMinutes =
    Math.max(
      0,
      Math.round(value)
    )

  if (
    roundedMinutes < 60
  ) {
    return `${roundedMinutes} min`
  }

  const hours =
    Math.floor(
      roundedMinutes / 60
    )

  const minutes =
    roundedMinutes % 60

  return minutes === 0
    ? `${hours} hr`
    : `${hours} hr ${minutes} min`
}

export function formatReportMetricValue(
  metric: ReportMetric
): string {
  if (
    !Number.isFinite(
      metric.value
    )
  ) {
    return "—"
  }

  switch (metric.format) {
    case "count":
      return reportCountFormatter.format(
        Math.round(
          metric.value
        )
      )

    case "currency-centavos":
      return formatBillingAmount(
        Math.round(
          metric.value
        )
      )

    case "percentage":
      return `${metric.value.toFixed(
        metric.precision ??
          1
      )}%`

    case "duration-minutes":
      return formatDurationMinutes(
        metric.value
      )

    case "decimal":
      return reportDecimalFormatter.format(
        metric.value
      )
  }
}

export function filterRecordsByReportRange<
  RecordType,
>(
  records:
    readonly RecordType[],

  getTimestamp: (
    record: RecordType
  ) =>
    | string
    | null
    | undefined,

  dateRange:
    ReportDateRange
): RecordType[] {
  return records.filter(
    (record) =>
      isTimestampInReportRange(
        getTimestamp(record),
        dateRange
      )
  )
}

export function sortReportDrilldownRows(
  rows:
    readonly ReportDrilldownRow[]
): ReportDrilldownRow[] {
  return [...rows].sort(
    (
      firstRow,
      secondRow
    ) => {
      const firstTimestamp =
        new Date(
          firstRow.occurredAt
        ).getTime()

      const secondTimestamp =
        new Date(
          secondRow.occurredAt
        ).getTime()

      const safeFirstTimestamp =
        Number.isNaN(
          firstTimestamp
        )
          ? 0
          : firstTimestamp

      const safeSecondTimestamp =
        Number.isNaN(
          secondTimestamp
        )
          ? 0
          : secondTimestamp

      return (
        safeSecondTimestamp -
        safeFirstTimestamp
      )
    }
  )
}
