import type {
  DoctorPrescriptionItem,
  DoctorPrescriptionStatus,
} from "@/features/hospital-operations/types/doctor-prescription.types"

export const DOCTOR_PRESCRIPTION_STATUS_LABELS: Record<
  DoctorPrescriptionStatus,
  string
> = {
  draft: "Draft",
  submitted: "Submitted for Review",
  returned: "Returned for Correction",
  finalized: "Approved for Release",
  voided: "Voided",
}

export function createPrescriptionIdempotencyKey(prefix: string): string {
  const suffix =
    typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${prefix}-${suffix}`
}

export function formatPrescriptionDateTime(value: string | null): string {
  if (!value) return "Not recorded"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not recorded"
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export interface DoctorPrescriptionMetadata {
  prescriptionNumber: string
  consultationNumber: string
  diagnosisCode: string | null
  diagnosisText: string
  generalInstructions: string | null
  doctor: {
    employeeId: string | null
    fullName: string
    jobTitle: string | null
  }
  items: DoctorPrescriptionItem[]
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" && value.trim() ? value : null
}

export function parseDoctorPrescriptionMetadata(value: unknown): DoctorPrescriptionMetadata | null {
  if (typeof value !== "object" || value === null) return null
  const record = value as Record<string, unknown>
  const rawItems = Array.isArray(record.items) ? record.items : []
  const rawDoctor =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as Record<string, unknown>)
      : null

  const prescriptionNumber = readString(record, "prescription_number")
  const consultationNumber = readString(record, "consultation_number")
  const diagnosisText = readString(record, "diagnosis_text")
  const doctorName = rawDoctor ? readString(rawDoctor, "full_name") : null

  if (!prescriptionNumber || !consultationNumber || !diagnosisText || !doctorName) {
    return null
  }

  const items: DoctorPrescriptionItem[] = rawItems.flatMap((rawItem, index) => {
    if (typeof rawItem !== "object" || rawItem === null) return []
    const item = rawItem as Record<string, unknown>
    const genericName = readString(item, "generic_name")
    const dosageForm = readString(item, "dosage_form")
    const strength = readString(item, "strength")
    const dose = readString(item, "dose")
    const route = readString(item, "route")
    const frequency = readString(item, "frequency")
    const duration = readString(item, "duration")
    const quantityUnit = readString(item, "quantity_unit")
    const quantity = Number(item.quantity)

    if (
      !genericName || !dosageForm || !strength || !dose || !route ||
      !frequency || !duration || !quantityUnit || !Number.isFinite(quantity) || quantity <= 0
    ) return []

    return [{
      id: readString(item, "id") ?? `prescription-item-${index + 1}`,
      sequence: Number(item.sequence) || index + 1,
      genericName,
      brandName: readString(item, "brand_name"),
      dosageForm,
      strength,
      dose,
      route,
      frequency,
      duration,
      quantity,
      quantityUnit,
      instructions: readString(item, "instructions"),
    }]
  })

  if (items.length === 0) return null

  return {
    prescriptionNumber,
    consultationNumber,
    diagnosisCode: readString(record, "diagnosis_code"),
    diagnosisText,
    generalInstructions: readString(record, "general_instructions"),
    doctor: {
      employeeId: rawDoctor ? readString(rawDoctor, "employee_id") : null,
      fullName: doctorName,
      jobTitle: rawDoctor ? readString(rawDoctor, "job_title") : null,
    },
    items,
  }
}
