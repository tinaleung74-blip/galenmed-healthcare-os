import type {
  ConsultationFilters,
  ConsultationMode,
  ConsultationPriority,
  ConsultationStatus,
  ConsultationVisitType,
} from "@/features/consultations/types/consultation.types"

export interface ConsultationDepartment {
  id: string
  name: string
  shortName: string
}

export interface ConsultationDoctor {
  id: string
  name: string
  departmentIds: readonly string[]
}

export const CONSULTATION_DEPARTMENTS = [
  {
    id: "department-general-medicine",
    name: "General Medicine",
    shortName: "General Medicine",
  },
  {
    id: "department-internal-medicine",
    name: "Internal Medicine",
    shortName: "Internal Medicine",
  },
  {
    id: "department-family-medicine",
    name: "Family Medicine",
    shortName: "Family Medicine",
  },
  {
    id: "department-pediatrics",
    name: "Pediatrics",
    shortName: "Pediatrics",
  },
] as const satisfies readonly ConsultationDepartment[]

export const CONSULTATION_DOCTORS = [
  {
    id: "doctor-maria-santos",
    name: "Dr. Maria Santos",
    departmentIds: [
      "department-general-medicine",
      "department-family-medicine",
    ],
  },
  {
    id: "doctor-rafael-cruz",
    name: "Dr. Rafael Cruz",
    departmentIds: [
      "department-internal-medicine",
    ],
  },
  {
    id: "doctor-elena-reyes",
    name: "Dr. Elena Reyes",
    departmentIds: [
      "department-pediatrics",
      "department-general-medicine",
    ],
  },
] as const satisfies readonly ConsultationDoctor[]

export const CONSULTATION_STATUS_LABELS: Record<
  ConsultationStatus,
  string
> = {
  waiting: "Waiting",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
}

export const CONSULTATION_PRIORITY_LABELS: Record<
  ConsultationPriority,
  string
> = {
  routine: "Routine",
  urgent: "Urgent",
}

export const CONSULTATION_MODE_LABELS: Record<
  ConsultationMode,
  string
> = {
  "in-person": "In person",
  telemedicine: "Telemedicine",
}

export const CONSULTATION_VISIT_TYPE_LABELS: Record<
  ConsultationVisitType,
  string
> = {
  "new-consultation": "New consultation",
  "follow-up": "Follow-up",
  "results-review": "Results review",
  "procedure-clearance": "Procedure clearance",
}

export const CONSULTATION_DATE_FILTER_LABELS = {
  today: "July 31, 2026",
  "next-7-days": "July 31–August 6, 2026",
  all: "All scheduled dates",
} as const

export const DEFAULT_CONSULTATION_FILTERS: ConsultationFilters =
  {
    search: "",
    status: "all",
    departmentId: "all",
    doctorId: "all",
    mode: "all",
    dateRange: "today",
  }
