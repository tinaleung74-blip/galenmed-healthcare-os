"use client"

import {
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  Ban,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Stethoscope,
  UserCheck,
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
import { AppointmentCancelDialog } from "@/features/appointments/components/appointment-cancel-dialog"
import { AppointmentDetailsSheet } from "@/features/appointments/components/appointment-details-sheet"
import { AppointmentFormDialog } from "@/features/appointments/components/appointment-form-dialog"
import { AppointmentNoShowDialog } from "@/features/appointments/components/appointment-no-show-dialog"
import {
  AppointmentPriorityBadge,
  AppointmentStatusBadge,
} from "@/features/appointments/components/appointment-status-badges"
import {
  APPOINTMENT_DEPARTMENTS,
  APPOINTMENT_DOCTORS,
  APPOINTMENT_SCHEDULE_VIEW_LABELS,
  APPOINTMENT_STATUS_LABELS,
  DEFAULT_APPOINTMENT_FILTERS,
} from "@/features/appointments/constants/appointment.constants"
import { useAppointmentAudit } from "@/features/appointments/providers/appointment-audit-provider"
import { useAppointments } from "@/features/appointments/providers/appointment-provider"
import type { AppointmentFormValues } from "@/features/appointments/schemas/appointment.schema"
import {
  APPOINTMENT_SCHEDULE_VIEWS,
  APPOINTMENT_STATUSES,
  type AppointmentFilters,
  type AppointmentRecord,
  type AppointmentScheduleView,
  type AppointmentStatus,
} from "@/features/appointments/types/appointment.types"
import {
  formatAppointmentRange,
} from "@/features/appointments/utils/appointment.utils"
import {
  CONSULTATION_MODES,
} from "@/features/consultations/types/consultation.types"
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_VISIT_TYPE_LABELS,
} from "@/features/consultations/constants/consultation.constants"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  getPatientFullName,
  getPatientInitials,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import { cn } from "@/lib/utils"

const statusOrder: Record<
  AppointmentStatus,
  number
> = {
  "in-consultation": 0,
  "checked-in": 1,
  confirmed: 2,
  scheduled: 3,
  completed: 4,
  cancelled: 5,
  "no-show": 6,
}

const selectedDateFormatter =
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function getLocalDateKey(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-")
}

function formatSelectedDate(
  value: string
): string {
  const date =
    new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable"
  }

  return selectedDateFormatter.format(
    date
  )
}

function matchesScheduleView(
  appointment:
    AppointmentRecord,

  selectedDate: string,

  scheduleView:
    AppointmentScheduleView
): boolean {
  if (scheduleView === "all") {
    return true
  }

  const appointmentDate =
    getLocalDateKey(
      appointment.scheduledStartAt
    )

  if (scheduleView === "day") {
    return (
      appointmentDate ===
      selectedDate
    )
  }

  const weekStart =
    new Date(
      `${selectedDate}T00:00:00`
    )

  if (
    Number.isNaN(
      weekStart.getTime()
    )
  ) {
    return false
  }

  const weekEnd =
    new Date(weekStart)

  weekEnd.setDate(
    weekEnd.getDate() + 6
  )

  const appointmentTimestamp =
    new Date(
      `${appointmentDate}T00:00:00`
    ).getTime()

  return (
    appointmentTimestamp >=
      weekStart.getTime() &&
    appointmentTimestamp <=
      weekEnd.getTime()
  )
}

function isAppointmentStatusFilter(
  value: string
): value is
  | AppointmentStatus
  | "all" {
  return (
    value === "all" ||
    APPOINTMENT_STATUSES.some(
      (status) => status === value
    )
  )
}

function isScheduleView(
  value: string
): value is AppointmentScheduleView {
  return APPOINTMENT_SCHEDULE_VIEWS.some(
    (view) => view === value
  )
}

function findPatient(
  patients:
    readonly Patient[],
  patientId: string
): Patient | null {
  return (
    patients.find(
      (patient) =>
        patient.id === patientId
    ) ?? null
  )
}

function matchesAppointmentSearch(
  appointment:
    AppointmentRecord,

  patient: Patient | null,

  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableAppointment =
    normalizePatientSearch(
      appointment.appointmentNumber,
      appointment.linkedConsultationNumber,
      appointment.chiefComplaint,
      appointment.doctorName,
      appointment.departmentName,
      appointment.branchName,
      appointment.roomName,
      appointment.internalNotes,
      patient
        ? getPatientFullName(patient)
        : null,
      patient?.medicalRecordNumber,
      patient?.mobileNumber,
      patient?.emailAddress
    )

  return searchableAppointment.includes(
    normalizedSearch
  )
}

