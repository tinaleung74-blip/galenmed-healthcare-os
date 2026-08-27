import type {
  LaboratoryPaymentClearanceStatus,
  LaboratoryQueueAction,
  LaboratoryQueueEntryRecord,
  LaboratoryQueuePriority,
  LaboratoryQueueStatus,
} from "@/features/hospital-operations/types/laboratory-queue.types"

const dateTimeFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone:
        "Asia/Manila",
    }
  )

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone:
        "Asia/Manila",
    }
  )

export const LABORATORY_QUEUE_STATUS_LABELS: Record<
  LaboratoryQueueStatus,
  string
> = {
  waiting: "Waiting",
  called: "Called",
  in_service: "In Service",
  completed: "Completed",
  no_show: "No Show",
  cancelled: "Cancelled",
}

export const LABORATORY_QUEUE_PRIORITY_LABELS: Record<
  LaboratoryQueuePriority,
  string
> = {
  routine: "Routine",
  urgent: "Urgent",
  stat: "STAT",
  emergency: "Emergency",
}

export const LABORATORY_PAYMENT_CLEARANCE_LABELS: Record<
  LaboratoryPaymentClearanceStatus,
  string
> = {
  pending: "Pending Payment",
  partially_cleared:
    "Partially Paid",
  cleared: "Payment Cleared",
  waived: "Waived",
  blocked: "Blocked",
  revoked: "Clearance Revoked",
}

export const LABORATORY_QUEUE_ACTION_LABELS: Record<
  LaboratoryQueueAction,
  string
> = {
  call: "Call Patient",
  start: "Start Service",
  complete: "Complete Queue",
  no_show: "Mark No Show",
  cancel: "Cancel Queue",
}

export function getLaboratoryPatientFullName(
  entry: LaboratoryQueueEntryRecord
): string {
  return [
    entry.patient.firstName,
    entry.patient.middleName,
    entry.patient.lastName,
  ]
    .filter(
      (
        value
      ): value is string =>
        Boolean(value?.trim())
    )
    .join(" ")
}

export function getLaboratoryPatientInitials(
  entry: LaboratoryQueueEntryRecord
): string {
  const initials = [
    entry.patient.firstName
      .trim()
      .charAt(0),
    entry.patient.lastName
      .trim()
      .charAt(0),
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase()

  return initials || "PT"
}

export function normalizeLaboratoryQueueSearch(
  ...values: Array<
    string | null | undefined
  >
): string {
  return values
    .filter(
      (
        value
      ): value is string =>
        typeof value ===
        "string"
    )
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase(
      "en-PH"
    )
}

export function formatLaboratoryDateTime(
  value: string | null,
  fallback = "Not recorded"
): string {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback
  }

  return dateTimeFormatter.format(
    date
  )
}

export function formatLaboratoryDate(
  value: string | null,
  fallback = "Not recorded"
): string {
  if (!value) {
    return fallback
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(
    value
  )
    ? new Date(
        `${value}T00:00:00+08:00`
      )
    : new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback
  }

  return dateFormatter.format(date)
}

export function formatLaboratoryAmount(
  centavos: number
): string {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    centavos / 100
  )
}

export function getLaboratoryDateKey(
  date = new Date()
): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone:
          "Asia/Manila",
      }
    )

  return formatter.format(date)
}

export function getAvailableLaboratoryQueueActions(
  status: LaboratoryQueueStatus
): LaboratoryQueueAction[] {
  if (status === "waiting") {
    return [
      "call",
      "start",
      "no_show",
      "cancel",
    ]
  }

  if (status === "called") {
    return [
      "start",
      "no_show",
      "cancel",
    ]
  }

  if (
    status === "in_service"
  ) {
    return [
      "complete",
      "cancel",
    ]
  }

  return []
}
