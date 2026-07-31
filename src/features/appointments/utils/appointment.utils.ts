import type { AppointmentFormValues } from "@/features/appointments/schemas/appointment.schema"
import type {
  AppointmentRecord,
  AppointmentStatus,
} from "@/features/appointments/types/appointment.types"

export type AppointmentConflictResource =
  | "patient"
  | "doctor"
  | "room"

export interface AppointmentConflict {
  resource:
    AppointmentConflictResource

  appointment:
    AppointmentRecord
}

interface AppointmentConflictCandidate {
  patientId: string
  doctorId: string
  roomId: string | null

  scheduledStartAt: string
  scheduledEndAt: string
}

const conflictBlockingStatuses =
  new Set<AppointmentStatus>([
    "scheduled",
    "confirmed",
    "checked-in",
    "in-consultation",
  ])

function parseLocalDateAndTime(
  appointmentDate: string,
  startTime: string
): Date {
  const [year, month, day] =
    appointmentDate
      .split("-")
      .map(Number)

  const [hour, minute] =
    startTime
      .split(":")
      .map(Number)

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  )
}

export function buildAppointmentSchedule(
  values: Pick<
    AppointmentFormValues,
    | "appointmentDate"
    | "startTime"
    | "durationMinutes"
  >
): {
  scheduledStartAt: string
  scheduledEndAt: string
  durationMinutes: number
} {
  const durationMinutes =
    Number(values.durationMinutes)

  const startDate =
    parseLocalDateAndTime(
      values.appointmentDate,
      values.startTime
    )

  const endDate = new Date(
    startDate.getTime() +
      durationMinutes * 60 * 1000
  )

  return {
    scheduledStartAt:
      startDate.toISOString(),

    scheduledEndAt:
      endDate.toISOString(),

    durationMinutes,
  }
}

export function appointmentsOverlap(
  firstStartAt: string,
  firstEndAt: string,
  secondStartAt: string,
  secondEndAt: string
): boolean {
  const firstStart =
    new Date(firstStartAt).getTime()

  const firstEnd =
    new Date(firstEndAt).getTime()

  const secondStart =
    new Date(secondStartAt).getTime()

  const secondEnd =
    new Date(secondEndAt).getTime()

  if (
    [
      firstStart,
      firstEnd,
      secondStart,
      secondEnd,
    ].some(Number.isNaN)
  ) {
    return false
  }

  return (
    firstStart < secondEnd &&
    firstEnd > secondStart
  )
}

export function findAppointmentConflicts(
  appointments:
    readonly AppointmentRecord[],

  candidate:
    AppointmentConflictCandidate,

  excludedAppointmentId?: string
): AppointmentConflict[] {
  const conflicts:
    AppointmentConflict[] = []

  appointments.forEach(
    (appointment) => {
      if (
        appointment.id ===
        excludedAppointmentId
      ) {
        return
      }

      if (
        !conflictBlockingStatuses.has(
          appointment.status
        )
      ) {
        return
      }

      const overlaps =
        appointmentsOverlap(
          appointment.scheduledStartAt,
          appointment.scheduledEndAt,
          candidate.scheduledStartAt,
          candidate.scheduledEndAt
        )

      if (!overlaps) {
        return
      }

      if (
        appointment.patientId ===
        candidate.patientId
      ) {
        conflicts.push({
          resource: "patient",
          appointment,
        })
      }

      if (
        appointment.doctorId ===
        candidate.doctorId
      ) {
        conflicts.push({
          resource: "doctor",
          appointment,
        })
      }

      if (
        candidate.roomId &&
        appointment.roomId ===
          candidate.roomId
      ) {
        conflicts.push({
          resource: "room",
          appointment,
        })
      }
    }
  )

  return conflicts
}

const appointmentRangeFormatter =
  new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

export function formatAppointmentRange(
  appointment:
    Pick<
      AppointmentRecord,
      | "scheduledStartAt"
      | "scheduledEndAt"
    >
): string {
  const startDate =
    new Date(
      appointment.scheduledStartAt
    )

  const endDate =
    new Date(
      appointment.scheduledEndAt
    )

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return "Schedule unavailable"
  }

  return `${appointmentRangeFormatter.format(
    startDate
  )} – ${appointmentRangeFormatter.format(
    endDate
  )}`
}
