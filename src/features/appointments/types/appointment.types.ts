import type {
  ConsultationMode,
  ConsultationVisitType,
} from "@/features/consultations/types/consultation.types"

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "checked-in",
  "in-consultation",
  "completed",
  "cancelled",
  "no-show",
] as const

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUSES)[number]

export const APPOINTMENT_BOOKING_STATUSES = [
  "scheduled",
  "confirmed",
] as const

export type AppointmentBookingStatus =
  (typeof APPOINTMENT_BOOKING_STATUSES)[number]

export const APPOINTMENT_PRIORITIES = [
  "routine",
  "urgent",
] as const

export type AppointmentPriority =
  (typeof APPOINTMENT_PRIORITIES)[number]

export const APPOINTMENT_SOURCES = [
  "staff",
  "patient-portal",
  "phone",
  "walk-in",
  "referral",
] as const

export type AppointmentSource =
  (typeof APPOINTMENT_SOURCES)[number]

export const APPOINTMENT_SCHEDULE_VIEWS = [
  "day",
  "week",
  "all",
] as const

export type AppointmentScheduleView =
  (typeof APPOINTMENT_SCHEDULE_VIEWS)[number]

export interface AppointmentRecord {
  id: string
  appointmentNumber: string

  patientId: string

  branchId: string
  branchName: string

  departmentId: string
  departmentName: string

  doctorId: string
  doctorName: string

  roomId: string | null
  roomName: string | null

  scheduledStartAt: string
  scheduledEndAt: string
  durationMinutes: number

  mode: ConsultationMode
  visitType: ConsultationVisitType

  status: AppointmentStatus
  priority: AppointmentPriority
  source: AppointmentSource

  chiefComplaint: string
  patientInstructions: string | null
  internalNotes: string | null

  linkedConsultationId: string | null
  linkedConsultationNumber: string | null

  confirmedAt: string | null
  checkedInAt: string | null
  consultationStartedAt: string | null
  completedAt: string | null

  cancelledAt: string | null
  cancelledBy: string | null
  cancellationReason: string | null

  noShowAt: string | null
  noShowMarkedBy: string | null

  createdBy: string
  createdAt: string

  updatedBy: string
  updatedAt: string
}

export interface AppointmentFilters {
  search: string

  status:
    | AppointmentStatus
    | "all"

  branchId: string | "all"
  departmentId: string | "all"
  doctorId: string | "all"

  mode:
    | ConsultationMode
    | "all"

  scheduleView:
    AppointmentScheduleView

  selectedDate: string
}
