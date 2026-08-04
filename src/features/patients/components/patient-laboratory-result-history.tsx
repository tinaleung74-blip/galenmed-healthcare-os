"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  AlertTriangle,
  Eye,
  FlaskConical,
  RotateCcw,
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
import { LaboratoryResultStatusBadge } from "@/features/laboratory/components/laboratory-result-badges"
import { useLaboratoryResults } from "@/features/laboratory/providers/laboratory-result-provider"
import { useLaboratory } from "@/features/laboratory/providers/laboratory-provider"
import type {
  LaboratoryResultEntry,
} from "@/features/laboratory/types/laboratory-result.types"
import { PatientLaboratoryResultDetailsSheet } from "@/features/patients/components/patient-laboratory-result-details-sheet"
import {
  PATIENT_LABORATORY_RESULT_FILTERS,
  type PatientLaboratoryReleasedResultRecord,
  type PatientLaboratoryResultFilter,
} from "@/features/patients/types/patient-laboratory-result.types"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface PatientLaboratoryResultHistoryProps {
  patientId: string
}

const resultFilterLabels: Record<
  PatientLaboratoryResultFilter,
  string
> = {
  all: "All released results",
  normal: "No abnormal flags",
  abnormal: "With abnormal flags",
  critical: "With critical flags",
}

const selectClassName =
  "h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"

function entryIsAbnormal(
  entry: LaboratoryResultEntry
): boolean {
  return (
    entry.flag !== "normal" &&
    entry.flag !==
      "not-applicable"
  )
}

function entryIsCritical(
  entry: LaboratoryResultEntry
): boolean {
  return (
    entry.flag ===
      "critical-low" ||
    entry.flag ===
      "critical-high"
  )
}

function recordHasAbnormalResult(
  record:
    PatientLaboratoryReleasedResultRecord
): boolean {
  return record.resultSet.entries.some(
    entryIsAbnormal
  )
}

function recordHasCriticalResult(
  record:
    PatientLaboratoryReleasedResultRecord
): boolean {
  return record.resultSet.entries.some(
    entryIsCritical
  )
}

function isResultFilter(
  value: string
): value is PatientLaboratoryResultFilter {
  return PATIENT_LABORATORY_RESULT_FILTERS.some(
    (filter) =>
      filter === value
  )
}

function matchesResultSearch(
  record:
    PatientLaboratoryReleasedResultRecord,

  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableResult =
    normalizePatientSearch(
      record.order.orderNumber,
      record.order.consultationNumber,
      record.order.orderedByName,
      record.order.branchName,
      record.order.clinicalIndication,
      record.orderItem.testCode,
      record.orderItem.testName,
      record.resultSet.performedBy,
      record.resultSet.verifiedBy,
      record.resultSet.releasedBy,
      record.resultSet.entries
        .map(
          (entry) =>
            `${entry.analyteCode} ${entry.analyteName}`
        )
        .join(" ")
    )

  return searchableResult.includes(
    normalizedSearch
  )
}

