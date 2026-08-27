import type {
  HospitalServiceType,
} from "@/features/hospital-operations/types/service-catalog.types"

export const SERVICE_TYPE_LABELS: Record<
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

export function parsePhpToCentavos(
  value: string
): number {
  const normalizedValue =
    value.trim()

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalizedValue
    )
  ) {
    throw new Error(
      "Enter a valid PHP amount with no more than two decimal places."
    )
  }

  const [
    wholePart,
    decimalPart = "",
  ] = normalizedValue.split(".")

  const centavos =
    Number(wholePart) * 100 +
    Number(
      decimalPart.padEnd(
        2,
        "0"
      )
    )

  if (
    !Number.isSafeInteger(
      centavos
    ) ||
    centavos < 0
  ) {
    throw new Error(
      "The PHP amount is outside the supported range."
    )
  }

  return centavos
}

export function formatCentavosAsPhpInput(
  centavos: number
): string {
  return (
    centavos / 100
  ).toFixed(2)
}

export function formatServicePrice(
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

export function normalizeServiceSearch(
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
