"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  Archive,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
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
import { PatientAllergyArchiveDialog } from "@/features/patients/components/patient-allergy-archive-dialog"
import { PatientAllergyDetailsSheet } from "@/features/patients/components/patient-allergy-details-sheet"
import { PatientAllergyFormDialog } from "@/features/patients/components/patient-allergy-form-dialog"
import {
  AllergyClinicalStatusBadge,
  AllergyCriticalityBadge,
  AllergyRecordStatusBadge,
  AllergyVerificationBadge,
} from "@/features/patients/components/patient-allergy-status-badges"
import {
  ALLERGY_CATEGORY_LABELS,
  ALLERGY_CLINICAL_STATUS_LABELS,
  ALLERGY_CRITICALITY_LABELS,
  ALLERGY_INTOLERANCE_TYPE_LABELS,
  ALLERGY_RECORD_STATUS_LABELS,
  ALLERGY_VERIFICATION_STATUS_LABELS,
  DEFAULT_PATIENT_ALLERGY_FILTERS,
} from "@/features/patients/constants/patient-allergy.constants"
import { usePatientAllergies } from "@/features/patients/providers/patient-allergy-provider"
import type { PatientAllergyFormValues } from "@/features/patients/schemas/patient-allergy.schema"
import {
  ALLERGY_CATEGORIES,
  ALLERGY_CLINICAL_STATUSES,
  ALLERGY_RECORD_STATUSES,
  ALLERGY_VERIFICATION_STATUSES,
  type AllergyCategory,
  type AllergyClinicalStatus,
  type AllergyRecordStatus,
  type AllergyVerificationStatus,
  type PatientAllergyFilters,
  type PatientAllergyRecord,
} from "@/features/patients/types/patient-allergy.types"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  formatPatientDate,
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface PatientAllergyWorkspaceProps {
  patient: Patient
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function isCategoryFilter(
  value: string
): value is AllergyCategory | "all" {
  return (
    value === "all" ||
    ALLERGY_CATEGORIES.some(
      (category) => category === value
    )
  )
}

function isClinicalStatusFilter(
  value: string
): value is AllergyClinicalStatus | "all" {
  return (
    value === "all" ||
    ALLERGY_CLINICAL_STATUSES.some(
      (status) => status === value
    )
  )
}

function isVerificationFilter(
  value: string
): value is AllergyVerificationStatus | "all" {
  return (
    value === "all" ||
    ALLERGY_VERIFICATION_STATUSES.some(
      (status) => status === value
    )
  )
}

function isRecordStatusFilter(
  value: string
): value is AllergyRecordStatus | "all" {
  return (
    value === "all" ||
    ALLERGY_RECORD_STATUSES.some(
      (status) => status === value
    )
  )
}

function matchesAllergySearch(
  record: PatientAllergyRecord,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableRecord =
    normalizePatientSearch(
      record.allergenName,
      record.allergenCode,
      record.codeSystem,
      ALLERGY_INTOLERANCE_TYPE_LABELS[
        record.type
      ],
      ALLERGY_CATEGORY_LABELS[
        record.category
      ],
      ALLERGY_CLINICAL_STATUS_LABELS[
        record.clinicalStatus
      ],
      ALLERGY_VERIFICATION_STATUS_LABELS[
        record.verificationStatus
      ],
      ALLERGY_CRITICALITY_LABELS[
        record.criticality
      ],
      record.reactionManifestations.join(" "),
      record.exposureRoute,
      record.sourceDetails,
      record.notes,
      record.recordedBy,
      record.updatedBy
    )

  return searchableRecord.includes(
    normalizedSearch
  )
}

export function PatientAllergyWorkspace({
  patient,
}: PatientAllergyWorkspaceProps) {
  const {
    allergyRecords,
    createAllergyRecord,
    updateAllergyRecord,
    archiveAllergyRecord,
  } = usePatientAllergies()

  const [filters, setFilters] =
    useState<PatientAllergyFilters>(() => ({
      ...DEFAULT_PATIENT_ALLERGY_FILTERS,
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
      allergyRecords
        .filter(
          (record) =>
            record.patientId === patient.id
        )
        .sort(
          (firstRecord, secondRecord) =>
            new Date(
              secondRecord.updatedAt
            ).getTime() -
            new Date(
              firstRecord.updatedAt
            ).getTime()
        ),
    [allergyRecords, patient.id]
  )

  const filteredRecords = useMemo(
    () =>
      patientRecords.filter((record) => {
        const matchesSearch =
          matchesAllergySearch(
            record,
            filters.search
          )

        const matchesCategory =
          filters.category === "all" ||
          record.category === filters.category

        const matchesClinicalStatus =
          filters.clinicalStatus === "all" ||
          record.clinicalStatus ===
            filters.clinicalStatus

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
          matchesCategory &&
          matchesClinicalStatus &&
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

  const activeAllergyCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.clinicalStatus === "active"
    ).length

  const highCriticalityCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.clinicalStatus === "active" &&
        record.criticality === "high"
    ).length

  const archivedRecordCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "archived"
    ).length

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.category !== "all" ||
    filters.clinicalStatus !== "all" ||
    filters.verificationStatus !== "all" ||
    filters.recordStatus !== "current"

  function updateFilter<
    Key extends keyof PatientAllergyFilters,
  >(
    key: Key,
    value: PatientAllergyFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_PATIENT_ALLERGY_FILTERS,
    })
  }

  async function handleCreateRecord(
    values: PatientAllergyFormValues
  ): Promise<void> {
    const newRecord = createAllergyRecord(
      patient.id,
      values
    )

    toast.success("Allergy record added", {
      description: `${newRecord.allergenName} was added to the patient profile.`,
    })
  }

  async function handleUpdateRecord(
    values: PatientAllergyFormValues
  ): Promise<void> {
    if (!editingRecord) {
      throw new Error(
        "No allergy record was selected."
      )
    }

    const updatedRecord =
      updateAllergyRecord(
        editingRecord.id,
        values
      )

    toast.success("Allergy record updated", {
      description: `${updatedRecord.allergenName} was updated successfully.`,
    })
  }

  function handleConfirmArchive(
    archiveReason: string
  ) {
    if (!archivingRecord) {
      return
    }

    try {
      const archivedRecord =
        archiveAllergyRecord(
          archivingRecord.id,
          archiveReason
        )

      toast.success(
        "Allergy record archived",
        {
          description: `${archivedRecord.allergenName} remains available for audit reference.`,
        }
      )

      setArchivingRecordId(null)
    } catch {
      toast.error(
        "Unable to archive allergy",
        {
          description:
            "The allergy record could not be archived.",
        }
      )
    }
  }

  function editRecordFromDetails(
    record: PatientAllergyRecord
  ) {
    setViewingRecordId(null)
    setEditingRecordId(record.id)
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-700">
              <ShieldAlert
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Allergies &amp; Intolerances
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Structured allergy, intolerance, reaction,
                and verification records.
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
            Add allergy
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                Active allergies
              </p>
              <p className="mt-1 text-xl font-semibold">
                {activeAllergyCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-rose-50/50 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-rose-700">
                High criticality
              </p>
              <p className="mt-1 text-xl font-semibold text-rose-800">
                {highCriticalityCount}
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
                  placeholder="Search allergen, reaction, code, or notes"
                  aria-label="Search allergy records"
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
                  value={filters.category}
                  aria-label="Filter allergy category"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isCategoryFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "category",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All categories
                  </option>

                  {ALLERGY_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {
                          ALLERGY_CATEGORY_LABELS[
                            category
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.clinicalStatus}
                  aria-label="Filter allergy clinical status"
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

                  {ALLERGY_CLINICAL_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          ALLERGY_CLINICAL_STATUS_LABELS[
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
                  aria-label="Filter allergy verification status"
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

                  {ALLERGY_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          ALLERGY_VERIFICATION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.recordStatus}
                  aria-label="Filter current or archived allergy records"
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

                  {ALLERGY_RECORD_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          ALLERGY_RECORD_STATUS_LABELS[
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
              {patientRecords.length} allergy records
            </p>
          </div>

          {patientRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <ShieldCheck
                className="size-8 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No allergies recorded
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No structured allergy or intolerance
                records have been added for this patient.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching allergy records
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
            <Table className="min-w-[1320px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Allergen</TableHead>
                  <TableHead>Type / Category</TableHead>
                  <TableHead>Clinical status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Reaction</TableHead>
                  <TableHead>Dates</TableHead>
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
                          {record.allergenName}
                        </p>

                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {record.allergenCode ??
                            "No coded identifier"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p>
                        {
                          ALLERGY_INTOLERANCE_TYPE_LABELS[
                            record.type
                          ]
                        }
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          ALLERGY_CATEGORY_LABELS[
                            record.category
                          ]
                        }
                      </p>
                    </TableCell>

                    <TableCell>
                      <AllergyClinicalStatusBadge
                        status={
                          record.clinicalStatus
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <AllergyVerificationBadge
                        status={
                          record.verificationStatus
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <AllergyCriticalityBadge
                        criticality={
                          record.criticality
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <div className="max-w-64 whitespace-normal">
                        <p className="line-clamp-2 text-sm">
                          {record.reactionManifestations
                            .length > 0
                            ? record.reactionManifestations.join(
                                ", "
                              )
                            : "No reaction recorded"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p>
                        {formatPatientDate(
                          record.onsetDate,
                          "Onset unknown"
                        )}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Last:{" "}
                        {formatPatientDate(
                          record.lastOccurrenceDate,
                          "Not recorded"
                        )}
                      </p>
                    </TableCell>

                    <TableCell>
                      <AllergyRecordStatusBadge
                        status={record.recordStatus}
                      />

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatPatientDateTime(
                          record.updatedAt
                        )}
                      </p>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Open actions for ${record.allergenName}`}
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
                              <Pencil aria-hidden="true" />
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
                            <Archive aria-hidden="true" />
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
      </section>

      <PatientAllergyFormDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmitRecord={handleCreateRecord}
      />

      <PatientAllergyFormDialog
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

      <PatientAllergyDetailsSheet
        record={viewingRecord}
        open={Boolean(viewingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
        onEditRecord={editRecordFromDetails}
      />

      <PatientAllergyArchiveDialog
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
