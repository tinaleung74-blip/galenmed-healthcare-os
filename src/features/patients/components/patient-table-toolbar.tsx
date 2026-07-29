import { RotateCcw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BIOLOGICAL_SEX_LABELS,
  GALENMED_BRANCHES,
  LAST_VISIT_FILTER_OPTIONS,
  PATIENT_STATUS_LABELS,
} from "@/features/patients/constants/patient.constants"
import {
  BIOLOGICAL_SEXES,
  LAST_VISIT_FILTERS,
  PATIENT_STATUSES,
  type BiologicalSex,
  type LastVisitFilter,
  type PatientFilters,
  type PatientStatus,
} from "@/features/patients/types/patient.types"

interface PatientTableToolbarProps {
  filters: PatientFilters
  filteredCount: number
  totalCount: number
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: PatientStatus | "all") => void
  onBiologicalSexChange: (
    value: BiologicalSex | "all"
  ) => void
  onBranchChange: (value: string | "all") => void
  onLastVisitChange: (value: LastVisitFilter) => void
  onResetFilters: () => void
}

const selectClassName =
  "h-8 min-w-36 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function isPatientStatusFilter(
  value: string
): value is PatientStatus | "all" {
  return (
    value === "all" ||
    PATIENT_STATUSES.some((status) => status === value)
  )
}

function isBiologicalSexFilter(
  value: string
): value is BiologicalSex | "all" {
  return (
    value === "all" ||
    BIOLOGICAL_SEXES.some(
      (biologicalSex) => biologicalSex === value
    )
  )
}

function isLastVisitFilter(
  value: string
): value is LastVisitFilter {
  return LAST_VISIT_FILTERS.some(
    (lastVisitFilter) => lastVisitFilter === value
  )
}

export function PatientTableToolbar({
  filters,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onBiologicalSexChange,
  onBranchChange,
  onLastVisitChange,
  onResetFilters,
}: PatientTableToolbarProps) {
  return (
    <div className="space-y-4 border-b p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1 xl:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <Input
            value={filters.search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search name, MRN, mobile, or email"
            aria-label="Search patients"
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <label htmlFor="patient-status-filter" className="sr-only">
            Filter by patient status
          </label>

          <select
            id="patient-status-filter"
            value={filters.status}
            className={selectClassName}
            onChange={(event) => {
              if (isPatientStatusFilter(event.target.value)) {
                onStatusChange(event.target.value)
              }
            }}
          >
            <option value="all">All statuses</option>

            {PATIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PATIENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <label htmlFor="patient-sex-filter" className="sr-only">
            Filter by biological sex
          </label>

          <select
            id="patient-sex-filter"
            value={filters.biologicalSex}
            className={selectClassName}
            onChange={(event) => {
              if (isBiologicalSexFilter(event.target.value)) {
                onBiologicalSexChange(event.target.value)
              }
            }}
          >
            <option value="all">All sexes</option>

            {BIOLOGICAL_SEXES.map((biologicalSex) => (
              <option
                key={biologicalSex}
                value={biologicalSex}
              >
                {BIOLOGICAL_SEX_LABELS[biologicalSex]}
              </option>
            ))}
          </select>

          <label htmlFor="patient-branch-filter" className="sr-only">
            Filter by branch
          </label>

          <select
            id="patient-branch-filter"
            value={filters.branchId}
            className={selectClassName}
            onChange={(event) =>
              onBranchChange(event.target.value)
            }
          >
            <option value="all">All branches</option>

            {GALENMED_BRANCHES.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.shortName}
              </option>
            ))}
          </select>

          <label htmlFor="patient-visit-filter" className="sr-only">
            Filter by last visit
          </label>

          <select
            id="patient-visit-filter"
            value={filters.lastVisit}
            className={selectClassName}
            onChange={(event) => {
              if (isLastVisitFilter(event.target.value)) {
                onLastVisitChange(event.target.value)
              }
            }}
          >
            {LAST_VISIT_FILTER_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onResetFilters}
            >
              <RotateCcw aria-hidden="true" />
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Showing {filteredCount} of {totalCount} registered patients
        </p>

        {hasActiveFilters ? (
          <p className="font-medium text-teal-700">
            Filters are active
          </p>
        ) : null}
      </div>
    </div>
  )
}
