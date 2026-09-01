import type {
  PatientPortalDocumentType,
} from "@/features/patient-portal/types/patient-portal-records.types"

const philippinePesoFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }
  )

export function formatPatientPortalMoney(
  centavos: number
): string {
  return philippinePesoFormatter.format(
    centavos / 100
  )
}

export function formatPatientPortalRecordDateTime(
  value: string | null
): string {
  if (!value) {
    return "Not recorded"
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not recorded"
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

export function getPatientPortalDocumentTypeLabel(
  documentType:
    PatientPortalDocumentType
): string {
  const labels: Record<
    PatientPortalDocumentType,
    string
  > = {
    prescription:
      "Prescription",
    laboratory_result:
      "Laboratory Result",
    radiology_report:
      "Radiology Report",
    consultation_summary:
      "Consultation Summary",
    diagnosis_summary:
      "Diagnosis Summary",
    medical_certificate:
      "Medical Certificate",
    official_receipt:
      "Official Receipt",
    other:
      "Clinical Document",
  }

  return labels[
    documentType
  ]
}

export function formatPatientPortalStatus(
  value: string
): string {
  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}
