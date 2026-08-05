import type {
  PatientTimelineEventAction,
  PatientTimelineEventCategory,
  PatientTimelineFilters,
} from "@/features/patients/types/patient-timeline.types"

export const PATIENT_TIMELINE_CATEGORY_LABELS: Record<
  PatientTimelineEventCategory,
  string
> = {
  patient: "Patient Profile",
  "medical-history": "Medical History",
  "vital-signs": "Vital Signs",
  allergy: "Allergies",
  insurance: "Insurance",
  document: "Documents",
  laboratory: "Laboratory",
  radiology: "Radiology",
  pharmacy: "Pharmacy",
  billing: "Billing",
}

export const PATIENT_TIMELINE_ACTION_LABELS: Record<
  PatientTimelineEventAction,
  string
> = {
  registered: "Registered",
  recorded: "Recorded",
  measured: "Measured",
  uploaded: "Uploaded",
  verified: "Verified",
  updated: "Updated",
  archived: "Archived",
  released: "Released",
  issued: "Issued",
  "payment-posted": "Payment Posted",
  "refund-posted": "Refund Posted",
  settled: "Statement Settled",
  voided: "Statement Voided",
}

export const PATIENT_TIMELINE_DATE_FILTER_LABELS =
  {
    all: "All activity",
    "last-30-days": "Last 30 days",
    "last-90-days": "Last 90 days",
    "last-12-months": "Last 12 months",
  } as const

export const DEFAULT_PATIENT_TIMELINE_FILTERS: PatientTimelineFilters =
  {
    search: "",
    category: "all",
    action: "all",
    dateRange: "all",
  }

export const PATIENT_TIMELINE_INITIAL_VISIBLE_EVENTS =
  20
