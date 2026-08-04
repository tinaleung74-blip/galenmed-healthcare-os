"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  AlertTriangle,
  Eye,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
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
  RadiologyFindingLevelBadge,
  RadiologyReportStatusBadge,
} from "@/features/radiology/components/radiology-report-badges"
import {
  RADIOLOGY_MODALITY_LABELS,
} from "@/features/radiology/constants/radiology.constants"
import {
  useRadiologyReports,
} from "@/features/radiology/providers/radiology-report-provider"
import {
  useRadiology,
} from "@/features/radiology/providers/radiology-provider"
import { PatientRadiologyReportDetailsSheet } from "@/features/patients/components/patient-radiology-report-details-sheet"
import {
  PATIENT_RADIOLOGY_REPORT_FILTERS,
  type PatientRadiologyReportFilter,
  type PatientReleasedRadiologyReportRecord,
} from "@/features/patients/types/patient-radiology-report.types"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface PatientRadiologyReportHistoryProps {
  patientId: string
}

const reportFilterLabels: Record<
  PatientRadiologyReportFilter,
  string
> = {
  all: "All released reports",
  routine: "Routine findings",
  significant: "Significant findings",
  critical: "Critical findings",
}

const selectClassName =
  "h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"

function isReportFilter(
  value: string
): value is PatientRadiologyReportFilter {
  return PATIENT_RADIOLOGY_REPORT_FILTERS.some(
    (filter) =>
      filter === value
  )
}

function matchesReportSearch(
  record:
    PatientReleasedRadiologyReportRecord,

  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  return normalizePatientSearch(
    record.order.orderNumber,
    record.order.consultationNumber,
    record.order.procedureCode,
    record.order.procedureName,
    record.order.bodyRegion,
    record.order.roomName,
    record.order.orderedByName,
    record.order.branchName,
    record.report.draftedBy,
    record.report.verifiedBy,
    record.report.releasedBy
  ).includes(normalizedSearch)
}

