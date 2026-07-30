"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  Activity,
  Archive,
  CalendarClock,
  Eye,
  HeartPulse,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Weight,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { VitalSignsArchiveDialog } from "@/features/patients/components/vital-signs-archive-dialog"
import { VitalSignsFormDialog } from "@/features/patients/components/vital-signs-form-dialog"
import { VitalSignsRecordDetailsSheet } from "@/features/patients/components/vital-signs-record-details-sheet"
import { VitalSignsRecordStatusBadge } from "@/features/patients/components/vital-signs-status-badges"
import {
  BLOOD_PRESSURE_POSITION_LABELS,
  OXYGEN_SUPPORT_LABELS,
  TEMPERATURE_SITE_LABELS,
  VITAL_SIGNS_CONTEXT_LABELS,
  VITAL_SIGNS_DATE_FILTER_LABELS,
  VITAL_SIGNS_RECORD_STATUS_LABELS,
  DEFAULT_VITAL_SIGNS_FILTERS,
} from "@/features/patients/constants/vital-signs.constants"
import { usePatientVitalSigns } from "@/features/patients/providers/patient-vital-signs-provider"
import type { VitalSignsFormValues } from "@/features/patients/schemas/vital-signs.schema"
import {
  VITAL_SIGNS_DATE_FILTERS,
  VITAL_SIGNS_MEASUREMENT_CONTEXTS,
  VITAL_SIGNS_RECORD_STATUSES,
  type VitalSignsDateFilter,
  type VitalSignsFilters,
  type VitalSignsMeasurementContext,
  type VitalSignsRecord,
  type VitalSignsRecordStatus,
} from "@/features/patients/types/vital-signs.types"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import {
  formatBloodPressure,
  formatVitalMeasurement,
} from "@/features/patients/utils/vital-signs.utils"

interface VitalSignsWorkspaceProps {
  patient: Patient
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function numberToSearchValue(
  value: number | null
): string | null {
  return value === null ? null : String(value)
}

function isContextFilter(
  value: string
): value is VitalSignsMeasurementContext | "all" {
  return (
    value === "all" ||
    VITAL_SIGNS_MEASUREMENT_CONTEXTS.some(
      (context) => context === value
    )
  )
}

function isRecordStatusFilter(
  value: string
): value is VitalSignsRecordStatus | "all" {
  return (
    value === "all" ||
    VITAL_SIGNS_RECORD_STATUSES.some(
      (status) => status === value
    )
  )
}

function isDateFilter(
  value: string
): value is VitalSignsDateFilter {
  return VITAL_SIGNS_DATE_FILTERS.some(
    (filter) => filter === value
  )
}

function matchesDateRange(
  measuredAt: string,
  dateRange: VitalSignsDateFilter
): boolean {
  if (dateRange === "all") {
    return true
  }

  const measurementDate = new Date(measuredAt)

  if (Number.isNaN(measurementDate.getTime())) {
    return false
  }

  const now = new Date()
  const earliestDate = new Date(now)

  if (dateRange === "last-7-days") {
    earliestDate.setDate(
      earliestDate.getDate() - 7
    )
  }

  if (dateRange === "last-30-days") {
    earliestDate.setDate(
      earliestDate.getDate() - 30
    )
  }

  if (dateRange === "last-90-days") {
    earliestDate.setDate(
      earliestDate.getDate() - 90
    )
  }

  return (
    measurementDate >= earliestDate &&
    measurementDate <= now
  )
}

function matchesVitalSignsSearch(
  record: VitalSignsRecord,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableRecord =
    normalizePatientSearch(
      VITAL_SIGNS_CONTEXT_LABELS[
        record.context
      ],
      formatPatientDateTime(record.measuredAt),
      formatBloodPressure(
        record.systolicBloodPressureMmHg,
        record.diastolicBloodPressureMmHg
      ),
      numberToSearchValue(
        record.heartRateBpm
      ),
      numberToSearchValue(
        record.respiratoryRatePerMinute
      ),
      numberToSearchValue(
        record.temperatureCelsius
      ),
      numberToSearchValue(
        record.oxygenSaturationPercent
      ),
      numberToSearchValue(record.heightCm),
      numberToSearchValue(record.weightKg),
      numberToSearchValue(record.bmi),
      numberToSearchValue(record.painScore),
      record.notes,
      record.recordedBy,
      record.updatedBy
    )

  return searchableRecord.includes(
    normalizedSearch
  )
}

export function VitalSignsWorkspace({
  patient,
}: VitalSignsWorkspaceProps) {
  const {
    vitalSignsRecords,
    createVitalSignsRecord,
    updateVitalSignsRecord,
    archiveVitalSignsRecord,
  } = usePatientVitalSigns()

  const [filters, setFilters] =
    useState<VitalSignsFilters>(() => ({
      ...DEFAULT_VITAL_SIGNS_FILTERS,
    }))

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    viewingRecordId,
    setViewingRecordId,
  ] = useState<string | null>(null)

