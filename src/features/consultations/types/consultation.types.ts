export const CONSULTATION_STATUSES = [
  "waiting",
  "in-progress",
  "completed",
  "cancelled",
  "no-show",
] as const

export type ConsultationStatus =
  (typeof CONSULTATION_STATUSES)[number]

export const CONSULTATION_PRIORITIES = [
  "routine",
  "urgent",
] as const

export type ConsultationPriority =
  (typeof CONSULTATION_PRIORITIES)[number]

export const CONSULTATION_MODES = [
  "in-person",
  "telemedicine",
] as const

export type ConsultationMode =
  (typeof CONSULTATION_MODES)[number]

export const CONSULTATION_VISIT_TYPES = [
  "new-consultation",
  "follow-up",
  "results-review",
  "procedure-clearance",
] as const

export type ConsultationVisitType =
  (typeof CONSULTATION_VISIT_TYPES)[number]

export const CONSULTATION_DATE_FILTERS = [
  "today",
  "next-7-days",
  "all",
] as const

export type ConsultationDateFilter =
  (typeof CONSULTATION_DATE_FILTERS)[number]

export interface ConsultationEncounter {
  id: string
  consultationNumber: string
  patientId: string

  scheduledAt: string
  checkedInAt: string | null
  startedAt: string | null
  completedAt: string | null
  cancelledAt: string | null

  status: ConsultationStatus
  priority: ConsultationPriority
  mode: ConsultationMode
  visitType: ConsultationVisitType

  departmentId: string
  departmentName: string

  doctorId: string
  doctorName: string

  chiefComplaint: string
  queueNumber: number | null
  roomName: string | null

  administrativeNotes: string | null
  cancellationReason: string | null

  createdAt: string
  updatedAt: string
}

export interface ConsultationFilters {
  search: string
  status: ConsultationStatus | "all"
  departmentId: string | "all"
  doctorId: string | "all"
  mode: ConsultationMode | "all"
  dateRange: ConsultationDateFilter
}
