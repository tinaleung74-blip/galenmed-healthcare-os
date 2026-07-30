"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  Archive,
  BadgeCheck,
  CircleDollarSign,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PatientInsuranceArchiveDialog } from "@/features/patients/components/patient-insurance-archive-dialog"
import { PatientInsuranceDetailsSheet } from "@/features/patients/components/patient-insurance-details-sheet"
import { PatientInsuranceFormDialog } from "@/features/patients/components/patient-insurance-form-dialog"
import {
  InsuranceCoverageStatusBadge,
  InsurancePriorityBadge,
  InsuranceRecordStatusBadge,
  InsuranceVerificationBadge,
} from "@/features/patients/components/patient-insurance-status-badges"
import {
  DEFAULT_PATIENT_INSURANCE_FILTERS,
  INSURANCE_COVERAGE_STATUS_LABELS,
  INSURANCE_COVERAGE_TYPE_LABELS,
  INSURANCE_RECORD_STATUS_LABELS,
  INSURANCE_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-insurance.constants"
import { usePatientInsurance } from "@/features/patients/providers/patient-insurance-provider"
import type { PatientInsuranceFormValues } from "@/features/patients/schemas/patient-insurance.schema"
import {
  INSURANCE_COVERAGE_STATUSES,
  INSURANCE_COVERAGE_TYPES,
  INSURANCE_RECORD_STATUSES,
  INSURANCE_VERIFICATION_STATUSES,
  type InsuranceCoverageStatus,
  type InsuranceCoverageType,
  type InsuranceRecordStatus,
  type InsuranceVerificationStatus,
  type PatientInsuranceFilters,
  type PatientInsuranceRecord,
} from "@/features/patients/types/patient-insurance.types"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  formatPatientDate,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import {
  maskInsuranceIdentifier,
} from "@/features/patients/utils/patient-insurance.utils"

interface PatientInsuranceWorkspaceProps {
  patient: Patient
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

const priorityOrder = {
  primary: 0,
  secondary: 1,
  tertiary: 2,
} as const

function isCoverageTypeFilter(
  value: string
): value is InsuranceCoverageType | "all" {
  return (
    value === "all" ||
    INSURANCE_COVERAGE_TYPES.some(
      (coverageType) => coverageType === value
    )
  )
}

function isCoverageStatusFilter(
  value: string
): value is InsuranceCoverageStatus | "all" {
  return (
    value === "all" ||
    INSURANCE_COVERAGE_STATUSES.some(
      (status) => status === value
    )
  )
}

function isVerificationFilter(
  value: string
): value is InsuranceVerificationStatus | "all" {
  return (
    value === "all" ||
    INSURANCE_VERIFICATION_STATUSES.some(
      (status) => status === value
    )
  )
}

function isRecordStatusFilter(
  value: string
): value is InsuranceRecordStatus | "all" {
  return (
    value === "all" ||
    INSURANCE_RECORD_STATUSES.some(
      (status) => status === value
    )
  )
}

function matchesInsuranceSearch(
  record: PatientInsuranceRecord,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableRecord =
    normalizePatientSearch(
      record.payerName,
      record.planName,
      record.memberNumber,
      record.policyNumber,
      record.groupNumber,
      record.subscriberName,
      record.employerName,
      record.payerContactNumber,
      record.sourceDetails,
      record.verificationReference,
      record.coveredServices.join(" "),
      record.notes,
      record.recordedBy,
      record.updatedBy
    )

  return searchableRecord.includes(
    normalizedSearch
  )
}

export function PatientInsuranceWorkspace({
  patient,
}: PatientInsuranceWorkspaceProps) {
  const {
    insuranceRecords,
    createInsuranceRecord,
    updateInsuranceRecord,
    archiveInsuranceRecord,
  } = usePatientInsurance()

  const [filters, setFilters] =
    useState<PatientInsuranceFilters>(() => ({
      ...DEFAULT_PATIENT_INSURANCE_FILTERS,
    }))

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    viewingRecordId,
    setViewingRecordId,
  ] = useState<string | null>(null)

  const [
    editingRecordId,
    setEditingRecordId,
  ] = useState<string | null>(null)

  const [
    archivingRecordId,
    setArchivingRecordId,
  ] = useState<string | null>(null)

  const patientRecords = useMemo(
    () =>
      insuranceRecords
        .filter(
          (record) =>
            record.patientId === patient.id
        )
        .sort(
          (firstRecord, secondRecord) =>
            priorityOrder[firstRecord.priority] -
              priorityOrder[secondRecord.priority] ||
            new Date(
              secondRecord.updatedAt
            ).getTime() -
              new Date(
                firstRecord.updatedAt
              ).getTime()
        ),
    [insuranceRecords, patient.id]
  )

  const filteredRecords = useMemo(
    () =>
      patientRecords.filter((record) => {
        const matchesSearch =
          matchesInsuranceSearch(
            record,
            filters.search
          )

        const matchesCoverageType =
          filters.coverageType === "all" ||
          record.coverageType ===
            filters.coverageType

        const matchesCoverageStatus =
          filters.coverageStatus === "all" ||
          record.coverageStatus ===
            filters.coverageStatus

        const matchesVerification =
          filters.verificationStatus === "all" ||
          record.verificationStatus ===
            filters.verificationStatus

        const matchesRecordStatus =
          filters.recordStatus === "all" ||
          record.recordStatus ===
            filters.recordStatus

        return (
          matchesSearch &&
          matchesCoverageType &&
          matchesCoverageStatus &&
          matchesVerification &&
          matchesRecordStatus
        )
      }),
    [patientRecords, filters]
  )

  const viewingRecord =
    patientRecords.find(
      (record) =>
        record.id === viewingRecordId
    ) ?? null

  const editingRecord =
    patientRecords.find(
      (record) =>
        record.id === editingRecordId
    ) ?? null

  const archivingRecord =
    patientRecords.find(
      (record) =>
        record.id === archivingRecordId
    ) ?? null

  const currentRecordCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current"
    ).length

  const activeCoverageCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.coverageStatus === "active"
    ).length

  const verifiedCoverageCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.verificationStatus ===
          "verified"
    ).length

  const authorizationRequiredCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.authorizationRequired
    ).length

  const archivedRecordCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "archived"
    ).length

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.coverageType !== "all" ||
    filters.coverageStatus !== "all" ||
    filters.verificationStatus !== "all" ||
    filters.recordStatus !== "current"

  function updateFilter<
    Key extends keyof PatientInsuranceFilters,
  >(
    key: Key,
    value: PatientInsuranceFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_PATIENT_INSURANCE_FILTERS,
    })
  }

  async function handleCreateRecord(
    values: PatientInsuranceFormValues
  ): Promise<void> {
    const newRecord = createInsuranceRecord(
      patient.id,
      values
    )

    toast.success(
      "Insurance coverage added",
      {
        description: `${newRecord.payerName} — ${newRecord.planName} was added to the patient profile.`,
      }
    )
  }

  async function handleUpdateRecord(
    values: PatientInsuranceFormValues
  ): Promise<void> {
    if (!editingRecord) {
      throw new Error(
        "No insurance record was selected."
      )
    }

    const updatedRecord =
      updateInsuranceRecord(
        editingRecord.id,
        values
      )

    toast.success(
      "Insurance coverage updated",
      {
        description: `${updatedRecord.payerName} — ${updatedRecord.planName} was updated successfully.`,
      }
    )
  }

  function handleConfirmArchive(
    archiveReason: string
  ) {
    if (!archivingRecord) {
      return
    }

    try {
      const archivedRecord =
        archiveInsuranceRecord(
          archivingRecord.id,
          archiveReason
        )

      toast.success(
        "Insurance coverage archived",
        {
          description: `${archivedRecord.payerName} — ${archivedRecord.planName} remains available for audit reference.`,
        }
      )

      setArchivingRecordId(null)
    } catch {
      toast.error(
        "Unable to archive coverage",
        {
          description:
            "The insurance coverage record could not be archived.",
        }
      )
    }
  }

  function editRecordFromDetails(
    record: PatientInsuranceRecord
  ) {
    setViewingRecordId(null)
    setEditingRecordId(record.id)
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
              <BadgeCheck
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Insurance Coverage
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Payer, member, subscriber, verification,
                eligibility, and authorization records.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() =>
              setIsCreateDialogOpen(true)
            }
          >
            <Plus aria-hidden="true" />
            Add coverage
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Current records
              </p>

              <p className="mt-1 text-xl font-semibold">
                {currentRecordCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Active coverage
              </p>

              <p className="mt-1 text-xl font-semibold">
                {activeCoverageCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-sky-50/50 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-sky-700">
                Verified coverage
              </p>

              <p className="mt-1 text-xl font-semibold text-sky-800">
                {verifiedCoverageCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Authorization flagged
              </p>

              <p className="mt-1 text-xl font-semibold">
                {authorizationRequiredCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Archived records
              </p>

              <p className="mt-1 text-xl font-semibold">
                {archivedRecordCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="space-y-4 border-b p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1 xl:max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  value={filters.search}
                  placeholder="Search payer, plan, member, policy, or subscriber"
                  aria-label="Search insurance coverage"
                  className="pl-8"
                  onChange={(event) =>
                    updateFilter(
                      "search",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.coverageType}
                  aria-label="Filter insurance coverage type"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isCoverageTypeFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "coverageType",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All coverage types
                  </option>

                  {INSURANCE_COVERAGE_TYPES.map(
                    (coverageType) => (
                      <option
                        key={coverageType}
                        value={coverageType}
                      >
                        {
                          INSURANCE_COVERAGE_TYPE_LABELS[
                            coverageType
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.coverageStatus}
                  aria-label="Filter insurance coverage status"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isCoverageStatusFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "coverageStatus",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All coverage statuses
                  </option>

                  {INSURANCE_COVERAGE_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          INSURANCE_COVERAGE_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filters.verificationStatus
                  }
                  aria-label="Filter insurance verification status"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isVerificationFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "verificationStatus",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All verification statuses
                  </option>

                  {INSURANCE_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          INSURANCE_VERIFICATION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.recordStatus}
                  aria-label="Filter current or archived insurance records"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isRecordStatusFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "recordStatus",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All records
                  </option>

                  {INSURANCE_RECORD_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          INSURANCE_RECORD_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetFilters}
                  >
                    <RotateCcw aria-hidden="true" />
                    Reset
                  </Button>
                ) : null}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {filteredRecords.length} of{" "}
              {patientRecords.length} insurance records
            </p>
          </div>

          {patientRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <BadgeCheck
                className="size-8 text-sky-700"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No insurance coverage recorded
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No structured payer or coverage records
                have been added for this patient.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching insurance records
              </h3>

              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <Table className="min-w-[1440px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Payer / Plan</TableHead>
                  <TableHead>Type / Priority</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Coverage status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Coverage period</TableHead>
                  <TableHead>Authorization</TableHead>
                  <TableHead>Record status</TableHead>
                  <TableHead>
                    <span className="sr-only">
                      Record actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className={
                      record.recordStatus ===
                      "archived"
                        ? "bg-slate-50/70"
                        : undefined
                    }
                  >
                    <TableCell>
                      <div className="max-w-xs whitespace-normal">
                        <p className="font-medium">
                          {record.payerName}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {record.planName}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p>
                        {
                          INSURANCE_COVERAGE_TYPE_LABELS[
                            record.coverageType
                          ]
                        }
                      </p>

                      <div className="mt-1">
                        <InsurancePriorityBadge
                          priority={record.priority}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="font-mono text-xs">
                        {maskInsuranceIdentifier(
                          record.memberNumber
                        )}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Subscriber:{" "}
                        {record.subscriberName}
                      </p>
                    </TableCell>

                    <TableCell>
                      <InsuranceCoverageStatusBadge
                        status={
                          record.coverageStatus
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <InsuranceVerificationBadge
                        status={
                          record.verificationStatus
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <p>
                        {formatPatientDate(
                          record.effectiveFrom
                        )}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        To:{" "}
                        {formatPatientDate(
                          record.effectiveTo,
                          "No end date"
                        )}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CircleDollarSign
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />

                        <span>
                          {record.authorizationRequired
                            ? "May be required"
                            : "Not indicated"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <InsuranceRecordStatusBadge
                        status={record.recordStatus}
                      />
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Open actions for ${record.payerName} ${record.planName}`}
                            >
                              <MoreHorizontal
                                aria-hidden="true"
                              />
                            </Button>
                          }
                        />

                        <DropdownMenuContent
                          align="end"
                          className="w-48"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>
                              Coverage actions
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() =>
                                setViewingRecordId(
                                  record.id
                                )
                              }
                            >
                              <Eye aria-hidden="true" />
                              View coverage
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={
                                record.recordStatus ===
                                "archived"
                              }
                              onClick={() =>
                                setEditingRecordId(
                                  record.id
                                )
                              }
                            >
                              <Pencil aria-hidden="true" />
                              {record.recordStatus ===
                              "archived"
                                ? "Archived record"
                                : "Edit coverage"}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            disabled={
                              record.recordStatus ===
                              "archived"
                            }
                            onClick={() =>
                              setArchivingRecordId(
                                record.id
                              )
                            }
                          >
                            <Archive aria-hidden="true" />
                            {record.recordStatus ===
                            "archived"
                              ? "Already archived"
                              : "Archive coverage"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs text-sky-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            Insurance eligibility and benefits must be
            re-verified before authorization, claim
            submission, or financial commitment.
          </p>
        </div>
      </section>

      <PatientInsuranceFormDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmitRecord={handleCreateRecord}
      />

      <PatientInsuranceFormDialog
        mode="edit"
        record={editingRecord}
        open={Boolean(editingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingRecordId(null)
          }
        }}
        onSubmitRecord={handleUpdateRecord}
      />

      <PatientInsuranceDetailsSheet
        record={viewingRecord}
        open={Boolean(viewingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
        onEditRecord={editRecordFromDetails}
      />

      <PatientInsuranceArchiveDialog
        record={archivingRecord}
        open={Boolean(archivingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setArchivingRecordId(null)
          }
        }}
        onConfirmArchive={
          handleConfirmArchive
        }
      />
    </>
  )
}
