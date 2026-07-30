export const VITAL_SIGNS_MEASUREMENT_CONTEXTS = [
  "triage",
  "routine",
  "follow-up",
  "inpatient",
  "telemedicine",
] as const

export type VitalSignsMeasurementContext =
  (typeof VITAL_SIGNS_MEASUREMENT_CONTEXTS)[number]

export const BLOOD_PRESSURE_POSITIONS = [
  "sitting",
  "standing",
  "supine",
  "not-recorded",
] as const

export type BloodPressurePosition =
  (typeof BLOOD_PRESSURE_POSITIONS)[number]

export const TEMPERATURE_SITES = [
  "oral",
  "axillary",
  "tympanic",
  "temporal",
  "rectal",
  "not-recorded",
] as const

export type TemperatureSite =
  (typeof TEMPERATURE_SITES)[number]

export const OXYGEN_SUPPORT_TYPES = [
  "room-air",
  "supplemental-oxygen",
  "not-recorded",
] as const

export type OxygenSupportType =
  (typeof OXYGEN_SUPPORT_TYPES)[number]

export const VITAL_SIGNS_RECORD_STATUSES = [
  "current",
  "archived",
] as const

export type VitalSignsRecordStatus =
  (typeof VITAL_SIGNS_RECORD_STATUSES)[number]

export const VITAL_SIGN_MEASUREMENT_KEYS = [
  "bloodPressure",
  "heartRate",
  "respiratoryRate",
  "temperature",
  "oxygenSaturation",
  "height",
  "weight",
  "bmi",
  "painScore",
] as const

export type VitalSignMeasurementKey =
  (typeof VITAL_SIGN_MEASUREMENT_KEYS)[number]

export const VITAL_SIGN_INTERPRETATIONS = [
  "not-evaluated",
  "within-configured-range",
  "low",
  "high",
  "critical",
] as const

export type VitalSignInterpretation =
  (typeof VITAL_SIGN_INTERPRETATIONS)[number]

export type VitalSignInterpretationMap = Partial<
  Record<
    VitalSignMeasurementKey,
    VitalSignInterpretation
  >
>

export const VITAL_SIGNS_DATE_FILTERS = [
  "all",
  "last-7-days",
  "last-30-days",
  "last-90-days",
] as const

export type VitalSignsDateFilter =
  (typeof VITAL_SIGNS_DATE_FILTERS)[number]

export interface VitalSignsRecord {
  id: string
  patientId: string
  measuredAt: string
  context: VitalSignsMeasurementContext

  systolicBloodPressureMmHg: number | null
  diastolicBloodPressureMmHg: number | null
  bloodPressurePosition: BloodPressurePosition

  heartRateBpm: number | null
  respiratoryRatePerMinute: number | null

  temperatureCelsius: number | null
  temperatureSite: TemperatureSite

  oxygenSaturationPercent: number | null
  oxygenSupport: OxygenSupportType
  supplementalOxygenLitersPerMinute: number | null

  heightCm: number | null
  weightKg: number | null
  bmi: number | null

  painScore: number | null
  notes: string | null

  interpretations: VitalSignInterpretationMap

  recordStatus: VitalSignsRecordStatus
  recordedBy: string
  recordedAt: string
  updatedBy: string
  updatedAt: string

  archivedAt: string | null
  archivedBy: string | null
  archiveReason: string | null
}

export interface VitalSignsFilters {
  search: string
  context: VitalSignsMeasurementContext | "all"
  recordStatus: VitalSignsRecordStatus | "all"
  dateRange: VitalSignsDateFilter
}
