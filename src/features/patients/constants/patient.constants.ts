import type {
  BiologicalSex,
  LastVisitFilter,
  PatientFilters,
  PatientStatus,
} from "@/features/patients/types/patient.types"

export interface GalenMedBranch {
  id: string
  code: string
  name: string
  shortName: string
  city: string
}

export const GALENMED_BRANCHES = [
  {
    id: "branch-makati",
    code: "MKT",
    name: "GalenMed Makati",
    shortName: "Makati",
    city: "Makati City",
  },
  {
    id: "branch-quezon-city",
    code: "QC",
    name: "GalenMed Quezon City",
    shortName: "Quezon City",
    city: "Quezon City",
  },
  {
    id: "branch-cebu",
    code: "CEB",
    name: "GalenMed Cebu",
    shortName: "Cebu",
    city: "Cebu City",
  },
] as const satisfies readonly GalenMedBranch[]

export type GalenMedBranchId =
  (typeof GALENMED_BRANCHES)[number]["id"]

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
}

export const BIOLOGICAL_SEX_LABELS: Record<BiologicalSex, string> = {
  male: "Male",
  female: "Female",
  intersex: "Intersex",
  unknown: "Not specified",
}

export const LAST_VISIT_FILTER_OPTIONS: ReadonlyArray<{
  value: LastVisitFilter
  label: string
}> = [
  {
    value: "all",
    label: "All visits",
  },
  {
    value: "last-30-days",
    label: "Last 30 days",
  },
  {
    value: "last-90-days",
    label: "Last 90 days",
  },
  {
    value: "last-12-months",
    label: "Last 12 months",
  },
  {
    value: "no-recorded-visit",
    label: "No recorded visit",
  },
]

export const DEFAULT_PATIENT_FILTERS: PatientFilters = {
  search: "",
  status: "all",
  biologicalSex: "all",
  branchId: "all",
  lastVisit: "all",
}

export const PATIENT_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export const DEFAULT_PATIENT_PAGE_SIZE = 10
