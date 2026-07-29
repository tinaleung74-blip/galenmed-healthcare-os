"use client"

import { useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PatientEmptyState } from "@/features/patients/components/patient-empty-state"
import { getPatientTableColumns } from "@/features/patients/components/patient-table-columns"
import { PatientTableToolbar } from "@/features/patients/components/patient-table-toolbar"
import {
  DEFAULT_PATIENT_FILTERS,
  DEFAULT_PATIENT_PAGE_SIZE,
  PATIENT_PAGE_SIZE_OPTIONS,
} from "@/features/patients/constants/patient.constants"
import type {
  BiologicalSex,
  LastVisitFilter,
  Patient,
  PatientFilters,
  PatientStatus,
} from "@/features/patients/types/patient.types"
import {
  getPatientFullName,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface PatientTableProps {
  patients: Patient[]
  initialSearch?: string
  onViewPatient: (patient: Patient) => void
  onOpenPatientProfile: (patient: Patient) => void
  onEditPatient: (patient: Patient) => void
  onArchivePatient: (patient: Patient) => void
}

function matchesLastVisitFilter(
  lastVisitAt: string | null,
  filter: LastVisitFilter
): boolean {
  if (filter === "all") {
    return true
  }

  if (filter === "no-recorded-visit") {
    return lastVisitAt === null
  }

  if (!lastVisitAt) {
    return false
  }

  const visitDate = new Date(lastVisitAt)

  if (Number.isNaN(visitDate.getTime())) {
    return false
  }

  const now = new Date()
  const earliestDate = new Date(now)

  if (filter === "last-30-days") {
    earliestDate.setDate(earliestDate.getDate() - 30)
  }

  if (filter === "last-90-days") {
    earliestDate.setDate(earliestDate.getDate() - 90)
  }

  if (filter === "last-12-months") {
    earliestDate.setFullYear(earliestDate.getFullYear() - 1)
  }

  return visitDate >= earliestDate && visitDate <= now
}

function filterPatients(
  patients: Patient[],
  filters: PatientFilters
): Patient[] {
  const normalizedQuery = normalizePatientSearch(
    filters.search
  )

  return patients.filter((patient) => {
    const searchablePatientText = normalizePatientSearch(
      patient.medicalRecordNumber,
      patient.firstName,
      patient.middleName,
      patient.lastName,
      getPatientFullName(patient),
      patient.mobileNumber,
      patient.emailAddress
    )

    const matchesSearch =
      normalizedQuery.length === 0 ||
      searchablePatientText.includes(normalizedQuery)

    const matchesStatus =
      filters.status === "all" ||
      patient.status === filters.status

    const matchesBiologicalSex =
      filters.biologicalSex === "all" ||
      patient.biologicalSex === filters.biologicalSex

    const matchesBranch =
      filters.branchId === "all" ||
      patient.branchId === filters.branchId

    const matchesVisit = matchesLastVisitFilter(
      patient.lastVisitAt,
      filters.lastVisit
    )

    return (
      matchesSearch &&
      matchesStatus &&
      matchesBiologicalSex &&
      matchesBranch &&
      matchesVisit
    )
  })
}

export function PatientTable({
  patients,
  initialSearch = "",
  onViewPatient,
  onOpenPatientProfile,
  onEditPatient,
  onArchivePatient,
}: PatientTableProps) {
  const [filters, setFilters] = useState<PatientFilters>(
    () => ({
      ...DEFAULT_PATIENT_FILTERS,
      search: initialSearch,
    })
  )

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "patientName",
      desc: false,
    },
  ])

  const [pagination, setPagination] =
    useState<PaginationState>({
      pageIndex: 0,
      pageSize: DEFAULT_PATIENT_PAGE_SIZE,
    })

  const filteredPatients = useMemo(
    () => filterPatients(patients, filters),
    [patients, filters]
  )

  const columns = useMemo(
    () =>
      getPatientTableColumns({
        onViewPatient,
        onOpenPatientProfile,
        onEditPatient,
        onArchivePatient,
      }),
    [
      onViewPatient,
      onOpenPatientProfile,
      onEditPatient,
      onArchivePatient,
    ]
  )

  // TanStack Table v8 is intentionally excluded from React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredPatients,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  })

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.biologicalSex !== "all" ||
    filters.branchId !== "all" ||
    filters.lastVisit !== "all"

  function updateFilter<Key extends keyof PatientFilters>(
    key: Key,
    value: PatientFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))

    setPagination((currentPagination) => ({
      ...currentPagination,
      pageIndex: 0,
    }))
  }

  function resetFilters() {
    setFilters(DEFAULT_PATIENT_FILTERS)

    setPagination((currentPagination) => ({
      ...currentPagination,
      pageIndex: 0,
    }))
  }

  if (patients.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <PatientEmptyState variant="registry-empty" />
      </div>
    )
  }

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = Math.max(table.getPageCount(), 1)

  const visibleStart =
    filteredPatients.length === 0
      ? 0
      : pageIndex * pageSize + 1

  const visibleEnd = Math.min(
    (pageIndex + 1) * pageSize,
    filteredPatients.length
  )

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <PatientTableToolbar
        filters={filters}
        filteredCount={filteredPatients.length}
        totalCount={patients.length}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={(value) =>
          updateFilter("search", value)
        }
        onStatusChange={(value: PatientStatus | "all") =>
          updateFilter("status", value)
        }
        onBiologicalSexChange={(
          value: BiologicalSex | "all"
        ) => updateFilter("biologicalSex", value)}
        onBranchChange={(value) =>
          updateFilter("branchId", value)
        }
        onLastVisitChange={(value) =>
          updateFilter("lastVisit", value)
        }
        onResetFilters={resetFilters}
      />

      {filteredPatients.length === 0 ? (
        <PatientEmptyState
          variant="no-results"
          onResetFilters={resetFilters}
        />
      ) : (
        <>
          <Table className="min-w-[1180px]">
            <TableHeader className="bg-slate-50/80">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <p>
                Rows {visibleStart}–{visibleEnd} of{" "}
                {filteredPatients.length}
              </p>

              <label
                htmlFor="patient-page-size"
                className="flex items-center gap-2"
              >
                Rows per page

                <select
                  id="patient-page-size"
                  value={pageSize}
                  className="h-7 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  onChange={(event) => {
                    const selectedPageSize = Number(
                      event.target.value
                    )

                    if (
                      selectedPageSize === 10 ||
                      selectedPageSize === 20 ||
                      selectedPageSize === 50
                    ) {
                      table.setPageSize(selectedPageSize)
                    }
                  }}
                >
                  {PATIENT_PAGE_SIZE_OPTIONS.map(
                    (pageSizeOption) => (
                      <option
                        key={pageSizeOption}
                        value={pageSizeOption}
                      >
                        {pageSizeOption}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="text-xs text-muted-foreground">
                Page {pageIndex + 1} of {pageCount}
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
