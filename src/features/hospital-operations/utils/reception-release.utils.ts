import type {
  ReceptionDocumentStatus,
  ReceptionDocumentType,
  ReceptionPaymentStatus,
  ReceptionPrintPurpose,
  ReceptionReleaseItem,
  ReceptionReleaseMethod,
  ReceptionReleaseStatus,
} from "@/features/hospital-operations/types/reception-release.types"

export const RECEPTION_DOCUMENT_TYPE_LABELS: Record<
  ReceptionDocumentType,
  string
> = {
  prescription: "Prescription",
  laboratory_result: "Laboratory result",
  radiology_report: "Radiology report",
  consultation_summary: "Consultation summary",
  diagnosis_summary: "Diagnosis summary",
  medical_certificate: "Medical certificate",
  official_receipt: "Official receipt",
  other: "Other clinical document",
}

export const RECEPTION_DOCUMENT_STATUS_LABELS: Record<
  ReceptionDocumentStatus,
  string
> = {
  finalized: "Finalized",
  corrected: "Corrected",
}

export const RECEPTION_RELEASE_STATUS_LABELS: Record<
  ReceptionReleaseStatus,
  string
> = {
  not_ready: "Not ready",
  payment_pending: "Payment pending",
  ready: "Ready for release",
  released: "Released",
  blocked: "Blocked",
  voided: "Voided",
}

export const RECEPTION_PAYMENT_STATUS_LABELS: Record<
  ReceptionPaymentStatus,
  string
> = {
  pending: "Pending",
  partially_cleared: "Partially paid",
  cleared: "Paid",
  waived: "Waived",
  blocked: "Blocked",
  revoked: "Revoked",
}

export const RECEPTION_RELEASE_METHOD_LABELS: Record<
  ReceptionReleaseMethod,
  string
> = {
  physical_print: "Physical printed copy",
  patient_portal: "Patient portal",
  email: "Email",
  digital_download: "Digital download",
  other: "Other",
}

export const RECEPTION_PRINT_PURPOSE_LABELS: Record<
  ReceptionPrintPurpose,
  string
> = {
  patient_original: "Patient original",
  patient_copy: "Patient copy",
  admin_copy: "Administrative copy",
  reprint: "Reprint",
}

export function createReceptionReleaseIdempotencyKey(
  action: string
): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `${action}:${globalThis.crypto.randomUUID()}`
  }

  return `${action}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2)}`
}

export function getReceptionPatientFullName(
  item: Pick<
    ReceptionReleaseItem,
    "patient"
  >
): string {
  return [
    item.patient.firstName,
    item.patient.middleName,
    item.patient.lastName,
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .join(" ")
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

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date)
}

export function formatReceptionAmount(
  centavos: number
): string {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
    }
  ).format(centavos / 100)
}

export function normalizeReceptionReleaseSearch(
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

export function canPrintReceptionDocument(
  item: Pick<
    ReceptionReleaseItem,
    "releaseStatus"
  >
): boolean {
  return (
    item.releaseStatus === "ready" ||
    item.releaseStatus === "released"
  )
}

export function canReleaseReceptionDocument(
  item: Pick<
    ReceptionReleaseItem,
    "releaseStatus"
  >
): boolean {
  return (
    item.releaseStatus === "ready" ||
    item.releaseStatus === "released"
  )
}
