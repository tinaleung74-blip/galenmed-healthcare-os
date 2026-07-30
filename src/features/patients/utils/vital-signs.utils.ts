import type {
  VitalSignInterpretationMap,
  VitalSignsRecord,
} from "@/features/patients/types/vital-signs.types"

type VitalSignsInterpretationInput = Pick<
  VitalSignsRecord,
  | "systolicBloodPressureMmHg"
  | "diastolicBloodPressureMmHg"
  | "heartRateBpm"
  | "respiratoryRatePerMinute"
  | "temperatureCelsius"
  | "oxygenSaturationPercent"
  | "heightCm"
  | "weightKg"
  | "bmi"
  | "painScore"
>

export function parseOptionalVitalMeasurement(
  value: string
): number | null {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return null
  }

  const numericValue = Number(normalizedValue)

  return Number.isFinite(numericValue)
    ? numericValue
    : null
}

export function calculateBmi(
  heightCm: number | null,
  weightKg: number | null
): number | null {
  if (
    heightCm === null ||
    weightKg === null ||
    heightCm <= 0 ||
    weightKg <= 0
  ) {
    return null
  }

  const heightMeters = heightCm / 100
  const bmi =
    weightKg / (heightMeters * heightMeters)

  return Math.round(bmi * 10) / 10
}

export function buildNotEvaluatedVitalSignInterpretations(
  values: VitalSignsInterpretationInput
): VitalSignInterpretationMap {
  const interpretations: VitalSignInterpretationMap =
    {}

  if (
    values.systolicBloodPressureMmHg !== null &&
    values.diastolicBloodPressureMmHg !== null
  ) {
    interpretations.bloodPressure =
      "not-evaluated"
  }

  if (values.heartRateBpm !== null) {
    interpretations.heartRate = "not-evaluated"
  }

  if (values.respiratoryRatePerMinute !== null) {
    interpretations.respiratoryRate =
      "not-evaluated"
  }

  if (values.temperatureCelsius !== null) {
    interpretations.temperature =
      "not-evaluated"
  }

  if (values.oxygenSaturationPercent !== null) {
    interpretations.oxygenSaturation =
      "not-evaluated"
  }

  if (values.heightCm !== null) {
    interpretations.height = "not-evaluated"
  }

  if (values.weightKg !== null) {
    interpretations.weight = "not-evaluated"
  }

  if (values.bmi !== null) {
    interpretations.bmi = "not-evaluated"
  }

  if (values.painScore !== null) {
    interpretations.painScore =
      "not-evaluated"
  }

  return interpretations
}

export function formatVitalMeasurement(
  value: number | null,
  unit: string,
  fallback = "Not recorded"
): string {
  if (value === null) {
    return fallback
  }

  return `${value} ${unit}`
}

export function formatBloodPressure(
  systolic: number | null,
  diastolic: number | null,
  fallback = "Not recorded"
): string {
  if (
    systolic === null ||
    diastolic === null
  ) {
    return fallback
  }

  return `${systolic}/${diastolic} mmHg`
}