export function PatientLaboratoryResultHistory({
  patientId,
}: PatientLaboratoryResultHistoryProps) {
  const { laboratoryOrders } =
    useLaboratory()

  const { resultSets } =
    useLaboratoryResults()

  const [search, setSearch] =
    useState("")

  const [
    resultFilter,
    setResultFilter,
  ] =
    useState<PatientLaboratoryResultFilter>(
      "all"
    )

  const [
    viewingRecordId,
    setViewingRecordId,
  ] = useState<string | null>(null)

  const releasedRecords =
    useMemo(() => {
      const records:
        PatientLaboratoryReleasedResultRecord[] =
        []

      resultSets.forEach(
        (resultSet) => {
          if (
            resultSet.patientId !==
              patientId ||
            resultSet.status !==
              "released"
          ) {
            return
          }

          const order =
            laboratoryOrders.find(
              (candidateOrder) =>
                candidateOrder.id ===
                resultSet.orderId
            )

          const orderItem =
            order?.items.find(
              (item) =>
                item.id ===
                resultSet.orderItemId
            )

          if (!order || !orderItem) {
            return
          }

          records.push({
            id: resultSet.id,
            order,
            orderItem,
            resultSet,
          })
        }
      )

      return records.sort(
        (
          firstRecord,
          secondRecord
        ) =>
          new Date(
            secondRecord.resultSet
              .releasedAt ??
              secondRecord.resultSet
                .updatedAt
          ).getTime() -
          new Date(
            firstRecord.resultSet
              .releasedAt ??
              firstRecord.resultSet
                .updatedAt
          ).getTime()
      )
    }, [
      laboratoryOrders,
      patientId,
      resultSets,
    ])

  const filteredRecords =
    useMemo(
      () =>
        releasedRecords.filter(
          (record) => {
            const matchesSearch =
              matchesResultSearch(
                record,
                search
              )

            const matchesFlag =
              resultFilter === "all" ||
              (
                resultFilter ===
                  "normal" &&
                !recordHasAbnormalResult(
                  record
                )
              ) ||
              (
                resultFilter ===
                  "abnormal" &&
                recordHasAbnormalResult(
                  record
                )
              ) ||
              (
                resultFilter ===
                  "critical" &&
                recordHasCriticalResult(
                  record
                )
              )

            return (
              matchesSearch &&
              matchesFlag
            )
          }
        ),
      [
        releasedRecords,
        resultFilter,
        search,
      ]
    )

  const viewingRecord =
    releasedRecords.find(
      (record) =>
        record.id ===
        viewingRecordId
    ) ?? null

  const abnormalPanelCount =
    releasedRecords.filter(
      recordHasAbnormalResult
    ).length

  const criticalResultCount =
    releasedRecords.reduce(
      (count, record) =>
        count +
        record.resultSet.entries.filter(
          entryIsCritical
        ).length,
      0
    )

  const latestReleasedAt =
    releasedRecords[0]
      ?.resultSet.releasedAt ??
    null

  const hasActiveFilters =
    search.trim().length > 0 ||
    resultFilter !== "all"

  function resetFilters() {
    setSearch("")
    setResultFilter("all")
  }

  return (
    <>
      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
            <FlaskConical
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Released Laboratory Results
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Read-only laboratory result
              panels that completed technical
              verification and release.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Released panels
              </p>

              <p className="mt-1 text-xl font-semibold">
                {releasedRecords.length}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                With abnormal flags
              </p>

              <p className="mt-1 text-xl font-semibold">
                {abnormalPanelCount}
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              criticalResultCount > 0
                ? "border-rose-200 bg-rose-50/40 shadow-none"
                : "shadow-none"
            }
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Critical results
              </p>

              <p className="mt-1 text-xl font-semibold">
                {criticalResultCount}
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
                  "No released result"
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
                  placeholder="Search test, order, analyte, clinician, or branch"
                  className="pl-8"
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={resultFilter}
                className={selectClassName}
                onChange={(event) => {
                  const nextFilter =
                    event.target.value

                  if (
                    isResultFilter(
                      nextFilter
                    )
                  ) {
                    setResultFilter(
                      nextFilter
                    )
                  }
                }}
              >
                {PATIENT_LABORATORY_RESULT_FILTERS.map(
                  (filter) => (
                    <option
                      key={filter}
                      value={filter}
                    >
                      {
                        resultFilterLabels[
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
              result panels
            </p>
          </div>

          {releasedRecords.length ===
          0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <FlaskConical
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold">
                No released laboratory
                results
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Laboratory results appear
                here only after technical
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
                No matching released results
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
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Laboratory test
                  </TableHead>

                  <TableHead>
                    Order
                  </TableHead>

                  <TableHead>
                    Released
                  </TableHead>

                  <TableHead>
                    Abnormal flags
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    <span className="sr-only">
                      Result action
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map(
                  (record) => {
                    const abnormalCount =
                      record.resultSet
                        .entries.filter(
                          entryIsAbnormal
                        ).length

                    const criticalCount =
                      record.resultSet
                        .entries.filter(
                          entryIsCritical
                        ).length

                    return (
                      <TableRow
                        key={record.id}
                      >
                        <TableCell>
                          <p className="font-medium">
                            {
                              record
                                .resultSet
                                .testName
                            }
                          </p>

                          <p className="font-mono text-xs text-teal-700">
                            {
                              record
                                .resultSet
                                .testCode
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
                              record
                                .resultSet
                                .releasedAt
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              record
                                .resultSet
                                .releasedBy
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          {abnormalCount ===
                          0 ? (
                            <span className="text-sm text-emerald-700">
                              None
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertTriangle
                                className="size-4 text-amber-700"
                                aria-hidden="true"
                              />

                              <span className="text-sm">
                                {abnormalCount}
                                {criticalCount >
                                0
                                  ? ` (${criticalCount} critical)`
                                  : ""}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <LaboratoryResultStatusBadge
                            status={
                              record
                                .resultSet
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
                            View result
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }
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
            Result values, reference limits,
            flags, professional names, and
            timestamps are synthetic
            development data. Production
            access requires authentication,
            role authorization, and
            laboratory-release controls.
          </p>
        </div>
      </section>

      <PatientLaboratoryResultDetailsSheet
        record={viewingRecord}
        open={Boolean(viewingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
      />
    </>
  )
}
