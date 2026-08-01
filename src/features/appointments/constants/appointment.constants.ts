import {
  CONSULTATION_DEPARTMENTS,
  CONSULTATION_DOCTORS,
} from "@/features/consultations/constants/consultation.constants"
import type {
  AppointmentFilters,
  AppointmentPriority,
  AppointmentSource,
  AppointmentStatus,
} from "@/features/appointments/types/appointment.types"

export interface AppointmentRoom {
  id: string
  name: string
  departmentIds: readonly string[]
}

export const APPOINTMENT_DEPARTMENTS =
  CONSULTATION_DEPARTMENTS

export const APPOINTMENT_DOCTORS =
  CONSULTATION_DOCTORS

export const APPOINTMENT_ROOMS = [
  {
    id: "appointment-room-01",
    name: "Consultation Room 1",
    departmentIds: [
      "department-general-medicine",
      "department-family-medicine",
    ],
  },
  {
    id: "appointment-room-02",
    name: "Consultation Room 2",
    departmentIds: [
      "department-internal-medicine",
    ],
  },
  {
    id: "appointment-room-03",
    name: "Consultation Room 3",
    departmentIds: [
      "department-general-medicine",
      "department-pediatrics",
    ],
  },
] as const satisfies readonly AppointmentRoom[]

export const APPOINTMENT_STATUS_LABELS: Record<
  AppointmentStatus,
  string
> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  "in-consultation": "In consultation",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
}

export const APPOINTMENT_PRIORITY_LABELS: Record<
  AppointmentPriority,
  string
> = {
  routine: "Routine",
  urgent: "Urgent",
}

export const APPOINTMENT_SOURCE_LABELS: Record<
  AppointmentSource,
  string
> = {
  staff: "Staff booking",
  "patient-portal": "Patient portal",
  phone: "Phone booking",
  "walk-in": "Walk-in",
  referral: "Referral",
}

export const APPOINTMENT_SCHEDULE_VIEW_LABELS = {
  day: "Daily schedule",
  week: "Weekly schedule",
  all: "All appointments",
} as const

export const DEFAULT_APPOINTMENT_FILTERS: AppointmentFilters =
  {
    search: "",
    status: "all",
    branchId: "all",
    departmentId: "all",
    doctorId: "all",
    mode: "all",
    scheduleView: "day",
    selectedDate: "2026-07-31",
  }

export const APPOINTMENT_SCHEDULING_ACTOR =
  "GalenMed Scheduling Desk"
