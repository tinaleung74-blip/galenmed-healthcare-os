import type { Patient } from "@/features/patients/types/patient.types"

type PatientName = Pick<
  Patient,
  "firstName" | "middleName" | "lastName"
>

type PatientMedicalRecord = Pick<Patient, "medicalRecordNumber">

const patientDateFormatter = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

const patientDateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function getPatientFullName(patient: PatientName): string {
  return [
    patient.firstName.trim(),
    patient.middleName?.trim(),
    patient.lastName.trim(),
  ]
    .filter((namePart): namePart is string => Boolean(namePart))
    .join(" ")
}

export function getPatientInitials(patient: PatientName): string {
  const initials = [
    patient.firstName.trim().charAt(0),
    patient.lastName.trim().charAt(0),
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase()

  return initials || "PT"
}

export function calculateAge(
  dateOfBirth: string,
  referenceDate = new Date()
): number | null {
  const [year, month, day] = dateOfBirth.split("-").map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null
  }

  const birthDate = new Date(year, month - 1, day)

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return null
  }

  let age = referenceDate.getFullYear() - year

  const birthdayHasOccurred =
    referenceDate.getMonth() > month - 1 ||
    (referenceDate.getMonth() === month - 1 &&
      referenceDate.getDate() >= day)

  if (!birthdayHasOccurred) {
    age -= 1
  }

  return age >= 0 ? age : null
}

export function formatPatientDate(
  value: string | null,
  fallback = "Not recorded"
): string {
  if (!value) {
    return fallback
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return patientDateFormatter.format(date)
}

export function formatPatientDateTime(
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

  return patientDateTimeFormatter.format(date)
}

export function normalizePatientSearch(
  ...values: Array<string | null | undefined>
): string {
  return values
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-PH")
}

export function generateMedicalRecordNumber(
  patients: readonly PatientMedicalRecord[],
  year = new Date().getFullYear()
): string {
  const yearPrefix = `GM-${year}-`

  const highestSequence = patients.reduce((highest, patient) => {
    if (!patient.medicalRecordNumber.startsWith(yearPrefix)) {
      return highest
    }

    const sequence = Number(
      patient.medicalRecordNumber.slice(yearPrefix.length)
    )

    return Number.isInteger(sequence) && sequence > highest
      ? sequence
      : highest
  }, 0)

  return `${yearPrefix}${String(highestSequence + 1).padStart(6, "0")}`
}
