"use client"

import {
  Fragment,
  useMemo,
  useState,
} from "react"
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ReportDrilldownSeverityBadge,
} from "@/features/reports/components/reports-status-badges"
import {
  REPORT_MODULE_LABELS,
  REPORTS_INITIAL_DRILLDOWN_ROWS,
} from "@/features/reports/constants/reports.constants"
import {
  REPORT_DRILLDOWN_SEVERITIES,
  type ReportDrilldownRow,
  type ReportDrilldownSeverity,
} from "@/features/reports/types/reports.types"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface ReportsDrilldownTableProps {
  rows:
    readonly ReportDrilldownRow[]
}

type SeverityFilter =
  | ReportDrilldownSeverity
  | "all"

const severityLabels: Record<
  ReportDrilldownSeverity,
  string
> = {
  neutral: "Neutral",
  information: "Information",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"

function isSeverityFilter(
  value: string
): value is SeverityFilter {
  return (
    value === "all" ||
    REPORT_DRILLDOWN_SEVERITIES.some(
      (severity) =>
        severity === value
    )
  )
}

function formatMetadataLabel(
  value: string
): string {
  return value
    .replace(
      /([a-z0-9])([A-Z])/g,
      "$1 $2"
    )
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}

function formatMetadataValue(
  value:
    | string
    | number
    | null
): string {
  if (
    value === null ||
    value === ""
  ) {
    return "Not recorded"
  }

  if (
    typeof value === "number"
  ) {
    return new Intl.NumberFormat(
      "en-PH",
      {
        maximumFractionDigits: 2,
      }
    ).format(value)
  }

  return value
}

function getStatusLabel(
  row: ReportDrilldownRow
): string {
  if (!row.status) {
    return severityLabels[
      row.severity
    ]
  }

  return row.status
    .replace(/[_-]+/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}

function matchesSearch(
  row: ReportDrilldownRow,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const metadataText =
    Object.entries(
      row.metadata
    )
      .map(
        ([key, value]) =>
          `${key} ${
            value ?? ""
          }`
      )
      .join(" ")

  return normalizePatientSearch(
    row.title,
    row.subtitle,
    row.reference,
    row.status,
    REPORT_MODULE_LABELS[
      row.module
    ],
    metadataText
  ).includes(normalizedSearch)
}

export function ReportsDrilldownTable({
  rows,
}: ReportsDrilldownTableProps) {
  const [search, setSearch] =
    useState("")

  const [
    severityFilter,
    setSeverityFilter,
  ] =
    useState<SeverityFilter>(
      "all"
    )

  const [
    visibleRowCount,
    setVisibleRowCount,
  ] = useState(
    REPORTS_INITIAL_DRILLDOWN_ROWS
  )

  const [
    expandedRowId,
    setExpandedRowId,
  ] = useState<string | null>(
    null
  )

  const filteredRows =
    useMemo(
      () =>
        rows.filter(
          (row) =>
            matchesSearch(
              row,
              search
            ) &&
            (
              severityFilter ===
                "all" ||
              row.severity ===
                severityFilter
            )
        ),
      [
        rows,
        search,
        severityFilter,
      ]
    )

  const visibleRows =
    filteredRows.slice(
      0,
      visibleRowCount
    )

  const hasActiveFilters =
    search.trim().length > 0 ||
    severityFilter !== "all"

  function resetFilters() {
    setSearch("")
    setSeverityFilter("all")

    setVisibleRowCount(
      REPORTS_INITIAL_DRILLDOWN_ROWS
    )

    setExpandedRowId(null)
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-background">
      <div className="space-y-3 border-b p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={search}
              placeholder="Search report records, references, statuses, or metadata"
              className="pl-8"
              onChange={(event) => {
                setSearch(
                  event.target.value
                )

                setVisibleRowCount(
                  REPORTS_INITIAL_DRILLDOWN_ROWS
                )
              }}
            />
          </div>

          <select
            value={severityFilter}
            className={selectClassName}
            onChange={(event) => {
              const nextSeverity =
                event.target.value

              if (
                isSeverityFilter(
                  nextSeverity
                )
              ) {
                setSeverityFilter(
                  nextSeverity
                )

                setVisibleRowCount(
                  REPORTS_INITIAL_DRILLDOWN_ROWS
                )
              }
            }}
          >
            <option value="all">
              All operational states
            </option>

            {REPORT_DRILLDOWN_SEVERITIES.map(
              (severity) => (
                <option
                  key={severity}
                  value={severity}
                >
                  {
                    severityLabels[
                      severity
                    ]
                  }
                </option>
              )
            )}
          </select>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={resetFilters}
            >
              <RotateCcw
                aria-hidden="true"
              />
              Reset
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {visibleRows.length} of{" "}
          {filteredRows.length} matching
          records
        </p>
      </div>

      {visibleRows.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
          <Search
            className="size-7 text-muted-foreground"
            aria-hidden="true"
          />

          <p className="mt-3 text-sm font-medium">
            No matching report records
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Adjust the report filters or
            selected operational state.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Date and time
                </TableHead>

                <TableHead>
                  Module
                </TableHead>

                <TableHead>
                  Record
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead>
                  Amount
                </TableHead>

                <TableHead>
                  <span className="sr-only">
                    Drill-down action
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {visibleRows.map(
                (row) => {
                  const isExpanded =
                    expandedRowId ===
                    row.id

                  const metadataEntries =
                    Object.entries(
                      row.metadata
                    )

                  return (
                    <Fragment
                      key={row.id}
                    >
                      <TableRow>
                        <TableCell>
                          {formatPatientDateTime(
                            row.occurredAt
                          )}
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {
                              REPORT_MODULE_LABELS[
                                row.module
                              ]
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="max-w-sm break-words font-medium [overflow-wrap:anywhere]">
                            {row.title}
                          </p>

                          {row.subtitle ? (
                            <p className="mt-1 max-w-sm break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                              {row.subtitle}
                            </p>
                          ) : null}

                          {row.reference ? (
                            <p className="mt-1 max-w-sm break-words font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
                              {row.reference}
                            </p>
                          ) : null}
                        </TableCell>

                        <TableCell>
                          <ReportDrilldownSeverityBadge
                            severity={
                              row.severity
                            }
                            label={getStatusLabel(
                              row
                            )}
                          />
                        </TableCell>

                        <TableCell>
                          <p className="max-w-44 break-words font-semibold tabular-nums [overflow-wrap:anywhere]">
                            {row.amountCentavos ===
                            null
                              ? "—"
                              : formatBillingAmount(
                                  row.amountCentavos
                                )}
                          </p>
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setExpandedRowId(
                                isExpanded
                                  ? null
                                  : row.id
                              )
                            }
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp
                                  aria-hidden="true"
                                />
                                Hide details
                              </>
                            ) : (
                              <>
                                <ChevronDown
                                  aria-hidden="true"
                                />
                                View details
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="bg-slate-50/70"
                          >
                            {metadataEntries.length ===
                            0 ? (
                              <p className="text-sm text-muted-foreground">
                                No additional
                                metadata is
                                available.
                              </p>
                            ) : (
                              <dl className="grid gap-4 py-2 sm:grid-cols-2 lg:grid-cols-3">
                                {metadataEntries.map(
                                  ([
                                    key,
                                    value,
                                  ]) => (
                                    <div
                                      key={`${row.id}-${key}`}
                                      className="min-w-0"
                                    >
                                      <dt className="break-words text-xs font-medium uppercase tracking-wide text-muted-foreground [overflow-wrap:anywhere]">
                                        {formatMetadataLabel(
                                          key
                                        )}
                                      </dt>

                                      <dd className="mt-1 break-words text-sm [overflow-wrap:anywhere]">
                                        {formatMetadataValue(
                                          value
                                        )}
                                      </dd>
                                    </div>
                                  )
                                )}
                              </dl>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                }
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {visibleRows.length <
      filteredRows.length ? (
        <div className="flex justify-center border-t p-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setVisibleRowCount(
                (currentCount) =>
                  currentCount +
                  REPORTS_INITIAL_DRILLDOWN_ROWS
              )
            }
          >
            Load more records
          </Button>
        </div>
      ) : null}
    </section>
  )
}
