import type {
  HospitalServiceType,
} from "@/features/hospital-operations/types/service-catalog.types"
import type {
  ReceptionArrivalMode,
  ReceptionPatientRecord,
  ReceptionQueueStatus,
  ReceptionRequestStatus,
  ReceptionServicePriority,
  ReceptionVisitStatus,
} from "@/features/hospital-operations/types/reception-intake.types"

export const RECEPTION_ARRIVAL_MODE_LABELS: Record<
  ReceptionArrivalMode,
  string
> = {
  walk_in: "Walk-in",
  appointment: "Appointment",
  emergency: "Emergency",
  admission: "Admission",
  follow_up: "Follow-up",
  other: "Other",
}

export const RECEPTION_SERVICE_TYPE_LABELS: Record<
  HospitalServiceType,
  string
> = {
  consultation: "Consultation",
  laboratory: "Laboratory",
  radiology: "Radiology",
  pharmacy: "Pharmacy",
  billing: "Billing",
  procedure: "Procedure",
  other: "Other",
}

export const RECEPTION_PRIORITY_LABELS: Record<
  ReceptionServicePriority,
  string
> = {
  routine: "Routine",
  urgent: "Urgent",
  stat: "STAT",
  emergency: "Emergency",
}

export const RECEPTION_VISIT_STATUS_LABELS: Record<
  ReceptionVisitStatus,
  string
> = {
  registered: "Registered",
  checked_in: "Checked In",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
}

export const RECEPTION_REQUEST_STATUS_LABELS: Record<
  ReceptionRequestStatus,
  string
> = {
  requested: "Requested",
  queued: "Queued",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
}

export const RECEPTION_QUEUE_STATUS_LABELS: Record<
  ReceptionQueueStatus,
  string
> = {
  waiting: "Waiting",
  called: "Called",
  in_service: "In Service",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
}

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  )

const dateTimeFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  )

const phpFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )

export function getReceptionPatientFullName(
  patient: Pick<
    ReceptionPatientRecord,
    | "firstName"
    | "middleName"
    | "lastName"
  >
): string {
  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .map((value) => value.trim())
    .join(" ")
}

export function getReceptionPatientInitials(
  patient: Pick<
    ReceptionPatientRecord,
    "firstName" | "lastName"
  >
): string {
  const initials = [
    patient.firstName.charAt(0),
    patient.lastName.charAt(0),
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase()

  return initials || "PT"
}

export function formatReceptionDate(
  value: string | null,
  fallback = "Not recorded"
): string {
  if (!value) {
    return fallback
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(
    value
  )
    ? new Date(`${value}T00:00:00`)
    : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return dateFormatter.format(date)
}

export function formatReceptionDateTime(
  value: string | null,
  fallback = "Not recorded"
): string {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return dateTimeFormatter.format(date)
}

export function formatReceptionAmount(
  centavos: number
): string {
  return phpFormatter.format(
    centavos / 100
  )
}

export function normalizeReceptionSearch(
  ...values: Array<
    string | null | undefined
  >
): string {
  return values
    .filter(
      (value): value is string =>
        typeof value === "string"
    )
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-PH")
}

export function createReceptionIdempotencyKey(
  prefix: string
): string {
  const randomPart =
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in
      globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`

  return `${prefix}:${randomPart}`
}

export function getManilaDateKey(): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    )

  const valueByType =
    new Map(
      parts.map((part) => [
        part.type,
        part.value,
      ])
    )

  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`
}
