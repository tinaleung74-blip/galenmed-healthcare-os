import type {
  DoctorPriority,
  DoctorQueueStatus,
  DoctorRequestStatus,
} from "@/features/hospital-operations/types/doctor-consultation.types"

export const DOCTOR_PRIORITY_LABELS: Record<
  DoctorPriority,
  string
> = {
  routine: "Routine",
  urgent: "Urgent",
  stat: "STAT",
  emergency: "Emergency",
}

export const DOCTOR_QUEUE_STATUS_LABELS: Record<
  DoctorQueueStatus,
  string
> = {
  waiting: "Waiting",
  called: "Called",
  in_service: "In Consultation",
  completed: "Completed",
  no_show: "No Show",
  cancelled: "Cancelled",
}

export const DOCTOR_REQUEST_STATUS_LABELS: Record<
  DoctorRequestStatus,
  string
> = {
  requested: "Requested",
  queued: "Queued",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
}

export function formatDoctorDateTime(
  value: string | null,
  fallback = "Not recorded"
): string {
  if (!value) {
    return fallback
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date)
}

export function formatDoctorDate(
  value: string | null,
  fallback = "Not recorded"
): string {
  if (!value) {
    return fallback
  }

  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
      ? new Date(
          `${value}T00:00:00`
        )
      : new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date)
}

export function calculateDoctorPatientAge(
  dateOfBirth: string
): number | null {
  const birthDate =
    new Date(
      `${dateOfBirth}T00:00:00`
    )

  if (
    Number.isNaN(
      birthDate.getTime()
    )
  ) {
    return null
  }

  const today =
    new Date()

  let age =
    today.getFullYear() -
    birthDate.getFullYear()

  const birthdayOccurred =
    today.getMonth() >
      birthDate.getMonth() ||
    (
      today.getMonth() ===
        birthDate.getMonth() &&
      today.getDate() >=
        birthDate.getDate()
    )

  if (!birthdayOccurred) {
    age -= 1
  }

  return age >= 0
    ? age
    : null
}

export function normalizeDoctorSearch(
  ...values: Array<
    string | null | undefined
  >
): string {
  return values
    .filter(
      (
        value
      ): value is string =>
        typeof value === "string"
    )
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-PH")
}

export function createDoctorIdempotencyKey(
  prefix: string
): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in
      globalThis.crypto
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function formatDoctorDocumentType(
  value: string
): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}