export function PatientRadiologyReportHistory({
  patientId,
}: PatientRadiologyReportHistoryProps) {
  const { radiologyOrders } =
    useRadiology()

  const { reports } =
    useRadiologyReports()

  const [search, setSearch] =
    useState("")

  const [
    reportFilter,
    setReportFilter,
  ] =
    useState<PatientRadiologyReportFilter>(
      "all"
    )

  const [
    viewingRecordId,
    setViewingRecordId,
  ] = useState<string | null>(
    null
  )

  const releasedRecords =
    useMemo(() => {
      const records:
        PatientReleasedRadiologyReportRecord[] =
        []

      reports.forEach((report) => {
        if (
          report.patientId !==
            patientId ||
          report.status !==
            "released"
        ) {
          return
        }

        const order =
          radiologyOrders.find(
            (candidateOrder) =>
              candidateOrder.id ===
              report.orderId
          )

        if (!order) {
          return
        }

        records.push({
          id: report.id,
          order,
          report,
        })
      })

      return records.sort(
        (
          firstRecord,
          secondRecord
        ) =>
          new Date(
            secondRecord.report
              .releasedAt ??
              secondRecord.report
                .updatedAt
          ).getTime() -
          new Date(
            firstRecord.report
              .releasedAt ??
              firstRecord.report
                .updatedAt
          ).getTime()
      )
    }, [
      patientId,
      radiologyOrders,
      reports,
    ])

  const filteredRecords =
    useMemo(
      () =>
        releasedRecords.filter(
          (record) =>
            matchesReportSearch(
              record,
              search
            ) &&
            (
              reportFilter ===
                "all" ||
              record.report
                .findingLevel ===
                reportFilter
            )
        ),
      [
        releasedRecords,
        reportFilter,
        search,
      ]
    )

  const viewingRecord =
    releasedRecords.find(
      (record) =>
        record.id ===
        viewingRecordId
    ) ?? null

  const significantCount =
    releasedRecords.filter(
      (record) =>
        record.report.findingLevel ===
        "significant"
    ).length

  const criticalCount =
    releasedRecords.filter(
      (record) =>
        record.report.findingLevel ===
        "critical"
    ).length

  const latestReleasedAt =
    releasedRecords[0]
      ?.report.releasedAt ??
    null

  const hasActiveFilters =
    search.trim().length > 0 ||
    reportFilter !== "all"

  function resetFilters() {
    setSearch("")
    setReportFilter("all")
  }

  return (
    <>
      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
            <ScanLine
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Released Radiology Reports
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Read-only final imaging
              reports that completed
              radiologist verification and
              release.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Released reports
              </p>

              <p className="mt-1 text-xl font-semibold">
                {releasedRecords.length}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Significant findings
              </p>

              <p className="mt-1 text-xl font-semibold">
                {significantCount}
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              criticalCount > 0
                ? "border-rose-200 bg-rose-50/40 shadow-none"
                : "shadow-none"
            }
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Critical findings
              </p>

              <p className="mt-1 text-xl font-semibold">
                {criticalCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Latest release
              </p>

              <p className="mt-1 text-sm font-semibold">
                {formatPatientDateTime(
                  latestReleasedAt,
                  "No released report"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="space-y-3 border-b p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  value={search}
                  placeholder="Search procedure, order, modality, room, or clinician"
                  className="pl-8"
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={reportFilter}
                className={selectClassName}
                onChange={(event) => {
                  const nextFilter =
                    event.target.value

                  if (
                    isReportFilter(
                      nextFilter
                    )
                  ) {
                    setReportFilter(
                      nextFilter
                    )
                  }
                }}
              >
                {PATIENT_RADIOLOGY_REPORT_FILTERS.map(
                  (filter) => (
                    <option
                      key={filter}
                      value={filter}
                    >
                      {
                        reportFilterLabels[
                          filter
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
              Showing{" "}
              {filteredRecords.length} of{" "}
              {releasedRecords.length} released
              radiology reports
            </p>
          </div>

          {releasedRecords.length ===
          0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <ScanLine
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold">
                No released radiology
                reports
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Final imaging reports appear
                here only after radiologist
                verification and release.
              </p>
            </div>
          ) : filteredRecords.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold">
                No matching radiology
                reports
              </h3>

              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <Table className="min-w-[1150px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Imaging procedure
                  </TableHead>

                  <TableHead>
                    Order
                  </TableHead>

                  <TableHead>
                    Released
                  </TableHead>

                  <TableHead>
                    Finding level
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    <span className="sr-only">
                      Report action
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map(
                  (record) => (
                    <TableRow
                      key={record.id}
                    >
                      <TableCell>
                        <p className="font-medium">
                          {
                            record.report
                              .procedureName
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            RADIOLOGY_MODALITY_LABELS[
                              record.order
                                .modality
                            ]
                          }
                          {" · "}
                          {
                            record.order
                              .bodyRegion
                          }
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-mono text-xs">
                          {
                            record.order
                              .orderNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            record.order
                              .orderedByName
                          }
                        </p>
                      </TableCell>

                      <TableCell>
                        <p>
                          {formatPatientDateTime(
                            record.report
                              .releasedAt
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            record.report
                              .releasedBy
                          }
                        </p>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {record.report
                            .findingLevel ===
                          "critical" ? (
                            <AlertTriangle
                              className="size-4 text-rose-700"
                              aria-hidden="true"
                            />
                          ) : null}

                          <RadiologyFindingLevelBadge
                            findingLevel={
                              record.report
                                .findingLevel
                            }
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <RadiologyReportStatusBadge
                          status={
                            record.report
                              .status
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setViewingRecordId(
                              record.id
                            )
                          }
                        >
                          <Eye
                            aria-hidden="true"
                          />
                          View report
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            Imaging findings, impressions,
            clinicians, registration
            numbers, communication records,
            and timestamps are synthetic
            development data. Production
            access requires authentication
            and role authorization.
          </p>
        </div>
      </section>

      <PatientRadiologyReportDetailsSheet
        record={viewingRecord}
        open={Boolean(
          viewingRecord
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
      />
    </>
  )
}
