import type {
  Column,
  ColumnDef,
} from "@tanstack/react-table"
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BIOLOGICAL_SEX_LABELS,
} from "@/features/patients/constants/patient.constants"
import { PatientStatusBadge } from "@/features/patients/components/patient-status-badge"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  calculateAge,
  formatPatientDate,
  getPatientFullName,
  getPatientInitials,
} from "@/features/patients/utils/patient.utils"

interface SortableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  label: string
}

export interface PatientTableActionHandlers {
  onViewPatient: (patient: Patient) => void
  onEditPatient: (patient: Patient) => void
  onArchivePatient: (patient: Patient) => void
}

function SortableColumnHeader<TData, TValue>({
  column,
  label,
}: SortableColumnHeaderProps<TData, TValue>) {
  const sortingDirection = column.getIsSorted()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2"
      onClick={() =>
        column.toggleSorting(
          sortingDirection === "asc"
        )
      }
      aria-label={`Sort by ${label}`}
    >
      {label}

      {sortingDirection === "asc" ? (
        <ArrowUp aria-hidden="true" />
      ) : sortingDirection === "desc" ? (
        <ArrowDown aria-hidden="true" />
      ) : (
        <ArrowUpDown aria-hidden="true" />
      )}
    </Button>
  )
}

export function getPatientTableColumns({
  onViewPatient,
  onEditPatient,
  onArchivePatient,
}: PatientTableActionHandlers): ColumnDef<Patient>[] {
  return [
    {
      id: "patientName",
      accessorFn: (patient) =>
        getPatientFullName(patient),
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          label="Patient"
        />
      ),
      cell: ({ row }) => {
        const patient = row.original

        return (
          <div className="flex min-w-56 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
              {getPatientInitials(patient)}
            </div>

            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {getPatientFullName(patient)}
              </p>

              <p className="text-xs text-muted-foreground">
                {patient.medicalRecordNumber}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "medicalRecordNumber",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          label="MRN"
        />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.medicalRecordNumber}
        </span>
      ),
    },
    {
      accessorKey: "dateOfBirth",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          label="Date of birth"
        />
      ),
      cell: ({ row }) => {
        const age = calculateAge(
          row.original.dateOfBirth
        )

        return (
          <div>
            <p>
              {formatPatientDate(
                row.original.dateOfBirth
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {age === null
                ? "Age unavailable"
                : `${age} years old`}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "biologicalSex",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          label="Sex"
        />
      ),
      cell: ({ row }) =>
        BIOLOGICAL_SEX_LABELS[
          row.original.biologicalSex
        ],
    },
    {
      id: "contact",
      header: "Contact",
      enableSorting: false,
      cell: ({ row }) => {
        const patient = row.original

        return (
          <div className="max-w-48">
            <p>
              {patient.mobileNumber ??
                "No mobile number"}
            </p>

            <p className="truncate text-xs text-muted-foreground">
              {patient.emailAddress ??
                "No email address"}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "branchName",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          label="Branch"
        />
      ),
      cell: ({ row }) => (
        <span className="whitespace-normal">
          {row.original.branchName}
        </span>
      ),
    },
    {
      id: "lastVisitAt",
      accessorFn: (patient) =>
        patient.lastVisitAt ?? "",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          label="Last visit"
        />
      ),
      cell: ({ row }) => (
        <span
          className={
            row.original.lastVisitAt
              ? ""
              : "text-muted-foreground"
          }
        >
          {formatPatientDate(
            row.original.lastVisitAt
          )}
        </span>
      ),
      sortDescFirst: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          label="Registered"
        />
      ),
      cell: ({ row }) =>
        formatPatientDate(row.original.createdAt),
      sortDescFirst: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          label="Status"
        />
      ),
      cell: ({ row }) => (
        <PatientStatusBadge
          status={row.original.status}
        />
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">
          Patient actions
        </span>
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const patient = row.original
        const patientName =
          getPatientFullName(patient)

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Open actions for ${patientName}`}
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              }
            />

            <DropdownMenuContent
              align="end"
              className="w-48"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  Patient actions
                </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() =>
                  onViewPatient(patient)
                }
              >
                <Eye aria-hidden="true" />
                View details
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  onEditPatient(patient)
                }
              >
                <Pencil aria-hidden="true" />
                Edit demographics
              </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                disabled={
                  patient.status === "archived"
                }
                onClick={() =>
                  onArchivePatient(patient)
                }
              >
                <Archive aria-hidden="true" />
                {patient.status === "archived"
                  ? "Already archived"
                  : "Archive patient"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