export function AppointmentScheduleWorkspace() {
  const router = useRouter()

  const { patients } =
    usePatients()

  const {
    recordAppointmentRevision,
  } = useAppointmentAudit()

  const {
    appointments,
    createAppointment,
    updateAppointment,
    linkAppointmentConsultation,
    confirmAppointment,
    checkInAppointment,
    cancelAppointment,
    markAppointmentNoShow,
  } = useAppointments()

  const {
    queueAppointmentConsultation,
  } = useConsultations()

  const [filters, setFilters] =
    useState<AppointmentFilters>(
      () => ({
        ...DEFAULT_APPOINTMENT_FILTERS,
      })
    )

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    viewingAppointmentId,
    setViewingAppointmentId,
  ] = useState<string | null>(null)

  const [
    editingAppointmentId,
    setEditingAppointmentId,
  ] = useState<string | null>(null)

  const [
    cancellingAppointmentId,
    setCancellingAppointmentId,
  ] = useState<string | null>(null)

  const [
    noShowAppointmentId,
    setNoShowAppointmentId,
  ] = useState<string | null>(null)

  const filteredAppointments =
    useMemo(
      () =>
        appointments
          .filter((appointment) => {
            const patient =
              findPatient(
                patients,
                appointment.patientId
              )

            const matchesSearch =
              matchesAppointmentSearch(
                appointment,
                patient,
                filters.search
              )

            const matchesStatus =
              filters.status === "all" ||
              appointment.status ===
                filters.status

            const matchesBranch =
              filters.branchId ===
                "all" ||
              appointment.branchId ===
                filters.branchId

            const matchesDepartment =
              filters.departmentId ===
                "all" ||
              appointment.departmentId ===
                filters.departmentId

            const matchesDoctor =
              filters.doctorId ===
                "all" ||
              appointment.doctorId ===
                filters.doctorId

            const matchesMode =
              filters.mode === "all" ||
              appointment.mode ===
                filters.mode

            const matchesDate =
              matchesScheduleView(
                appointment,
                filters.selectedDate,
                filters.scheduleView
              )

            return (
              matchesSearch &&
              matchesStatus &&
              matchesBranch &&
              matchesDepartment &&
              matchesDoctor &&
              matchesMode &&
              matchesDate
            )
          })
          .sort(
            (
              firstAppointment,
              secondAppointment
            ) =>
              statusOrder[
                firstAppointment.status
              ] -
                statusOrder[
                  secondAppointment.status
                ] ||
              new Date(
                firstAppointment.scheduledStartAt
              ).getTime() -
                new Date(
                  secondAppointment.scheduledStartAt
                ).getTime()
          ),
      [appointments, patients, filters]
    )

  const selectedDayAppointments =
    appointments.filter(
      (appointment) =>
        getLocalDateKey(
          appointment.scheduledStartAt
        ) === filters.selectedDate
    )

  const upcomingCount =
    selectedDayAppointments.filter(
      (appointment) =>
        appointment.status ===
          "scheduled" ||
        appointment.status ===
          "confirmed"
    ).length

  const checkedInCount =
    selectedDayAppointments.filter(
      (appointment) =>
        appointment.status ===
        "checked-in"
    ).length

  const inConsultationCount =
    selectedDayAppointments.filter(
      (appointment) =>
        appointment.status ===
        "in-consultation"
    ).length

  const completedCount =
    selectedDayAppointments.filter(
      (appointment) =>
        appointment.status ===
        "completed"
    ).length

  const viewingAppointment =
    appointments.find(
      (appointment) =>
        appointment.id ===
        viewingAppointmentId
    ) ?? null

  const editingAppointment =
    appointments.find(
      (appointment) =>
        appointment.id ===
        editingAppointmentId
    ) ?? null

  const cancellingAppointment =
    appointments.find(
      (appointment) =>
        appointment.id ===
        cancellingAppointmentId
    ) ?? null

  const noShowAppointment =
    appointments.find(
      (appointment) =>
        appointment.id ===
        noShowAppointmentId
    ) ?? null

  const viewingPatient =
    viewingAppointment
      ? findPatient(
          patients,
          viewingAppointment.patientId
        )
      : null

  const cancellingPatient =
    cancellingAppointment
      ? findPatient(
          patients,
          cancellingAppointment.patientId
        )
      : null

  const noShowPatient =
    noShowAppointment
      ? findPatient(
          patients,
          noShowAppointment.patientId
        )
      : null

  const hasActiveFilters =
    filters.search.trim().length >
      0 ||
    filters.status !== "all" ||
    filters.branchId !== "all" ||
    filters.departmentId !==
      "all" ||
    filters.doctorId !== "all" ||
    filters.mode !== "all" ||
    filters.scheduleView !==
      "day" ||
    filters.selectedDate !==
      "2026-07-31"

  function updateFilter<
    Key extends keyof AppointmentFilters,
  >(
    key: Key,
    value:
      AppointmentFilters[Key]
  ) {
    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        [key]: value,
      })
    )
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_APPOINTMENT_FILTERS,
    })
  }

  async function handleCreateAppointment(
    values: AppointmentFormValues
  ): Promise<void> {
    const appointment =
      createAppointment(values)

    toast.success(
      "Appointment created",
      {
        description: `${appointment.appointmentNumber} was scheduled successfully.`,
      }
    )
  }

  async function handleUpdateAppointment(
    values: AppointmentFormValues
  ): Promise<void> {
    if (!editingAppointment) {
      throw new Error(
        "No appointment was selected."
      )
    }

    const previousAppointment =
      editingAppointment

    const appointment =
      updateAppointment(
        previousAppointment.id,
        values
      )

    recordAppointmentRevision(
      previousAppointment,
      appointment
    )

    toast.success(
      "Appointment updated",
      {
        description: `${appointment.appointmentNumber} was updated successfully.`,
      }
    )
  }

  function handleConfirmAppointment(
    appointment:
      AppointmentRecord
  ) {
    try {
      const confirmed =
        confirmAppointment(
          appointment.id
        )

      toast.success(
        "Appointment confirmed",
        {
          description: `${confirmed.appointmentNumber} is now confirmed.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to confirm appointment",
        {
          description:
            error instanceof Error
              ? error.message
              : "The appointment could not be confirmed.",
        }
      )
    }
  }

  function handleCheckInAppointment(
    appointment:
      AppointmentRecord
  ) {
    try {
      const checkedIn =
        checkInAppointment(
          appointment.id
        )

      let consultationNumber =
        checkedIn.linkedConsultationNumber

      if (!consultationNumber) {
        const consultation =
          queueAppointmentConsultation(
            checkedIn
          )

        const linkedAppointment =
          linkAppointmentConsultation(
            checkedIn.id,
            consultation.id,
            consultation.consultationNumber
          )

        consultationNumber =
          linkedAppointment.linkedConsultationNumber
      }

      toast.success(
        "Patient checked in",
        {
          description: consultationNumber
            ? `${checkedIn.appointmentNumber} was sent to Consultation Queue as ${consultationNumber}.`
            : `${checkedIn.appointmentNumber} was checked in.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to check in patient",
        {
          description:
            error instanceof Error
              ? error.message
              : "The appointment could not be checked in.",
        }
      )
    }
  }

  function handleConfirmCancel(
    cancellationReason: string
  ) {
    if (!cancellingAppointment) {
      return
    }

    try {
      const cancelled =
        cancelAppointment(
          cancellingAppointment.id,
          cancellationReason
        )

      toast.success(
        "Appointment cancelled",
        {
          description: `${cancelled.appointmentNumber} was cancelled.`,
        }
      )

      setCancellingAppointmentId(
        null
      )
    } catch (error) {
      toast.error(
        "Unable to cancel appointment",
        {
          description:
            error instanceof Error
              ? error.message
              : "The appointment could not be cancelled.",
        }
      )
    }
  }

  function handleConfirmNoShow() {
    if (!noShowAppointment) {
      return
    }

    try {
      const noShow =
        markAppointmentNoShow(
          noShowAppointment.id
        )

      toast.success(
        "Appointment marked no-show",
        {
          description: `${noShow.appointmentNumber} was updated.`,
        }
      )

      setNoShowAppointmentId(
        null
      )
    } catch (error) {
      toast.error(
        "Unable to mark no-show",
        {
          description:
            error instanceof Error
              ? error.message
              : "The appointment could not be updated.",
        }
      )
    }
  }

  function openPatientProfile(
    patient: Patient
  ) {
    setViewingAppointmentId(null)

    router.push(
      `/patients/${encodeURIComponent(
        patient.medicalRecordNumber
      )}`
    )
  }

  function openConsultation(
    consultationId: string
  ) {
    setViewingAppointmentId(null)

    router.push(
      `/consultations/${encodeURIComponent(
        consultationId
      )}`
    )
  }

  function editFromDetails(
    appointment:
      AppointmentRecord
  ) {
    setViewingAppointmentId(null)
    setEditingAppointmentId(
      appointment.id
    )
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
              <CalendarDays
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                {formatSelectedDate(
                  filters.selectedDate
                )}
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Appointments &amp; Scheduling
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage provider schedules,
                patient bookings, check-in, and
                Consultation Queue handoff.
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
            Create appointment
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                <Clock3
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Scheduled / Confirmed
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {upcomingCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                <UserCheck
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Checked in
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {checkedInCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
                <Stethoscope
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  In consultation
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {inConsultationCount}
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
                  placeholder="Search patient, MRN, appointment, doctor, or complaint"
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
                <Input
                  type="date"
                  value={
                    filters.selectedDate
                  }
                  className="w-auto"
                  onChange={(event) =>
                    updateFilter(
                      "selectedDate",
                      event.target.value
                    )
                  }
                />

                <select
                  value={
                    filters.scheduleView
                  }
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isScheduleView(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "scheduleView",
                        event.target.value
                      )
                    }
                  }}
                >
                  {APPOINTMENT_SCHEDULE_VIEWS.map(
                    (view) => (
                      <option
                        key={view}
                        value={view}
                      >
                        {
                          APPOINTMENT_SCHEDULE_VIEW_LABELS[
                            view
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.status}
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isAppointmentStatusFilter(
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

                  {APPOINTMENT_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          APPOINTMENT_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.branchId}
                  className={selectClassName}
                  onChange={(event) =>
                    updateFilter(
                      "branchId",
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All branches
                  </option>

                  {GALENMED_BRANCHES.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filters.departmentId
                  }
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

                  {APPOINTMENT_DEPARTMENTS.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.doctorId}
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

                  {APPOINTMENT_DOCTORS.map(
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
                  className={selectClassName}
                  onChange={(event) =>
                    updateFilter(
                      "mode",
                      event.target.value as
                        AppointmentFilters["mode"]
                    )
                  }
                >
                  <option value="all">
                    All modes
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
            </div>

            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {filteredAppointments.length} of{" "}
              {appointments.length} appointment
              records
            </p>
          </div>

          {filteredAppointments.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <CalendarCheck2
                className="size-8 text-teal-700"
                aria-hidden="true"
              />

              <h2 className="mt-4 text-base font-semibold">
                No matching appointments
              </h2>

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
            <Table className="min-w-[1550px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>
                    Appointment
                  </TableHead>

                  <TableHead>
                    Patient
                  </TableHead>

                  <TableHead>
                    Schedule
                  </TableHead>

                  <TableHead>
                    Doctor / Department
                  </TableHead>

                  <TableHead>
                    Mode / Visit
                  </TableHead>

                  <TableHead>
                    Reason
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Primary action
                  </TableHead>

                  <TableHead>
                    <span className="sr-only">
                      Appointment actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAppointments.map(
                  (appointment) => {
                    const patient =
                      findPatient(
                        patients,
                        appointment.patientId
                      )

                    const patientName =
                      patient
                        ? getPatientFullName(
                            patient
                          )
                        : "Patient unavailable"

                    const canEdit =
                      appointment.status ===
                        "scheduled" ||
                      appointment.status ===
                        "confirmed"

                    const canCancel =
                      appointment.status ===
                        "scheduled" ||
                      appointment.status ===
                        "confirmed" ||
                      appointment.status ===
                        "checked-in"

                    const canMarkNoShow =
                      appointment.status ===
                        "scheduled" ||
                      appointment.status ===
                        "confirmed"

                    return (
                      <TableRow
                        key={appointment.id}
                        className={cn(
                          appointment.priority ===
                            "urgent" &&
                            "bg-rose-50/40",

                          (appointment.status ===
                            "cancelled" ||
                            appointment.status ===
                              "no-show") &&
                            "bg-slate-50/70"
                        )}
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {
                              appointment.appointmentNumber
                            }
                          </p>

                          <div className="mt-2">
                            <AppointmentPriorityBadge
                              priority={
                                appointment.priority
                              }
                            />
                          </div>

                          {appointment.linkedConsultationId ? (
                            <p className="mt-2 font-mono text-xs text-teal-700">
                              {
                                appointment.linkedConsultationNumber
                              }
                            </p>
                          ) : null}
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

                            <div>
                              <p className="font-medium">
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
                          <p className="max-w-72 whitespace-normal">
                            {formatAppointmentRange(
                              appointment
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              appointment.durationMinutes
                            }{" "}
                            minutes
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {
                              appointment.doctorName
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              appointment.departmentName
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {appointment.roomName ??
                              "Telemedicine"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            {
                              CONSULTATION_MODE_LABELS[
                                appointment.mode
                              ]
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              CONSULTATION_VISIT_TYPE_LABELS[
                                appointment.visitType
                              ]
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="max-w-xs whitespace-normal">
                            {
                              appointment.chiefComplaint
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <AppointmentStatusBadge
                            status={
                              appointment.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {appointment.status ===
                          "scheduled" ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                handleConfirmAppointment(
                                  appointment
                                )
                              }
                            >
                              <CalendarCheck2
                                aria-hidden="true"
                              />
                              Confirm
                            </Button>
                          ) : appointment.status ===
                            "confirmed" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-teal-700 text-white hover:bg-teal-800"
                              onClick={() =>
                                handleCheckInAppointment(
                                  appointment
                                )
                              }
                            >
                              <UserCheck
                                aria-hidden="true"
                              />
                              Check in
                            </Button>
                          ) : appointment.status ===
                              "checked-in" &&
                            !appointment.linkedConsultationId ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-teal-700 text-white hover:bg-teal-800"
                              onClick={() =>
                                handleCheckInAppointment(
                                  appointment
                                )
                              }
                            >
                              <Stethoscope
                                aria-hidden="true"
                              />
                              Send to queue
                            </Button>
                          ) : appointment.linkedConsultationId ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openConsultation(appointment.linkedConsultationId!)
                              }
                            >
                              <Stethoscope
                                aria-hidden="true"
                              />
                              Open encounter
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setViewingAppointmentId(
                                  appointment.id
                                )
                              }
                            >
                              <Eye
                                aria-hidden="true"
                              />
                              Details
                            </Button>
                          )}
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
                                  Appointment actions
                                </DropdownMenuLabel>

                                <DropdownMenuItem
                                  onClick={() =>
                                    setViewingAppointmentId(
                                      appointment.id
                                    )
                                  }
                                >
                                  <Eye
                                    aria-hidden="true"
                                  />
                                  View details
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  disabled={!canEdit}
                                  onClick={() =>
                                    setEditingAppointmentId(
                                      appointment.id
                                    )
                                  }
                                >
                                  <Pencil
                                    aria-hidden="true"
                                  />
                                  {canEdit
                                    ? "Edit or reschedule"
                                    : "Read-only appointment"}
                                </DropdownMenuItem>
                              </DropdownMenuGroup>

                              {canMarkNoShow ? (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      setNoShowAppointmentId(
                                        appointment.id
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

                              {canCancel ? (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      setCancellingAppointmentId(
                                        appointment.id
                                      )
                                    }
                                  >
                                    <Ban
                                      aria-hidden="true"
                                    />
                                    Cancel appointment
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

      <AppointmentFormDialog
        mode="create"
        defaultAppointmentDate={
          filters.selectedDate
        }
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        onSubmitAppointment={
          handleCreateAppointment
        }
      />

      <AppointmentFormDialog
        mode="edit"
        record={editingAppointment}
        defaultAppointmentDate={
          filters.selectedDate
        }
        open={Boolean(
          editingAppointment
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingAppointmentId(
              null
            )
          }
        }}
        onSubmitAppointment={
          handleUpdateAppointment
        }
      />

      <AppointmentDetailsSheet
        appointment={viewingAppointment}
        patient={viewingPatient}
        open={Boolean(
          viewingAppointment &&
            viewingPatient
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingAppointmentId(
              null
            )
          }
        }}
        onEditAppointment={
          editFromDetails
        }
        onOpenPatientProfile={
          openPatientProfile
        }
        onOpenConsultation={
          openConsultation
        }
      />

      <AppointmentCancelDialog
        appointment={
          cancellingAppointment
        }
        patientName={
          cancellingPatient
            ? getPatientFullName(
                cancellingPatient
              )
            : "Selected patient"
        }
        open={Boolean(
          cancellingAppointment
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCancellingAppointmentId(
              null
            )
          }
        }}
        onConfirmCancel={
          handleConfirmCancel
        }
      />

      <AppointmentNoShowDialog
        appointment={
          noShowAppointment
        }
        patientName={
          noShowPatient
            ? getPatientFullName(
                noShowPatient
              )
            : "Selected patient"
        }
        open={Boolean(
          noShowAppointment
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setNoShowAppointmentId(
              null
            )
          }
        }}
        onConfirmNoShow={
          handleConfirmNoShow
        }
      />
    </>
  )
}
