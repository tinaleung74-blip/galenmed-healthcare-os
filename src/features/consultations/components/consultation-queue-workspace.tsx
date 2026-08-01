"use client"

import {
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  MoreHorizontal,
  Play,
  RotateCcw,
  Search,
  Stethoscope,
  UserX,
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
import { ConsultationCancelDialog } from "@/features/consultations/components/consultation-cancel-dialog"
import { ConsultationDetailsSheet } from "@/features/consultations/components/consultation-details-sheet"
import { ConsultationNoShowDialog } from "@/features/consultations/components/consultation-no-show-dialog"
import {
  ConsultationPriorityBadge,
  ConsultationStatusBadge,
} from "@/features/consultations/components/consultation-status-badges"
import {
  CONSULTATION_DATE_FILTER_LABELS,
  CONSULTATION_DEPARTMENTS,
  CONSULTATION_DOCTORS,
  CONSULTATION_MODE_LABELS,
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_VISIT_TYPE_LABELS,
  DEFAULT_CONSULTATION_FILTERS,
} from "@/features/consultations/constants/consultation.constants"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import {
  CONSULTATION_DATE_FILTERS,
  CONSULTATION_MODES,
  CONSULTATION_STATUSES,
  type ConsultationDateFilter,
  type ConsultationEncounter,
  type ConsultationFilters,
  type ConsultationMode,
  type ConsultationStatus,
} from "@/features/consultations/types/consultation.types"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  getPatientFullName,
  getPatientInitials,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import { cn } from "@/lib/utils"

const JULY_31_START =
  new Date(
    "2026-07-31T00:00:00+08:00"
  ).getTime()

const JULY_31_END =
  new Date(
    "2026-07-31T23:59:59.999+08:00"
  ).getTime()

const AUGUST_6_END =
  new Date(
    "2026-08-06T23:59:59.999+08:00"
  ).getTime()

const consultationScheduleFormatter =
  new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

const consultationTimeFormatter =
  new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  })

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

const consultationStatusOrder: Record<
  ConsultationStatus,
  number
> = {
  "in-progress": 0,
  waiting: 1,
  completed: 2,
  cancelled: 3,
  "no-show": 4,
}

function isConsultationStatusFilter(
  value: string
): value is ConsultationStatus | "all" {
  return (
    value === "all" ||
    CONSULTATION_STATUSES.some(
      (status) => status === value
    )
  )
}

function isConsultationModeFilter(
  value: string
): value is ConsultationMode | "all" {
  return (
    value === "all" ||
    CONSULTATION_MODES.some(
      (mode) => mode === value
    )
  )
}

function isConsultationDateFilter(
  value: string
): value is ConsultationDateFilter {
  return CONSULTATION_DATE_FILTERS.some(
    (dateFilter) => dateFilter === value
  )
}

function matchesConsultationDateRange(
  scheduledAt: string,
  dateRange: ConsultationDateFilter
): boolean {
  if (dateRange === "all") {
    return true
  }

  const scheduledTimestamp =
    new Date(scheduledAt).getTime()

  if (Number.isNaN(scheduledTimestamp)) {
    return false
  }

  if (dateRange === "today") {
    return (
      scheduledTimestamp >= JULY_31_START &&
      scheduledTimestamp <= JULY_31_END
    )
  }

  return (
    scheduledTimestamp >= JULY_31_START &&
    scheduledTimestamp <= AUGUST_6_END
  )
}

function isScheduledOnJuly31(
  scheduledAt: string
): boolean {
  const scheduledTimestamp =
    new Date(scheduledAt).getTime()

  return (
    scheduledTimestamp >= JULY_31_START &&
    scheduledTimestamp <= JULY_31_END
  )
}

function formatConsultationSchedule(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Schedule unavailable"
  }

  return consultationScheduleFormatter.format(
    date
  )
}

function formatConsultationTime(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable"
  }

  return consultationTimeFormatter.format(
    date
  )
}

