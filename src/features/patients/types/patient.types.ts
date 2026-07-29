export const PATIENT_STATUSES = [
  "active",
  "inactive",
  "archived",
] as const

export type PatientStatus = (typeof PATIENT_STATUSES)[number]

export const BIOLOGICAL_SEXES = [
  "male",
  "female",
  "intersex",
  "unknown",
] as const

export type BiologicalSex = (typeof BIOLOGICAL_SEXES)[number]

export const LAST_VISIT_FILTERS = [
  "all",
  "last-30-days",
  "last-90-days",
  "last-12-months",
  "no-recorded-visit",
] as const

export type LastVisitFilter = (typeof LAST_VISIT_FILTERS)[number]

export interface Patient {
  id: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex: BiologicalSex
  mobileNumber: string | null
  emailAddress: string | null
  branchId: string
  branchName: string
  address: string
  emergencyContactName: string
  emergencyContactNumber: string
  status: PatientStatus
  lastVisitAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PatientFilters {
  search: string
  status: PatientStatus | "all"
  biologicalSex: BiologicalSex | "all"
  branchId: string | "all"
  lastVisit: LastVisitFilter
}
