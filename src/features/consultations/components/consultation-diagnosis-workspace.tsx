"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  Archive,
  Eye,
  HeartPulse,
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
import { ConsultationDiagnosisArchiveDialog } from "@/features/consultations/components/consultation-diagnosis-archive-dialog"
import { ConsultationDiagnosisDetailsSheet } from "@/features/consultations/components/consultation-diagnosis-details-sheet"
import { ConsultationDiagnosisFormDialog } from "@/features/consultations/components/consultation-diagnosis-form-dialog"
import {
  DiagnosisRecordStatusBadge,
  DiagnosisRoleBadge,
  DiagnosisVerificationBadge,
} from "@/features/consultations/components/consultation-diagnosis-status-badges"
import {
  CONSULTATION_DIAGNOSIS_RECORD_STATUS_LABELS,
  CONSULTATION_DIAGNOSIS_ROLE_LABELS,
  CONSULTATION_DIAGNOSIS_VERIFICATION_LABELS,
} from "@/features/consultations/constants/consultation-diagnosis.constants"
import { useConsultationDiagnoses } from "@/features/consultations/providers/consultation-diagnosis-provider"
import type { ConsultationDiagnosisFormValues } from "@/features/consultations/schemas/consultation-diagnosis.schema"
import {
  CONSULTATION_DIAGNOSIS_RECORD_STATUSES,
  CONSULTATION_DIAGNOSIS_ROLES,
  CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES,
  type ConsultationDiagnosisRecord,
  type ConsultationDiagnosisRecordStatus,
  type ConsultationDiagnosisRole,
  type ConsultationDiagnosisVerificationStatus,
} from "@/features/consultations/types/consultation-diagnosis.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import {
  formatPatientDate,
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import { cn } from "@/lib/utils"

interface ConsultationDiagnosisWorkspaceProps {
  consultation: ConsultationEncounter
}

interface DiagnosisFilters {
  search: string
  role:
    | ConsultationDiagnosisRole
    | "all"
  verificationStatus:
    | ConsultationDiagnosisVerificationStatus
    | "all"
  recordStatus:
    | ConsultationDiagnosisRecordStatus
    | "all"
}

const DEFAULT_DIAGNOSIS_FILTERS:
  DiagnosisFilters = {
  search: "",
  role: "all",
  verificationStatus: "all",
  recordStatus: "current",
}

const roleOrder: Record<
  ConsultationDiagnosisRole,
  number
