import type {
  LaboratoryDocumentStatus,
  LaboratoryPaymentStatus,
  LaboratoryReleaseStatus,
  LaboratoryResultFlag,
  LaboratoryResultItem,
  LaboratoryResultMetadata,
  LaboratoryResultWorkItem,
} from "@/features/hospital-operations/types/laboratory-result.types"

export const LABORATORY_RESULT_FLAG_LABELS: Record<
  LaboratoryResultFlag,
  string
> = {
  normal: "Normal",
  high: "High",
  low: "Low",
  abnormal: "Abnormal",
  critical: "Critical",
  not_applicable: "Not applicable",
}

export const LABORATORY_DOCUMENT_STATUS_LABELS: Record<
  LaboratoryDocumentStatus,
  string
> = {
  draft: "Draft",
  for_review: "For verification",
  finalized: "Verified",
  corrected: "Corrected",
  superseded: "Superseded",
  voided: "Voided",
}

export const LABORATORY_RELEASE_STATUS_LABELS: Record<
  LaboratoryReleaseStatus,
  string
> = {
  not_ready: "Not ready",
  payment_pending: "Payment pending",
  ready: "Ready for release",
  released: "Released",
  blocked: "Blocked",
  voided: "Voided",
}

export const LABORATORY_PAYMENT_STATUS_LABELS: Record<
  LaboratoryPaymentStatus,
  string
> = {
  pending: "Pending",
  partially_cleared: "Partially paid",
  cleared: "Paid",
  waived: "Waived",
  blocked: "Blocked",
  revoked: "Revoked",
}

export function createLaboratoryResultIdempotencyKey(
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

export function createLaboratoryResultItem(): LaboratoryResultItem {
  const id =
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`

  return {
    id,
    testName: "",
    resultValue: "",
    unit: "",
    referenceRange: "",
    flag: "not_applicable",
    remarks: "",
  }
}

export function getLaboratoryPatientFullName(
  workItem:
    Pick<
      LaboratoryResultWorkItem,
      "patient"
    >
): string {
  return [
    workItem.patient.firstName,
    workItem.patient.middleName,
    workItem.patient.lastName,
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim())
    )
    .join(" ")
}

export function formatLaboratoryDateTime(
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

export function formatLaboratoryAmount(
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

export function normalizeLaboratoryResultSearch(
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

interface RawLaboratoryResultItem {
  id?: unknown
  test_name?: unknown
  result_value?: unknown
  unit?: unknown
  reference_range?: unknown
  flag?: unknown
  remarks?: unknown
}

function readString(
  value: unknown
): string {
  return typeof value === "string"
    ? value
    : ""
}

function readNullableString(
  value: unknown
): string | null {
  const normalized =
    readString(value).trim()

  return normalized || null
}

function readFlag(
  value: unknown
): LaboratoryResultFlag {
  const candidate =
    readString(value)

  if (
    candidate === "normal" ||
    candidate === "high" ||
    candidate === "low" ||
    candidate === "abnormal" ||
    candidate === "critical" ||
    candidate === "not_applicable"
  ) {
    return candidate
  }

  return "not_applicable"
}

export function parseLaboratoryResultMetadata(
  value: unknown
): LaboratoryResultMetadata | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null
  }

  const record =
    value as Record<string, unknown>

  const specimenType =
    readString(
      record.specimen_type
    ).trim()

  const rawItems =
    Array.isArray(
      record.result_items
    )
      ? record.result_items
      : []

  const resultItems =
    rawItems
      .map(
        (rawItem): LaboratoryResultItem | null => {
          if (
            typeof rawItem !==
              "object" ||
            rawItem === null ||
            Array.isArray(rawItem)
          ) {
            return null
          }

          const item =
            rawItem as RawLaboratoryResultItem

          const testName =
            readString(
              item.test_name
            ).trim()

          const resultValue =
            readString(
              item.result_value
            ).trim()

          if (
            !testName ||
            !resultValue
          ) {
            return null
          }

          return {
            id:
              readString(item.id) ||
              `${testName}-${resultValue}`,
            testName,
            resultValue,
            unit:
              readString(item.unit),
            referenceRange:
              readString(
                item.reference_range
              ),
            flag:
              readFlag(item.flag),
            remarks:
              readString(
                item.remarks
              ),
          }
        }
      )
      .filter(
        (
          item
        ): item is LaboratoryResultItem =>
          item !== null
      )

  if (
    !specimenType ||
    resultItems.length === 0
  ) {
    return null
  }

  return {
    schemaVersion:
      typeof record.schema_version ===
      "number"
        ? record.schema_version
        : 1,
    specimenType,
    collectionReference:
      readNullableString(
        record.collection_reference
      ),
    resultItems,
    interpretation:
      readNullableString(
        record.interpretation
      ),
    notes:
      readNullableString(
        record.notes
      ),
    entryStatus:
      readString(
        record.entry_status
      ) || "draft",
    correctionReason:
      readNullableString(
        record.correction_reason
      ),
    verificationNotes:
      readNullableString(
        record.verification_notes
      ),
  }
}