  const [
    editingRecordId,
    setEditingRecordId,
  ] = useState<string | null>(null)

  const [
    archivingRecordId,
    setArchivingRecordId,
  ] = useState<string | null>(null)

  const patientRecords = useMemo(
    () =>
      vitalSignsRecords
        .filter(
          (record) =>
            record.patientId === patient.id
        )
        .sort(
          (firstRecord, secondRecord) =>
            new Date(
              secondRecord.measuredAt
            ).getTime() -
            new Date(
              firstRecord.measuredAt
            ).getTime()
        ),
    [vitalSignsRecords, patient.id]
  )

  const currentRecords = useMemo(
    () =>
      patientRecords.filter(
        (record) =>
          record.recordStatus === "current"
      ),
    [patientRecords]
  )

  const latestRecord =
    currentRecords[0] ?? null

  const filteredRecords = useMemo(
    () =>
      patientRecords.filter((record) => {
        const matchesSearch =
          matchesVitalSignsSearch(
            record,
            filters.search
          )

        const matchesContext =
          filters.context === "all" ||
          record.context === filters.context

        const matchesRecordStatus =
          filters.recordStatus === "all" ||
          record.recordStatus ===
            filters.recordStatus

        const matchesDate = matchesDateRange(
          record.measuredAt,
          filters.dateRange
        )

        return (
          matchesSearch &&
          matchesContext &&
          matchesRecordStatus &&
          matchesDate
        )
      }),
    [patientRecords, filters]
  )

  const viewingRecord =
    patientRecords.find(
      (record) =>
        record.id === viewingRecordId
    ) ?? null

  const editingRecord =
    patientRecords.find(
      (record) =>
        record.id === editingRecordId
    ) ?? null

  const archivingRecord =
    patientRecords.find(
      (record) =>
        record.id === archivingRecordId
    ) ?? null

