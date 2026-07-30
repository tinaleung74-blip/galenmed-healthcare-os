import { formatPatientDate } from "@/features/patients/utils/patient.utils"

export function maskInsuranceIdentifier(
  value: string | null,
  visibleCharacters = 4
): string {
  if (!value) {
    return "Not recorded"
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return "Not recorded"
  }

  const visibleSuffix = normalizedValue.slice(
    -visibleCharacters
  )

  return `•••• •••• ${visibleSuffix}`
}

export function formatCoveragePeriod(
  effectiveFrom: string,
  effectiveTo: string | null
): string {
  const startDate = formatPatientDate(
    effectiveFrom,
    "Unknown start date"
  )

  const endDate = formatPatientDate(
    effectiveTo,
    "No recorded end date"
  )

  return `${startDate} – ${endDate}`
}
