"use client"

import {
  useEffect,
  useMemo,
  type ChangeEvent,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  CalendarPlus2,
  FilePenLine,
  LoaderCircle,
  Save,
  ShieldAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  APPOINTMENT_DEPARTMENTS,
  APPOINTMENT_DOCTORS,
  APPOINTMENT_PRIORITY_LABELS,
  APPOINTMENT_ROOMS,
  APPOINTMENT_SOURCE_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from "@/features/appointments/constants/appointment.constants"
import { useAppointments } from "@/features/appointments/providers/appointment-provider"
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/features/appointments/schemas/appointment.schema"
import {
  APPOINTMENT_BOOKING_STATUSES,
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_SOURCES,
  type AppointmentRecord,
} from "@/features/appointments/types/appointment.types"
import {
  buildAppointmentSchedule,
  findAppointmentConflicts,
  formatAppointmentRange,
} from "@/features/appointments/utils/appointment.utils"
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_VISIT_TYPE_LABELS,
} from "@/features/consultations/constants/consultation.constants"
import {
  CONSULTATION_MODES,
  CONSULTATION_VISIT_TYPES,
} from "@/features/consultations/types/consultation.types"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"
import { getPatientFullName } from "@/features/patients/utils/patient.utils"

export type AppointmentFormMode =
  | "create"
  | "edit"

interface AppointmentFormDialogProps {
  mode: AppointmentFormMode
  record?: AppointmentRecord | null
  defaultAppointmentDate: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitAppointment: (
    values: AppointmentFormValues
  ) => Promise<void>
}

interface FieldErrorProps {
  id: string
  message?: string
}

function FieldError({
  id,
  message,
}: FieldErrorProps) {
  if (!message) {
    return null
  }

  return (
    <p
      id={id}
      role="alert"
      className="text-xs font-medium text-destructive"
    >
      {message}
    </p>
  )
}

function toLocalDateInput(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const timezoneOffsetMilliseconds =
    date.getTimezoneOffset() * 60 * 1000

  return new Date(
    date.getTime() - timezoneOffsetMilliseconds
  )
    .toISOString()
    .slice(0, 10)
}

function toLocalTimeInput(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":")
}

function getAppointmentFormValues(
  mode: AppointmentFormMode,
  record: AppointmentRecord | null,
  defaultAppointmentDate: string
): AppointmentFormValues {
  if (mode !== "edit" || !record) {
    return {
      patientId: "",
      branchId: GALENMED_BRANCHES[0]?.id ?? "",
      departmentId: "",
      doctorId: "",
      roomId: "",
      appointmentDate: defaultAppointmentDate,
      startTime: "09:00",
      durationMinutes: "30",
      status: "scheduled",
      priority: "routine",
      source: "staff",
      mode: "in-person",
      visitType: "new-consultation",
      chiefComplaint: "",
      patientInstructions: "",
      internalNotes: "",
    }
  }

  return {
    patientId: record.patientId,
    branchId: record.branchId,
    departmentId: record.departmentId,
    doctorId: record.doctorId,
    roomId: record.roomId ?? "",
    appointmentDate: toLocalDateInput(
      record.scheduledStartAt
    ),
    startTime: toLocalTimeInput(
      record.scheduledStartAt
    ),
    durationMinutes: String(
      record.durationMinutes
    ),
    status:
      record.status === "confirmed"
        ? "confirmed"
        : "scheduled",
    priority: record.priority,
    source: record.source,
    mode: record.mode,
    visitType: record.visitType,
    chiefComplaint: record.chiefComplaint,
    patientInstructions:
      record.patientInstructions ?? "",
    internalNotes: record.internalNotes ?? "",
  }
}

