import type {
  PatientPortalContextPatient,
  PatientPortalPatientRecord,
} from "@/features/patient-portal/types/patient-portal.types"

type PatientNameSource =
  Pick<
    PatientPortalPatientRecord,
    "firstName" |
      "middleName" |
      "lastName"
  > |
  Pick<
    PatientPortalContextPatient,
    "firstName" |
      "middleName" |
      "lastName"
  >

export function getPatientPortalFullName(
  patient: PatientNameSource
): string {
  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(
      (
        value
      ): value is string =>
        typeof value === "string" &&
        value.trim().length > 0
    )
    .join(" ")
}

export function formatPatientPortalDateTime(
  value: string | null
): string {
  if (!value) {
    return "Never"
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

export function normalizePatientPortalSearch(
  ...values:
    Array<
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
    .replace(
      /\s+/g,
      " "
    )
    .toLocaleLowerCase(
      "en-PH"
    )
}