function findPatient(
  patients: Patient[],
  patientId: string
): Patient | null {
  return (
    patients.find(
      (patient) => patient.id === patientId
    ) ?? null
  )
}

function matchesConsultationSearch(
  consultation: ConsultationEncounter,
  patient: Patient | null,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableConsultation =
    normalizePatientSearch(
      consultation.consultationNumber,
      consultation.chiefComplaint,
      consultation.departmentName,
      consultation.doctorName,
      consultation.roomName,
      CONSULTATION_MODE_LABELS[
        consultation.mode
      ],
      CONSULTATION_VISIT_TYPE_LABELS[
        consultation.visitType
      ],
      patient
        ? getPatientFullName(patient)
        : null,
      patient?.medicalRecordNumber,
      patient?.mobileNumber,
      patient?.emailAddress
    )

  return searchableConsultation.includes(
    normalizedSearch
  )
}

export function ConsultationQueueWorkspace() {
  const router = useRouter()

  const { patients } = usePatients()

  const {
    consultations,
    startConsultation,
    cancelConsultation,
    markConsultationNoShow,
  } = useConsultations()

  const [filters, setFilters] =
    useState<ConsultationFilters>(() => ({
      ...DEFAULT_CONSULTATION_FILTERS,
    }))

  const [
    viewingConsultationId,
    setViewingConsultationId,
  ] = useState<string | null>(null)

  const [
    cancellingConsultationId,
    setCancellingConsultationId,
  ] = useState<string | null>(null)

  const [
    noShowConsultationId,
    setNoShowConsultationId,
  ] = useState<string | null>(null)

  const filteredConsultations = useMemo(
    () =>
      consultations
        .filter((consultation) => {
          const patient = findPatient(
            patients,
            consultation.patientId
          )

          const matchesSearch =
            matchesConsultationSearch(
              consultation,
              patient,
              filters.search
            )

          const matchesStatus =
            filters.status === "all" ||
            consultation.status ===
              filters.status

          const matchesDepartment =
            filters.departmentId === "all" ||
            consultation.departmentId ===
              filters.departmentId

          const matchesDoctor =
            filters.doctorId === "all" ||
            consultation.doctorId ===
              filters.doctorId

          const matchesMode =
            filters.mode === "all" ||
            consultation.mode === filters.mode

          const matchesDate =
            matchesConsultationDateRange(
              consultation.scheduledAt,
              filters.dateRange
            )

          return (
            matchesSearch &&
            matchesStatus &&
            matchesDepartment &&
            matchesDoctor &&
            matchesMode &&
            matchesDate
          )
        })
        .sort(
          (
            firstConsultation,
            secondConsultation
          ) => {
            const statusDifference =
              consultationStatusOrder[
                firstConsultation.status
              ] -
              consultationStatusOrder[
                secondConsultation.status
              ]

            if (statusDifference !== 0) {
              return statusDifference
            }

            const priorityDifference =
              Number(
                secondConsultation.priority ===
                  "urgent"
              ) -
              Number(
                firstConsultation.priority ===
                  "urgent"
              )

            if (priorityDifference !== 0) {
              return priorityDifference
            }

            return (
              new Date(
                firstConsultation.scheduledAt
              ).getTime() -
              new Date(
                secondConsultation.scheduledAt
              ).getTime()
            )
          }
        ),
    [consultations, patients, filters]
  )

  const july31Consultations =
    consultations.filter((consultation) =>
      isScheduledOnJuly31(
        consultation.scheduledAt
      )
    )

  const waitingCount =
    july31Consultations.filter(
      (consultation) =>
        consultation.status === "waiting"
    ).length

  const inProgressCount =
    july31Consultations.filter(
      (consultation) =>
        consultation.status === "in-progress"
    ).length

  const completedCount =
    july31Consultations.filter(
      (consultation) =>
        consultation.status === "completed"
    ).length

  const urgentActiveCount =
    july31Consultations.filter(
      (consultation) =>
        consultation.priority === "urgent" &&
        (consultation.status === "waiting" ||
          consultation.status ===
            "in-progress")
    ).length

  const viewingConsultation =
    consultations.find(
      (consultation) =>
        consultation.id ===
        viewingConsultationId
    ) ?? null

  const cancellingConsultation =
    consultations.find(
      (consultation) =>
        consultation.id ===
        cancellingConsultationId
    ) ?? null

  const noShowConsultation =
    consultations.find(
      (consultation) =>
        consultation.id ===
        noShowConsultationId
    ) ?? null

  const viewingPatient =
    viewingConsultation
      ? findPatient(
          patients,
          viewingConsultation.patientId
        )
      : null

  const cancellingPatient =
    cancellingConsultation
      ? findPatient(
          patients,
          cancellingConsultation.patientId
        )
      : null

  const noShowPatient =
    noShowConsultation
      ? findPatient(
          patients,
          noShowConsultation.patientId
        )
      : null

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.departmentId !== "all" ||
    filters.doctorId !== "all" ||
    filters.mode !== "all" ||
    filters.dateRange !== "today"

  function updateFilter<
    Key extends keyof ConsultationFilters,
  >(
    key: Key,
    value: ConsultationFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_CONSULTATION_FILTERS,
    })
  }

  function openEncounter(
    consultation: ConsultationEncounter
  ) {
    let encounter = consultation

    try {
      if (consultation.status === "waiting") {
        encounter = startConsultation(
          consultation.id
        )

        toast.success(
          "Consultation started",
          {
            description: `${encounter.consultationNumber} is now in progress.`,
          }
        )
      }

      setViewingConsultationId(null)

      router.push(
        `/consultations/${encodeURIComponent(
          encounter.id
        )}`
      )
    } catch {
      toast.error(
        "Unable to open consultation",
        {
          description:
            "The consultation could not be started or opened.",
        }
      )
    }
  }

  function handleConfirmCancel(
    cancellationReason: string
  ) {
    if (!cancellingConsultation) {
      return
    }

    try {
      const cancelledConsultation =
        cancelConsultation(
          cancellingConsultation.id,
          cancellationReason
        )

      toast.success(
        "Consultation cancelled",
        {
          description: `${cancelledConsultation.consultationNumber} was cancelled.`,
        }
      )

      setCancellingConsultationId(null)
    } catch {
      toast.error(
        "Unable to cancel consultation",
        {
          description:
            "The consultation could not be cancelled.",
        }
      )
    }
  }

  function handleConfirmNoShow() {
    if (!noShowConsultation) {
      return
    }

    try {
      const updatedConsultation =
        markConsultationNoShow(
          noShowConsultation.id
        )

      toast.success(
        "Patient marked as no-show",
        {
          description: `${updatedConsultation.consultationNumber} was updated.`,
        }
      )

      setNoShowConsultationId(null)
    } catch {
      toast.error(
        "Unable to mark no-show",
        {
          description:
            "The consultation status could not be updated.",
        }
      )
    }
  }

  function openPatientProfile(
    patient: Patient
  ) {
    setViewingConsultationId(null)

    router.push(
      `/patients/${encodeURIComponent(
        patient.medicalRecordNumber
      )}`
    )
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
            <Stethoscope
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Friday, July 31, 2026
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Consultation Queue
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage waiting, active, completed,
              cancelled, and no-show consultations.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                <Clock3
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Waiting
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {waitingCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                <Stethoscope
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  In progress
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {inProgressCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <CheckCircle2
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Completed
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {completedCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-rose-50/50 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-white p-2 text-rose-700">
                <CalendarClock
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-rose-700">
                  Urgent active
                </p>

                <p className="mt-1 text-xl font-semibold text-rose-800">
                  {urgentActiveCount}
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
                  placeholder="Search patient, MRN, consultation, or complaint"
                  aria-label="Search consultations"
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
                <select
                  value={filters.status}
                  aria-label="Filter consultation status"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isConsultationStatusFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "status",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All statuses
                  </option>

                  {CONSULTATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          CONSULTATION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.departmentId}
                  aria-label="Filter department"
                  className={selectClassName}
                  onChange={(event) =>
                    updateFilter(
                      "departmentId",
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All departments
                  </option>

                  {CONSULTATION_DEPARTMENTS.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.shortName}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.doctorId}
                  aria-label="Filter doctor"
                  className={selectClassName}
                  onChange={(event) =>
                    updateFilter(
                      "doctorId",
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All doctors
                  </option>

                  {CONSULTATION_DOCTORS.map(
                    (doctor) => (
                      <option
                        key={doctor.id}
                        value={doctor.id}
                      >
                        {doctor.name}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.mode}
                  aria-label="Filter consultation mode"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isConsultationModeFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "mode",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All consultation modes
                  </option>

                  {CONSULTATION_MODES.map(
                    (mode) => (
                      <option
                        key={mode}
                        value={mode}
                      >
                        {
                          CONSULTATION_MODE_LABELS[
                            mode
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.dateRange}
                  aria-label="Filter consultation date"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isConsultationDateFilter(
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
                  {CONSULTATION_DATE_FILTERS.map(
                    (dateFilter) => (
                      <option
                        key={dateFilter}
                        value={dateFilter}
                      >
                        {
                          CONSULTATION_DATE_FILTER_LABELS[
                            dateFilter
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

            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {filteredConsultations.length} of{" "}
              {consultations.length} consultation records
            </p>
          </div>

          {filteredConsultations.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />

              <h2 className="mt-4 text-base font-semibold">
                No matching consultations
              </h2>

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
            <Table className="min-w-[1500px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Queue</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Chief complaint</TableHead>
                  <TableHead>Doctor / Department</TableHead>
                  <TableHead>Mode / Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primary action</TableHead>
                  <TableHead>
                    <span className="sr-only">
                      Consultation actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredConsultations.map(
                  (consultation) => {
                    const patient = findPatient(
                      patients,
                      consultation.patientId
                    )

                    const patientName = patient
                      ? getPatientFullName(patient)
                      : "Patient unavailable"

                    const canOpenEncounter =
                      consultation.status ===
                        "waiting" ||
                      consultation.status ===
                        "in-progress" ||
                      consultation.status ===
                        "completed"

                    const primaryActionLabel =
                      consultation.status ===
                      "waiting"
                        ? "Start"
                        : consultation.status ===
                            "in-progress"
                          ? "Resume"
                          : consultation.status ===
                              "completed"
                            ? "View"
                            : "Details"

                    return (
                      <TableRow
                        key={consultation.id}
                        className={cn(
                          consultation.priority ===
                            "urgent" &&
                            (consultation.status ===
                              "waiting" ||
                              consultation.status ===
                                "in-progress") &&
                            "bg-rose-50/40",
                          (consultation.status ===
                            "cancelled" ||
                            consultation.status ===
                              "no-show") &&
                            "bg-slate-50/70"
                        )}
                      >
                        <TableCell>
                          <div>
                            <p className="text-lg font-semibold">
                              {consultation.queueNumber ===
                              null
                                ? "—"
                                : `#${consultation.queueNumber}`}
                            </p>

                            <ConsultationPriorityBadge
                              priority={
                                consultation.priority
                              }
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-60 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                              {patient
                                ? getPatientInitials(
                                    patient
                                  )
                                : "PT"}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {patientName}
                              </p>

                              <p className="font-mono text-xs text-muted-foreground">
                                {patient?.medicalRecordNumber ??
                                  "MRN unavailable"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {formatConsultationTime(
                              consultation.scheduledAt
                            )}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatConsultationSchedule(
                              consultation.scheduledAt
                            )}
                          </p>

                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {
                              consultation.consultationNumber
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="max-w-xs whitespace-normal">
                            {
                              consultation.chiefComplaint
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {consultation.doctorName}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              consultation.departmentName
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            {
                              CONSULTATION_MODE_LABELS[
                                consultation.mode
                              ]
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              CONSULTATION_VISIT_TYPE_LABELS[
                                consultation.visitType
                              ]
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <ConsultationStatusBadge
                            status={
                              consultation.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              canOpenEncounter
                                ? "default"
                                : "outline"
                            }
                            className={
                              canOpenEncounter
                                ? "bg-teal-700 text-white hover:bg-teal-800"
                                : ""
                            }
                            onClick={() => {
                              if (
                                canOpenEncounter
                              ) {
                                openEncounter(
                                  consultation
                                )
                              } else {
                                setViewingConsultationId(
                                  consultation.id
                                )
                              }
                            }}
                          >
                            {canOpenEncounter ? (
                              <Play aria-hidden="true" />
                            ) : (
                              <Eye aria-hidden="true" />
                            )}

                            {primaryActionLabel}
                          </Button>
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Open actions for ${patientName}`}
                                >
                                  <MoreHorizontal
                                    aria-hidden="true"
                                  />
                                </Button>
                              }
                            />

                            <DropdownMenuContent
                              align="end"
                              className="w-52"
                            >
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                  Consultation actions
                                </DropdownMenuLabel>

                                <DropdownMenuItem
                                  onClick={() =>
                                    setViewingConsultationId(
                                      consultation.id
                                    )
                                  }
                                >
                                  <Eye aria-hidden="true" />
                                  View details
                                </DropdownMenuItem>

                                {canOpenEncounter ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openEncounter(
                                        consultation
                                      )
                                    }
                                  >
                                    <Play
                                      aria-hidden="true"
                                    />
                                    {consultation.status ===
                                    "waiting"
                                      ? "Start consultation"
                                      : consultation.status ===
                                          "in-progress"
                                        ? "Resume consultation"
                                        : "View encounter"}
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuGroup>

                              {consultation.status ===
                              "waiting" ? (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      setNoShowConsultationId(
                                        consultation.id
                                      )
                                    }
                                  >
                                    <UserX
                                      aria-hidden="true"
                                    />
                                    Mark no-show
                                  </DropdownMenuItem>
                                </>
                              ) : null}

                              {consultation.status ===
                                "waiting" ||
                              consultation.status ===
                                "in-progress" ? (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      setCancellingConsultationId(
                                        consultation.id
                                      )
                                    }
                                  >
                                    <Ban
                                      aria-hidden="true"
                                    />
                                    Cancel consultation
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <ConsultationDetailsSheet
        consultation={viewingConsultation}
        patient={viewingPatient}
        open={Boolean(
          viewingConsultation &&
            viewingPatient
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingConsultationId(null)
          }
        }}
        onOpenEncounter={openEncounter}
        onOpenPatientProfile={
          openPatientProfile
        }
      />

      <ConsultationCancelDialog
        consultation={cancellingConsultation}
        patientName={
          cancellingPatient
            ? getPatientFullName(
                cancellingPatient
              )
            : "Selected patient"
        }
        open={Boolean(
          cancellingConsultation
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCancellingConsultationId(
              null
            )
          }
        }}
        onConfirmCancel={
          handleConfirmCancel
        }
      />

      <ConsultationNoShowDialog
        consultation={noShowConsultation}
        patientName={
          noShowPatient
            ? getPatientFullName(
                noShowPatient
              )
            : "Selected patient"
        }
        open={Boolean(noShowConsultation)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setNoShowConsultationId(null)
          }
        }}
        onConfirmNoShow={
          handleConfirmNoShow
        }
      />
    </>
  )
}