> = {
  primary: 0,
  secondary: 1,
  differential: 2,
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function isRoleFilter(
  value: string
): value is
  | ConsultationDiagnosisRole
  | "all" {
  return (
    value === "all" ||
    CONSULTATION_DIAGNOSIS_ROLES.some(
      (role) => role === value
    )
  )
}

function isVerificationFilter(
  value: string
): value is
  | ConsultationDiagnosisVerificationStatus
  | "all" {
  return (
    value === "all" ||
    CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES.some(
      (status) => status === value
    )
  )
}

function isRecordStatusFilter(
  value: string
): value is
  | ConsultationDiagnosisRecordStatus
  | "all" {
  return (
    value === "all" ||
    CONSULTATION_DIAGNOSIS_RECORD_STATUSES.some(
      (status) => status === value
    )
  )
}

function matchesDiagnosisSearch(
  record:
    ConsultationDiagnosisRecord,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableRecord =
    normalizePatientSearch(
      record.diagnosisName,
      record.icd10Code,
      record.codeSystem,
      record.clinicalNotes,
      record.recordedBy,
      record.updatedBy,
      CONSULTATION_DIAGNOSIS_ROLE_LABELS[
        record.role
      ],
      CONSULTATION_DIAGNOSIS_VERIFICATION_LABELS[
        record.verificationStatus
      ]
    )

  return searchableRecord.includes(
    normalizedSearch
  )
}

export function ConsultationDiagnosisWorkspace({
  consultation,
}: ConsultationDiagnosisWorkspaceProps) {
  const {
    diagnosisRecords,
    createDiagnosisRecord,
    updateDiagnosisRecord,
    archiveDiagnosisRecord,
  } = useConsultationDiagnoses()

  const [filters, setFilters] =
    useState<DiagnosisFilters>(() => ({
      ...DEFAULT_DIAGNOSIS_FILTERS,
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

  const consultationRecords = useMemo(
    () =>
      diagnosisRecords
        .filter(
          (record) =>
            record.consultationId ===
            consultation.id
        )
        .sort(
          (
            firstRecord,
            secondRecord
          ) =>
            roleOrder[
              firstRecord.role
            ] -
              roleOrder[
                secondRecord.role
              ] ||
            new Date(
              secondRecord.updatedAt
            ).getTime() -
              new Date(
                firstRecord.updatedAt
              ).getTime()
        ),
    [
      diagnosisRecords,
      consultation.id,
    ]
  )

  const filteredRecords = useMemo(
    () =>
      consultationRecords.filter(
        (record) => {
          const matchesSearch =
            matchesDiagnosisSearch(
              record,
              filters.search
            )

          const matchesRole =
            filters.role === "all" ||
            record.role === filters.role

          const matchesVerification =
            filters.verificationStatus ===
              "all" ||
            record.verificationStatus ===
              filters.verificationStatus

          const matchesRecordStatus =
            filters.recordStatus === "all" ||
            record.recordStatus ===
              filters.recordStatus

          return (
            matchesSearch &&
            matchesRole &&
            matchesVerification &&
            matchesRecordStatus
          )
        }
      ),
    [consultationRecords, filters]
  )

  const viewingRecord =
    consultationRecords.find(
      (record) =>
        record.id === viewingRecordId
    ) ?? null

  const editingRecord =
    consultationRecords.find(
      (record) =>
        record.id === editingRecordId
    ) ?? null

  const archivingRecord =
    consultationRecords.find(
      (record) =>
        record.id === archivingRecordId
    ) ?? null

  const currentRecords =
    consultationRecords.filter(
      (record) =>
        record.recordStatus === "current"
    )

  const primaryDiagnosis =
    currentRecords.find(
      (record) =>
        record.role === "primary"
    ) ?? null

  const confirmedCount =
    currentRecords.filter(
      (record) =>
        record.verificationStatus ===
        "confirmed"
    ).length

  const differentialCount =
    currentRecords.filter(
      (record) =>
        record.role === "differential"
    ).length

  const archivedCount =
    consultationRecords.filter(
      (record) =>
        record.recordStatus === "archived"
    ).length

  const canEdit =
    consultation.status === "in-progress"

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.role !== "all" ||
    filters.verificationStatus !== "all" ||
    filters.recordStatus !== "current"

  function updateFilter<
    Key extends keyof DiagnosisFilters,
  >(
    key: Key,
    value: DiagnosisFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_DIAGNOSIS_FILTERS,
    })
  }

  async function handleCreateRecord(
    values:
      ConsultationDiagnosisFormValues
  ): Promise<void> {
    const newRecord =
      createDiagnosisRecord(
        consultation.id,
        values
      )

    toast.success(
      "Diagnosis added",
      {
        description: `${newRecord.diagnosisName} was added to the consultation.`,
      }
    )
  }

  async function handleUpdateRecord(
    values:
      ConsultationDiagnosisFormValues
  ): Promise<void> {
    if (!editingRecord) {
      throw new Error(
        "No diagnosis was selected."
      )
    }

    const updatedRecord =
      updateDiagnosisRecord(
        editingRecord.id,
        values
      )

    toast.success(
      "Diagnosis updated",
      {
        description: `${updatedRecord.diagnosisName} was updated successfully.`,
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
        archiveDiagnosisRecord(
          archivingRecord.id,
          archiveReason
        )

      toast.success(
        "Diagnosis archived",
        {
          description: `${archivedRecord.diagnosisName} remains available for clinical audit.`,
        }
      )

      setArchivingRecordId(null)
    } catch (error) {
      toast.error(
        "Unable to archive diagnosis",
        {
          description:
            error instanceof Error
              ? error.message
              : "The diagnosis could not be archived.",
        }
      )
    }
  }

  function editRecordFromDetails(
    record:
      ConsultationDiagnosisRecord
  ) {
    setViewingRecordId(null)
    setEditingRecordId(record.id)
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <HeartPulse
                className="size-4 text-rose-700"
                aria-hidden="true"
              />

              <h2 className="text-lg font-semibold">
                Diagnosis &amp; ICD-10
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Structured consultation diagnoses,
              clinical roles, and verification
              status.
            </p>
          </div>

          <Button
            type="button"
            disabled={!canEdit}
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() =>
              setIsCreateDialogOpen(true)
            }
          >
            <Plus aria-hidden="true" />
            Add diagnosis
          </Button>
        </div>

        {!canEdit ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            This completed encounter is
            read-only. Diagnoses cannot be
            changed without a future authorized
            amendment workflow.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Current diagnoses
              </p>

              <p className="mt-1 text-xl font-semibold">
                {currentRecords.length}
              </p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "shadow-none",
              primaryDiagnosis &&
                "border-rose-200 bg-rose-50/40"
            )}
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Primary diagnosis
              </p>

              <p className="mt-1 line-clamp-2 text-sm font-semibold">
                {primaryDiagnosis
                  ? primaryDiagnosis.diagnosisName
                  : "Not recorded"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Confirmed
              </p>

              <p className="mt-1 text-xl font-semibold">
                {confirmedCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Differential / Archived
              </p>

              <p className="mt-1 text-xl font-semibold">
                {differentialCount}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  / {archivedCount}
                </span>
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
                  placeholder="Search diagnosis, ICD-10, or notes"
                  aria-label="Search consultation diagnoses"
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
                  value={filters.role}
                  aria-label="Filter diagnosis role"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isRoleFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "role",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All diagnosis roles
                  </option>

                  {CONSULTATION_DIAGNOSIS_ROLES.map(
                    (role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {
                          CONSULTATION_DIAGNOSIS_ROLE_LABELS[
                            role
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
                  aria-label="Filter diagnosis verification"
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

                  {CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          CONSULTATION_DIAGNOSIS_VERIFICATION_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.recordStatus}
                  aria-label="Filter current or archived diagnoses"
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

                  {CONSULTATION_DIAGNOSIS_RECORD_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          CONSULTATION_DIAGNOSIS_RECORD_STATUS_LABELS[
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
                    <RotateCcw
                      aria-hidden="true"
                    />
                    Reset
                  </Button>
                ) : null}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {filteredRecords.length} of{" "}
              {consultationRecords.length} diagnosis
              records
            </p>
          </div>

          {consultationRecords.length ===
          0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <HeartPulse
                className="size-8 text-rose-700"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No diagnoses recorded
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No structured diagnosis records
                have been added to this
                consultation.
              </p>
            </div>
          ) : filteredRecords.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching diagnoses
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
            <Table className="min-w-[1100px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>
                    Diagnosis
                  </TableHead>

                  <TableHead>
                    ICD-10
                  </TableHead>

                  <TableHead>
                    Role
                  </TableHead>

                  <TableHead>
                    Verification
                  </TableHead>

                  <TableHead>
                    Onset
                  </TableHead>

                  <TableHead>
                    Updated
                  </TableHead>

                  <TableHead>
                    Record status
                  </TableHead>

                  <TableHead>
                    <span className="sr-only">
                      Diagnosis actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map(
                  (record) => (
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
                        <div className="max-w-sm whitespace-normal">
                          <p className="font-medium">
                            {
                              record.diagnosisName
                            }
                          </p>

                          {record.clinicalNotes ? (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {
                                record.clinicalNotes
                              }
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs">
                          {record.icd10Code ??
                            "Not recorded"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <DiagnosisRoleBadge
                          role={record.role}
                        />
                      </TableCell>

                      <TableCell>
                        <DiagnosisVerificationBadge
                          status={
                            record.verificationStatus
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {formatPatientDate(
                          record.onsetDate,
                          "Not recorded"
                        )}
                      </TableCell>

                      <TableCell>
                        <p>
                          {formatPatientDateTime(
                            record.updatedAt
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {record.updatedBy}
                        </p>
                      </TableCell>

                      <TableCell>
                        <DiagnosisRecordStatusBadge
                          status={
                            record.recordStatus
                          }
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
                                aria-label={`Open actions for ${record.diagnosisName}`}
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
                                Diagnosis actions
                              </DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() =>
                                  setViewingRecordId(
                                    record.id
                                  )
                                }
                              >
                                <Eye
                                  aria-hidden="true"
                                />
                                View diagnosis
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={
                                  !canEdit ||
                                  record.recordStatus ===
                                    "archived"
                                }
                                onClick={() =>
                                  setEditingRecordId(
                                    record.id
                                  )
                                }
                              >
                                <Pencil
                                  aria-hidden="true"
                                />

                                {record.recordStatus ===
                                "archived"
                                  ? "Archived diagnosis"
                                  : canEdit
                                    ? "Edit diagnosis"
                                    : "Read-only diagnosis"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              variant="destructive"
                              disabled={
                                !canEdit ||
                                record.recordStatus ===
                                  "archived"
                              }
                              onClick={() =>
                                setArchivingRecordId(
                                  record.id
                                )
                              }
                            >
                              <Archive
                                aria-hidden="true"
                              />

                              {record.recordStatus ===
                              "archived"
                                ? "Already archived"
                                : "Archive diagnosis"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            ICD-10 format validation does not
            confirm coding accuracy or clinical
            appropriateness. Production coding
            requires an authorized clinical
            workflow.
          </p>
        </div>
      </section>

      <ConsultationDiagnosisFormDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        onSubmitRecord={
          handleCreateRecord
        }
      />

      <ConsultationDiagnosisFormDialog
        mode="edit"
        record={editingRecord}
        open={Boolean(editingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingRecordId(null)
          }
        }}
        onSubmitRecord={
          handleUpdateRecord
        }
      />

      <ConsultationDiagnosisDetailsSheet
        record={viewingRecord}
        open={Boolean(viewingRecord)}
        canEdit={canEdit}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
        onEditRecord={
          editRecordFromDetails
        }
      />

      <ConsultationDiagnosisArchiveDialog
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
