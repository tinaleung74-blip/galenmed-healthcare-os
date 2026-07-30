"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  Archive,
  CheckCircle2,
  ClipboardList,
  Eye,
  FilePlus2,
  MoreHorizontal,
  Pencil,
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
import { MedicalHistoryArchiveDialog } from "@/features/patients/components/medical-history-archive-dialog"
import { MedicalHistoryFormDialog } from "@/features/patients/components/medical-history-form-dialog"
import { MedicalHistoryRecordDetailsSheet } from "@/features/patients/components/medical-history-record-details-sheet"
import {
  MedicalConditionStatusBadge,
  MedicalHistoryRecordStatusBadge,
  MedicalHistoryVerificationBadge,
} from "@/features/patients/components/medical-history-status-badges"
import {
  DEFAULT_MEDICAL_HISTORY_FILTERS,
  MEDICAL_CONDITION_STATUS_LABELS,
  MEDICAL_HISTORY_RECORD_STATUS_LABELS,
  MEDICAL_HISTORY_SOURCE_LABELS,
  MEDICAL_HISTORY_VERIFICATION_LABELS,
} from "@/features/patients/constants/medical-history.constants"
import { usePatientMedicalHistory } from "@/features/patients/providers/patient-medical-history-provider"
import type { MedicalHistoryFormValues } from "@/features/patients/schemas/medical-history.schema"
import {
  MEDICAL_CONDITION_CLINICAL_STATUSES,
  MEDICAL_HISTORY_RECORD_STATUSES,
  MEDICAL_HISTORY_VERIFICATION_STATUSES,
  type MedicalConditionClinicalStatus,
  type MedicalHistoryFilters,
  type MedicalHistoryRecord,
  type MedicalHistoryRecordStatus,
  type MedicalHistoryVerificationStatus,
} from "@/features/patients/types/medical-history.types"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  formatPatientDate,
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface MedicalHistoryWorkspaceProps {
  patient: Patient
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function isClinicalStatusFilter(
  value: string
): value is MedicalConditionClinicalStatus | "all" {
  return (
    value === "all" ||
    MEDICAL_CONDITION_CLINICAL_STATUSES.some(
      (status) => status === value
    )
  )
}

function isVerificationStatusFilter(
  value: string
): value is MedicalHistoryVerificationStatus | "all" {
  return (
    value === "all" ||
    MEDICAL_HISTORY_VERIFICATION_STATUSES.some(
      (status) => status === value
    )
  )
}

function isRecordStatusFilter(
  value: string
): value is MedicalHistoryRecordStatus | "all" {
  return (
    value === "all" ||
    MEDICAL_HISTORY_RECORD_STATUSES.some(
      (status) => status === value
    )
  )
}

function matchesMedicalHistorySearch(
  record: MedicalHistoryRecord,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableRecord =
    normalizePatientSearch(
      record.conditionName,
      record.icd10Code,
      record.notes,
      record.sourceDetails,
      record.recordedBy,
      record.updatedBy
    )

  return searchableRecord.includes(
    normalizedSearch
  )
}

export function MedicalHistoryWorkspace({
  patient,
}: MedicalHistoryWorkspaceProps) {
  const {
    medicalHistoryRecords,
    createMedicalHistoryRecord,
    updateMedicalHistoryRecord,
    archiveMedicalHistoryRecord,
  } = usePatientMedicalHistory()

  const [filters, setFilters] =
    useState<MedicalHistoryFilters>(
      DEFAULT_MEDICAL_HISTORY_FILTERS
    )

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
      medicalHistoryRecords.filter(
        (record) =>
          record.patientId === patient.id
      ),
    [medicalHistoryRecords, patient.id]
  )

  const filteredRecords = useMemo(() => {
    return patientRecords
      .filter((record) => {
        const matchesSearch =
          matchesMedicalHistorySearch(
            record,
            filters.search
          )

        const matchesClinicalStatus =
          filters.clinicalStatus === "all" ||
          record.clinicalStatus ===
            filters.clinicalStatus

        const matchesVerificationStatus =
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
          matchesClinicalStatus &&
          matchesVerificationStatus &&
          matchesRecordStatus
        )
      })
      .sort(
        (firstRecord, secondRecord) =>
          new Date(
            secondRecord.updatedAt
          ).getTime() -
          new Date(
            firstRecord.updatedAt
          ).getTime()
      )
  }, [patientRecords, filters])

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

  const activeConditionCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.clinicalStatus === "active"
    ).length

  const resolvedConditionCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.clinicalStatus === "resolved"
    ).length

  const archivedRecordCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "archived"
    ).length

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.clinicalStatus !== "all" ||
    filters.verificationStatus !== "all" ||
    filters.recordStatus !== "current"

  function updateFilter<
    Key extends keyof MedicalHistoryFilters,
  >(
    key: Key,
    value: MedicalHistoryFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters(DEFAULT_MEDICAL_HISTORY_FILTERS)
  }

  async function handleCreateRecord(
    values: MedicalHistoryFormValues
  ): Promise<void> {
    const newRecord =
      createMedicalHistoryRecord(
        patient.id,
        values
      )

    toast.success(
      "Medical condition added",
      {
        description: `${newRecord.conditionName} was added to the patient's structured history.`,
      }
    )
  }

  async function handleUpdateRecord(
    values: MedicalHistoryFormValues
  ): Promise<void> {
    if (!editingRecord) {
      throw new Error(
        "No medical-history record was selected."
      )
    }

    const updatedRecord =
      updateMedicalHistoryRecord(
        editingRecord.id,
        values
      )

    toast.success(
      "Medical condition updated",
      {
        description: `${updatedRecord.conditionName} was updated successfully.`,
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
        archiveMedicalHistoryRecord(
          archivingRecord.id,
          archiveReason
        )

      toast.success(
        "Medical-history record archived",
        {
          description: `${archivedRecord.conditionName} was moved to the archived records filter.`,
        }
      )

      setArchivingRecordId(null)
    } catch {
      toast.error(
        "Unable to archive record",
        {
          description:
            "The medical-history record could not be archived.",
        }
      )
    }
  }

  function editRecordFromDetails(
    record: MedicalHistoryRecord
  ) {
    setViewingRecordId(null)
    setEditingRecordId(record.id)
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                <ClipboardList
                  className="size-5"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Medical History
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Structured historical and active
                  condition records for this patient.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() =>
              setIsCreateDialogOpen(true)
            }
          >
            <FilePlus2 aria-hidden="true" />
            Add condition
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                <ClipboardList
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Current records
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {currentRecordCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
                <ShieldCheck
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Active conditions
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {activeConditionCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                <CheckCircle2
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Resolved conditions
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {resolvedConditionCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Archive
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Archived records
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {archivedRecordCount}
                </p>
              </div>
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
                  placeholder="Search condition, ICD-10, source, or notes"
                  aria-label="Search medical history"
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
                <label
                  htmlFor="medical-history-clinical-status"
                  className="sr-only"
                >
                  Filter by clinical status
                </label>

                <select
                  id="medical-history-clinical-status"
                  value={filters.clinicalStatus}
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isClinicalStatusFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "clinicalStatus",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All clinical statuses
                  </option>

                  {MEDICAL_CONDITION_CLINICAL_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          MEDICAL_CONDITION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <label
                  htmlFor="medical-history-verification-status"
                  className="sr-only"
                >
                  Filter by verification status
                </label>

                <select
                  id="medical-history-verification-status"
                  value={
                    filters.verificationStatus
                  }
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isVerificationStatusFilter(
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

                  {MEDICAL_HISTORY_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          MEDICAL_HISTORY_VERIFICATION_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <label
                  htmlFor="medical-history-record-status"
                  className="sr-only"
                >
                  Filter current or archived records
                </label>

                <select
                  id="medical-history-record-status"
                  value={filters.recordStatus}
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

                  {MEDICAL_HISTORY_RECORD_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          MEDICAL_HISTORY_RECORD_STATUS_LABELS[
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

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>
                Showing {filteredRecords.length} of{" "}
                {patientRecords.length} condition records
              </p>

              <p>
                Default view shows current records only.
              </p>
            </div>
          </div>

          {patientRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="rounded-2xl bg-teal-50 p-4 text-teal-700">
                <ClipboardList
                  className="size-7"
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No medical history recorded
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No structured condition records have
                been added for this patient.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching condition records
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Change the search or filter values.
              </p>

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
            <Table className="min-w-[1180px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Condition</TableHead>
                  <TableHead>Clinical status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Onset / Resolution</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Record status</TableHead>
                  <TableHead>Last updated</TableHead>
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
                          {record.conditionName}
                        </p>

                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {record.icd10Code ??
                            "No ICD-10 code"}
                        </p>

                        {record.notes ? (
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {record.notes}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <MedicalConditionStatusBadge
                        status={
                          record.clinicalStatus
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <MedicalHistoryVerificationBadge
                        status={
                          record.verificationStatus
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <div>
                        <p>
                          {formatPatientDate(
                            record.onsetDate,
                            "Onset unknown"
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatPatientDate(
                            record.resolutionDate,
                            "Not resolved"
                          )}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-52 whitespace-normal">
                        <p>
                          {
                            MEDICAL_HISTORY_SOURCE_LABELS[
                              record.source
                            ]
                          }
                        </p>

                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {record.sourceDetails ??
                            "No source details"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <MedicalHistoryRecordStatusBadge
                        status={record.recordStatus}
                      />
                    </TableCell>

                    <TableCell>
                      <div>
                        <p>
                          {formatPatientDateTime(
                            record.updatedAt
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {record.updatedBy}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Open actions for ${record.conditionName}`}
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
                              Record actions
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() =>
                                setViewingRecordId(
                                  record.id
                                )
                              }
                            >
                              <Eye aria-hidden="true" />
                              View record
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
                              <Pencil
                                aria-hidden="true"
                              />
                              {record.recordStatus ===
                              "archived"
                                ? "Archived record"
                                : "Edit record"}
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
                            <Archive
                              aria-hidden="true"
                            />
                            {record.recordStatus ===
                            "archived"
                              ? "Already archived"
                              : "Archive record"}
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

        <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            Medical-history entries are structured
            reference records. They do not replace
            consultations, SOAP notes, orders,
            prescriptions, or digitally signed diagnoses.
          </p>
        </div>
      </section>

      <MedicalHistoryFormDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmitRecord={handleCreateRecord}
      />

      <MedicalHistoryFormDialog
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

      <MedicalHistoryRecordDetailsSheet
        record={viewingRecord}
        open={Boolean(viewingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
        onEditRecord={editRecordFromDetails}
      />

      <MedicalHistoryArchiveDialog
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