export function AppointmentFormDialog({
  mode,
  record = null,
  defaultAppointmentDate,
  open,
  onOpenChange,
  onSubmitAppointment,
}: AppointmentFormDialogProps) {
  const isEditMode = mode === "edit"
  const formId = `appointment-form-${mode}`
  const { appointments } = useAppointments()
  const { patients } = usePatients()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(
      appointmentFormSchema
    ),
    defaultValues: getAppointmentFormValues(
      mode,
      record,
      defaultAppointmentDate
    ),
    mode: "onTouched",
  })

  const patientId =
    useWatch({ control, name: "patientId" }) ?? ""
  const departmentId =
    useWatch({ control, name: "departmentId" }) ?? ""
  const doctorId =
    useWatch({ control, name: "doctorId" }) ?? ""
  const roomId =
    useWatch({ control, name: "roomId" }) ?? ""
  const appointmentDate =
    useWatch({ control, name: "appointmentDate" }) ?? ""
  const startTime =
    useWatch({ control, name: "startTime" }) ?? ""
  const durationMinutes =
    useWatch({ control, name: "durationMinutes" }) ?? ""
  const modeValue =
    useWatch({ control, name: "mode" }) ?? "in-person"

  useEffect(() => {
    if (open) {
      reset(
        getAppointmentFormValues(
          mode,
          record,
          defaultAppointmentDate
        )
      )
    }
  }, [
    mode,
    record,
    defaultAppointmentDate,
    open,
    reset,
  ])

  const selectablePatients = useMemo(
    () =>
      patients
        .filter(
          (patient) =>
            patient.status !== "archived" ||
            patient.id === record?.patientId
        )
        .sort((first, second) =>
          getPatientFullName(first).localeCompare(
            getPatientFullName(second),
            "en-PH"
          )
        ),
    [patients, record?.patientId]
  )

  const availableDoctors = useMemo(
    () =>
      APPOINTMENT_DOCTORS.filter(
        (doctor) =>
          Boolean(departmentId) &&
          doctor.departmentIds.some(
            (candidateDepartmentId) =>
              candidateDepartmentId === departmentId
          )
      ),
    [departmentId]
  )

  const availableRooms = useMemo(
    () =>
      APPOINTMENT_ROOMS.filter(
        (room) =>
          Boolean(departmentId) &&
          room.departmentIds.some(
            (candidateDepartmentId) =>
              candidateDepartmentId === departmentId
          )
      ),
    [departmentId]
  )

  const excludedAppointmentId =
    record?.id

  const liveConflicts = useMemo(() => {
    const duration = Number(durationMinutes)

    if (
      !open ||
      !patientId ||
      !doctorId ||
      !appointmentDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        appointmentDate
      ) ||
      !/^\d{2}:\d{2}$/.test(startTime) ||
      !Number.isInteger(duration) ||
      duration < 15
    ) {
      return []
    }

    try {
      const schedule = buildAppointmentSchedule({
        appointmentDate,
        startTime,
        durationMinutes,
      })

      return findAppointmentConflicts(
        appointments,
        {
          patientId,
          doctorId,
          roomId:
            modeValue === "telemedicine"
              ? null
              : roomId || null,
          scheduledStartAt:
            schedule.scheduledStartAt,
          scheduledEndAt:
            schedule.scheduledEndAt,
        },
        excludedAppointmentId
      )
    } catch {
      return []
    }
  }, [
    open,
    appointments,
    patientId,
    doctorId,
    roomId,
    appointmentDate,
    startTime,
    durationMinutes,
    modeValue,
    excludedAppointmentId,
  ])

  const departmentRegistration =
    register("departmentId")
  const modeRegistration = register("mode")

  function handleDepartmentChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    departmentRegistration.onChange(event)

    setValue("doctorId", "", {
      shouldDirty: true,
      shouldValidate: true,
    })

    setValue("roomId", "", {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleModeChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    modeRegistration.onChange(event)

    if (event.target.value === "telemedicine") {
      setValue("roomId", "", {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen && !isSubmitting) {
      reset(
        getAppointmentFormValues(
          mode,
          record,
          defaultAppointmentDate
        )
      )
    }

    onOpenChange(nextOpen)
  }

  async function submitAppointment(
    values: AppointmentFormValues
  ) {
    try {
      await onSubmitAppointment(values)

      reset(
        getAppointmentFormValues(
          mode,
          record,
          defaultAppointmentDate
        )
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : isEditMode
              ? "The appointment could not be rescheduled."
              : "The appointment could not be created.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            {isEditMode ? (
              <FilePenLine
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <CalendarPlus2
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <DialogTitle>
            {isEditMode
              ? "Edit or reschedule appointment"
              : "Create appointment"}
          </DialogTitle>

          <DialogDescription>
            Assign the patient, provider,
            department, room, date, duration,
            and appointment details.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitAppointment
          )}
        >
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Patient and branch
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-patient`}>
                  Patient
                </Label>

                <select
                  id={`${formId}-patient`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(
                    errors.patientId
                  )}
                  {...register("patientId")}
                >
                  <option value="">
                    Select patient
                  </option>

                  {selectablePatients.map(
                    (patient) => (
                      <option
                        key={patient.id}
                        value={patient.id}
                      >
                        {getPatientFullName(patient)}
                        {" — "}
                        {patient.medicalRecordNumber}
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  id={`${formId}-patient-error`}
                  message={errors.patientId?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-branch`}>
                  Branch
                </Label>

                <select
                  id={`${formId}-branch`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("branchId")}
                >
                  {GALENMED_BRANCHES.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Care assignment
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-department`}>
                  Department
                </Label>

                <select
                  id={`${formId}-department`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...departmentRegistration}
                  onChange={handleDepartmentChange}
                >
                  <option value="">
                    Select department
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

                <FieldError
                  id={`${formId}-department-error`}
                  message={errors.departmentId?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-doctor`}>
                  Doctor
                </Label>

                <select
                  id={`${formId}-doctor`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50"
                  disabled={!departmentId}
                  {...register("doctorId")}
                >
                  <option value="">
                    Select doctor
                  </option>

                  {availableDoctors.map((doctor) => (
                    <option
                      key={doctor.id}
                      value={doctor.id}
                    >
                      {doctor.name}
                    </option>
                  ))}
                </select>

                <FieldError
                  id={`${formId}-doctor-error`}
                  message={errors.doctorId?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-mode`}>
                  Appointment mode
                </Label>

                <select
                  id={`${formId}-mode`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...modeRegistration}
                  onChange={handleModeChange}
                >
                  {CONSULTATION_MODES.map(
                    (appointmentMode) => (
                      <option
                        key={appointmentMode}
                        value={appointmentMode}
                      >
                        {
                          CONSULTATION_MODE_LABELS[
                            appointmentMode
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {modeValue === "in-person" ? (
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-room`}>
                    Consultation room
                  </Label>

                  <select
                    id={`${formId}-room`}
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50"
                    disabled={!departmentId}
                    {...register("roomId")}
                  >
                    <option value="">
                      Select room
                    </option>

                    {availableRooms.map((room) => (
                      <option
                        key={room.id}
                        value={room.id}
                      >
                        {room.name}
                      </option>
                    ))}
                  </select>

                  <FieldError
                    id={`${formId}-room-error`}
                    message={errors.roomId?.message}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor={`${formId}-visit-type`}>
                  Visit type
                </Label>

                <select
                  id={`${formId}-visit-type`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("visitType")}
                >
                  {CONSULTATION_VISIT_TYPES.map(
                    (visitType) => (
                      <option
                        key={visitType}
                        value={visitType}
                      >
                        {
                          CONSULTATION_VISIT_TYPE_LABELS[
                            visitType
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Schedule
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-date`}>
                  Appointment date
                </Label>
                <Input
                  id={`${formId}-date`}
                  type="date"
                  aria-invalid={Boolean(
                    errors.appointmentDate
                  )}
                  {...register("appointmentDate")}
                />
                <FieldError
                  id={`${formId}-date-error`}
                  message={errors.appointmentDate?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-time`}>
                  Start time
                </Label>
                <Input
                  id={`${formId}-time`}
                  type="time"
                  aria-invalid={Boolean(
                    errors.startTime
                  )}
                  {...register("startTime")}
                />
                <FieldError
                  id={`${formId}-time-error`}
                  message={errors.startTime?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-duration`}>
                  Duration in minutes
                </Label>
                <Input
                  id={`${formId}-duration`}
                  type="number"
                  min={15}
                  max={480}
                  step={5}
                  inputMode="numeric"
                  aria-invalid={Boolean(
                    errors.durationMinutes
                  )}
                  {...register("durationMinutes")}
                />
                <FieldError
                  id={`${formId}-duration-error`}
                  message={errors.durationMinutes?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-status`}>
                  Initial status
                </Label>
                <select
                  id={`${formId}-status`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("status")}
                >
                  {APPOINTMENT_BOOKING_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {APPOINTMENT_STATUS_LABELS[status]}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>

          {liveConflicts.length > 0 ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-2 text-rose-800">
                <ShieldAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold">
                    Scheduling conflict detected
                  </p>
                  <p className="mt-1 text-xs">
                    Change the patient, doctor,
                    room, date, time, or duration.
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {liveConflicts.map(
                  (conflict, index) => (
                    <div
                      key={`${conflict.resource}-${conflict.appointment.id}-${index}`}
                      className="rounded-lg border border-rose-200 bg-white p-3 text-xs text-rose-800"
                    >
                      <strong className="capitalize">
                        {conflict.resource}
                      </strong>
                      {" conflict with "}
                      {conflict.appointment.appointmentNumber}
                      {": "}
                      {formatAppointmentRange(
                        conflict.appointment
                      )}
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          <section className="space-y-4 border-t pt-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-priority`}>
                  Priority
                </Label>
                <select
                  id={`${formId}-priority`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("priority")}
                >
                  {APPOINTMENT_PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {APPOINTMENT_PRIORITY_LABELS[priority]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-source`}>
                  Booking source
                </Label>
                <select
                  id={`${formId}-source`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("source")}
                >
                  {APPOINTMENT_SOURCES.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {APPOINTMENT_SOURCE_LABELS[source]}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-complaint`}>
                Appointment reason or chief complaint
              </Label>
              <Textarea
                id={`${formId}-complaint`}
                rows={3}
                aria-invalid={Boolean(
                  errors.chiefComplaint
                )}
                {...register("chiefComplaint")}
              />
              <FieldError
                id={`${formId}-complaint-error`}
                message={errors.chiefComplaint?.message}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-patient-instructions`}>
                  Patient instructions
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>
                <Textarea
                  id={`${formId}-patient-instructions`}
                  rows={4}
                  {...register("patientInstructions")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-internal-notes`}>
                  Internal notes
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>
                <Textarea
                  id={`${formId}-internal-notes`}
                  rows={4}
                  {...register("internalNotes")}
                />
              </div>
            </div>
          </section>

          {errors.root?.message ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() =>
              handleDialogOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form={formId}
            disabled={
              isSubmitting ||
              liveConflicts.length > 0
            }
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                {isEditMode
                  ? "Saving appointment"
                  : "Creating appointment"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save appointment
              </>
            ) : (
              <>
                <CalendarPlus2 aria-hidden="true" />
                Create appointment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
