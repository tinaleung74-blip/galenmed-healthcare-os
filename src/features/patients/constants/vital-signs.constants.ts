import type {
  BloodPressurePosition,
  OxygenSupportType,
  TemperatureSite,
  VitalSignInterpretation,
  VitalSignsFilters,
  VitalSignsMeasurementContext,
  VitalSignsRecordStatus,
} from "@/features/patients/types/vital-signs.types"

export const VITAL_SIGNS_CONTEXT_LABELS: Record<
  VitalSignsMeasurementContext,
  string
> = {
  triage: "Triage",
  routine: "Routine assessment",
  "follow-up": "Follow-up",
  inpatient: "Inpatient",
  telemedicine: "Telemedicine",
}

export const BLOOD_PRESSURE_POSITION_LABELS: Record<
  BloodPressurePosition,
  string
> = {
  sitting: "Sitting",
  standing: "Standing",
  supine: "Supine",
  "not-recorded": "Not recorded",
}

export const TEMPERATURE_SITE_LABELS: Record<
  TemperatureSite,
  string
> = {
  oral: "Oral",
  axillary: "Axillary",
  tympanic: "Tympanic",
  temporal: "Temporal",
  rectal: "Rectal",
  "not-recorded": "Not recorded",
}

export const OXYGEN_SUPPORT_LABELS: Record<
  OxygenSupportType,
  string
> = {
  "room-air": "Room air",
  "supplemental-oxygen": "Supplemental oxygen",
  "not-recorded": "Not recorded",
}

export const VITAL_SIGNS_RECORD_STATUS_LABELS: Record<
  VitalSignsRecordStatus,
  string
> = {
  current: "Current",
  archived: "Archived",
}

export const VITAL_SIGN_INTERPRETATION_LABELS: Record<
  VitalSignInterpretation,
  string
> = {
  "not-evaluated": "Not clinically evaluated",
  "within-configured-range": "Within configured range",
  low: "Low",
  high: "High",
  critical: "Critical",
}

export const VITAL_SIGNS_DATE_FILTER_LABELS = {
  all: "All measurements",
  "last-7-days": "Last 7 days",
  "last-30-days": "Last 30 days",
  "last-90-days": "Last 90 days",
} as const

export const DEFAULT_VITAL_SIGNS_FILTERS: VitalSignsFilters = {
  search: "",
  context: "all",
  recordStatus: "current",
  dateRange: "all",
}

export const VITAL_SIGNS_MOCK_CLINICAL_ACTOR =
  "Dr. Maria Santos"