  const archivedRecordCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "archived"
    ).length

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.context !== "all" ||
    filters.recordStatus !== "current" ||
    filters.dateRange !== "all"

  function updateFilter<
    Key extends keyof VitalSignsFilters,
  >(
    key: Key,
    value: VitalSignsFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_VITAL_SIGNS_FILTERS,
    })
  }

  async function handleCreateRecord(
    values: VitalSignsFormValues
  ): Promise<void> {
    const newRecord =
      createVitalSignsRecord(
        patient.id,
        values
      )

    toast.success("Vital signs recorded", {
      description: `Measurement set recorded for ${formatPatientDateTime(
        newRecord.measuredAt
      )}.`,
    })
  }

  async function handleUpdateRecord(
    values: VitalSignsFormValues
  ): Promise<void> {
    if (!editingRecord) {
      throw new Error(
        "No vital-sign record was selected."
      )
    }

    const updatedRecord =
      updateVitalSignsRecord(
        editingRecord.id,
        values
      )

    toast.success(
      "Vital-sign record updated",
      {
        description: `Measurement set for ${formatPatientDateTime(
          updatedRecord.measuredAt
        )} was updated.`,
      }
    )
  }

  function handleConfirmArchive(
    archiveReason: string
  ) {
    if (!archivingRecord) {
      return
    }

    try {
      const archivedRecord =
        archiveVitalSignsRecord(
          archivingRecord.id,
          archiveReason
        )

      toast.success(
        "Vital-sign record archived",
        {
          description: `Measurement set from ${formatPatientDateTime(
            archivedRecord.measuredAt
          )} remains available for audit reference.`,
        }
      )

      setArchivingRecordId(null)
    } catch {
      toast.error(
        "Unable to archive record",
        {
          description:
            "The vital-sign record could not be archived.",
        }
      )
    }
  }

  function editRecordFromDetails(
    record: VitalSignsRecord
  ) {
    setViewingRecordId(null)
    setEditingRecordId(record.id)
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
              <Activity
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Vital Signs
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Timestamped clinical measurement sets
                and longitudinal vital-sign history.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() =>
              setIsCreateDialogOpen(true)
            }
          >
            <Plus aria-hidden="true" />
            Record vital signs
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                <Activity
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Current records
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {currentRecords.length}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {archivedRecordCount} archived
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                <CalendarClock
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Latest measurement
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {latestRecord
                    ? formatPatientDateTime(
                        latestRecord.measuredAt
                      )
                    : "Not recorded"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
                <HeartPulse
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Latest blood pressure
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {latestRecord
                    ? formatBloodPressure(
                        latestRecord
                          .systolicBloodPressureMmHg,
                        latestRecord
                          .diastolicBloodPressureMmHg
                      )
                    : "Not recorded"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
                <Weight
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Latest calculated BMI
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {latestRecord?.bmi === null ||
                  !latestRecord
                    ? "Not available"
                    : `${latestRecord.bmi} kg/m²`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="space-y-4 border-b p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1 xl:max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  value={filters.search}
                  placeholder="Search measurements, notes, or recorded by"
                  aria-label="Search vital-sign records"
                  className="pl-8"
                  onChange={(event) =>
                    updateFilter(
                      "search",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <label
                  htmlFor="vital-sign-context-filter"
                  className="sr-only"
                >
                  Filter by measurement context
                </label>

                <select
                  id="vital-sign-context-filter"
                  value={filters.context}
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isContextFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "context",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All contexts
                  </option>

                  {VITAL_SIGNS_MEASUREMENT_CONTEXTS.map(
                    (context) => (
                      <option
                        key={context}
                        value={context}
                      >
                        {
                          VITAL_SIGNS_CONTEXT_LABELS[
                            context
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <label
                  htmlFor="vital-sign-date-filter"
                  className="sr-only"
                >
                  Filter by measurement date
                </label>

                <select
                  id="vital-sign-date-filter"
                  value={filters.dateRange}
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isDateFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "dateRange",
                        event.target.value
                      )
                    }
                  }}
                >
                  {VITAL_SIGNS_DATE_FILTERS.map(
                    (dateFilter) => (
                      <option
                        key={dateFilter}
                        value={dateFilter}
                      >
                        {
                          VITAL_SIGNS_DATE_FILTER_LABELS[
                            dateFilter
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <label
                  htmlFor="vital-sign-status-filter"
                  className="sr-only"
                >
                  Filter current or archived records
                </label>

                <select
                  id="vital-sign-status-filter"
                  value={filters.recordStatus}
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isRecordStatusFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "recordStatus",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All records
                  </option>

                  {VITAL_SIGNS_RECORD_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          VITAL_SIGNS_RECORD_STATUS_LABELS[
                            status
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
                    <RotateCcw aria-hidden="true" />
                    Reset
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>
                Showing {filteredRecords.length} of{" "}
                {patientRecords.length} measurement sets
              </p>

              <p>
                Default view shows current records.
              </p>
            </div>
          </div>

          {patientRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Activity
                className="size-8 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No vital signs recorded
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No timestamped measurement sets have
                been recorded for this patient.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching measurement records
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Change the search or filter values.
              </p>

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
            <Table className="min-w-[1360px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>
                    Measured at
                  </TableHead>
                  <TableHead>
                    Blood pressure
                  </TableHead>
                  <TableHead>
                    Pulse / Respiration
                  </TableHead>
                  <TableHead>
                    Temperature / SpO₂
                  </TableHead>
                  <TableHead>
                    Height / Weight / BMI
                  </TableHead>
                  <TableHead>
                    Pain
                  </TableHead>
                  <TableHead>
                    Status
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">
                      Record actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className={
                      record.recordStatus ===
                      "archived"
                        ? "bg-slate-50/70"
                        : undefined
                    }
                  >
                    <TableCell>
                      <div className="max-w-60 whitespace-normal">
                        <p className="font-medium">
                          {formatPatientDateTime(
                            record.measuredAt
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {
                            VITAL_SIGNS_CONTEXT_LABELS[
                              record.context
                            ]
                          }
                        </p>

                        {record.notes ? (
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {record.notes}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatBloodPressure(
                            record
                              .systolicBloodPressureMmHg,
                            record
                              .diastolicBloodPressureMmHg
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {
                            BLOOD_PRESSURE_POSITION_LABELS[
                              record
                                .bloodPressurePosition
                            ]
                          }
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p>
                          {formatVitalMeasurement(
                            record.heartRateBpm,
                            "bpm"
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatVitalMeasurement(
                            record
                              .respiratoryRatePerMinute,
                            "breaths/min"
                          )}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p>
                          {formatVitalMeasurement(
                            record
                              .temperatureCelsius,
                            "°C"
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {
                            TEMPERATURE_SITE_LABELS[
                              record.temperatureSite
                            ]
                          }
                        </p>

                        <p className="mt-1">
                          {formatVitalMeasurement(
                            record
                              .oxygenSaturationPercent,
                            "%"
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {
                            OXYGEN_SUPPORT_LABELS[
                              record.oxygenSupport
                            ]
                          }
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p>
                          {formatVitalMeasurement(
                            record.heightCm,
                            "cm"
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatVitalMeasurement(
                            record.weightKg,
                            "kg"
                          )}
                        </p>

                        <p className="mt-1 text-xs font-medium text-teal-700">
                          {formatVitalMeasurement(
                            record.bmi,
                            "kg/m²",
                            "BMI unavailable"
                          )}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {record.painScore === null
                        ? "Not recorded"
                        : `${record.painScore}/10`}
                    </TableCell>

                    <TableCell>
                      <VitalSignsRecordStatusBadge
                        status={record.recordStatus}
                      />
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Open actions for measurement recorded ${formatPatientDateTime(
                                record.measuredAt
                              )}`}
                            >
                              <MoreHorizontal
                                aria-hidden="true"
                              />
                            </Button>
                          }
                        />

                        <DropdownMenuContent
                          align="end"
                          className="w-48"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>
                              Record actions
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() =>
                                setViewingRecordId(
                                  record.id
                                )
                              }
                            >
                              <Eye aria-hidden="true" />
                              View record
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={
                                record.recordStatus ===
                                "archived"
                              }
                              onClick={() =>
                                setEditingRecordId(
                                  record.id
                                )
                              }
                            >
                              <Pencil
                                aria-hidden="true"
                              />
                              {record.recordStatus ===
                              "archived"
                                ? "Archived record"
                                : "Edit measurement"}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            disabled={
                              record.recordStatus ===
                              "archived"
                            }
                            onClick={() =>
                              setArchivingRecordId(
                                record.id
                              )
                            }
                          >
                            <Archive
                              aria-hidden="true"
                            />
                            {record.recordStatus ===
                            "archived"
                              ? "Already archived"
                              : "Archive record"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            Vital-sign records are measurement sets.
            They do not replace consultation notes,
            assessment, diagnosis, treatment, or
            emergency escalation procedures.
          </p>
        </div>
      </section>

      <VitalSignsFormDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmitRecord={handleCreateRecord}
      />

      <VitalSignsFormDialog
        mode="edit"
        record={editingRecord}
        open={Boolean(editingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingRecordId(null)
          }
        }}
        onSubmitRecord={handleUpdateRecord}
      />

      <VitalSignsRecordDetailsSheet
        record={viewingRecord}
        open={Boolean(viewingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
        onEditRecord={editRecordFromDetails}
      />

      <VitalSignsArchiveDialog
        record={archivingRecord}
        open={Boolean(archivingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setArchivingRecordId(null)
          }
        }}
        onConfirmArchive={
          handleConfirmArchive
        }
      />
    </>
  )
}
