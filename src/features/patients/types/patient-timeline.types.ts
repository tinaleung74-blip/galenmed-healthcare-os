export const PATIENT_TIMELINE_EVENT_CATEGORIES = [
  "patient",
  "medical-history",
  "vital-signs",
  "allergy",
  "insurance",
  "document",
  "laboratory",
] as const

export type PatientTimelineEventCategory =
  (typeof PATIENT_TIMELINE_EVENT_CATEGORIES)[number]

export const PATIENT_TIMELINE_EVENT_ACTIONS = [
  "registered",
  "recorded",
  "measured",
  "uploaded",
  "verified",
  "updated",
  "archived",
  "released",
] as const

export type PatientTimelineEventAction =
  (typeof PATIENT_TIMELINE_EVENT_ACTIONS)[number]

export const PATIENT_TIMELINE_SOURCE_SECTIONS = [
  "overview",
  "medical-history",
  "vital-signs",
  "allergies",
  "insurance",
  "documents",
  "timeline",
] as const

export type PatientTimelineSourceSection =
  (typeof PATIENT_TIMELINE_SOURCE_SECTIONS)[number]

export const PATIENT_TIMELINE_DATE_FILTERS = [
  "all",
  "last-30-days",
  "last-90-days",
  "last-12-months",
] as const

export type PatientTimelineDateFilter =
  (typeof PATIENT_TIMELINE_DATE_FILTERS)[number]

export interface PatientTimelineDetail {
  label: string
  value: string
  sensitive?: boolean
}

export interface PatientTimelineEvent {
  id: string
  patientId: string

  occurredAt: string
  category: PatientTimelineEventCategory
  action: PatientTimelineEventAction

  title: string
  summary: string

  actor: string | null
  reference: string | null

  sourceSection: PatientTimelineSourceSection
  sourceRecordId: string | null

  recordStatus:
    | "current"
    | "archived"
    | null

  details: PatientTimelineDetail[]
}

export interface PatientTimelineFilters {
  search: string
  category:
    | PatientTimelineEventCategory
    | "all"
  action:
    | PatientTimelineEventAction
    | "all"
  dateRange: PatientTimelineDateFilter
}
