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
  Pill,
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
import { ConsultationPrescriptionAllergyPanel } from "@/features/consultations/components/consultation-prescription-allergy-panel"
import { ConsultationPrescriptionArchiveDialog } from "@/features/consultations/components/consultation-prescription-archive-dialog"
import { ConsultationPrescriptionDetailsSheet } from "@/features/consultations/components/consultation-prescription-details-sheet"
import { ConsultationPrescriptionFormDialog } from "@/features/consultations/components/consultation-prescription-form-dialog"
import {
  PrescriptionAllergyReviewBadge,
  PrescriptionRecordStatusBadge,
  PrescriptionStatusBadge,
} from "@/features/consultations/components/consultation-prescription-status-badges"
import {
  CONSULTATION_ALLERGY_REVIEW_STATUS_LABELS,
  CONSULTATION_PRESCRIPTION_RECORD_STATUS_LABELS,
  CONSULTATION_PRESCRIPTION_STATUS_LABELS,
} from "@/features/consultations/constants/consultation-prescription.constants"
import { useConsultationPrescriptions } from "@/features/consultations/providers/consultation-prescription-provider"
import type { ConsultationPrescriptionFormValues } from "@/features/consultations/schemas/consultation-prescription.schema"
import {
  CONSULTATION_ALLERGY_REVIEW_STATUSES,
  CONSULTATION_PRESCRIPTION_RECORD_STATUSES,
  CONSULTATION_PRESCRIPTION_STATUSES,
  type ConsultationAllergyReviewStatus,
  type ConsultationPrescriptionRecord,
  type ConsultationPrescriptionRecordStatus,
  type ConsultationPrescriptionStatus,
} from "@/features/consultations/types/consultation-prescription.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import {
  formatPrescriptionDose,
  formatPrescriptionDuration,
  formatPrescriptionFrequency,
  formatPrescriptionQuantity,
  formatPrescriptionRoute,
} from "@/features/consultations/utils/consultation-prescription.utils"

interface ConsultationPrescriptionWorkspaceProps {
  consultation: ConsultationEncounter
}

interface PrescriptionFilters {
  search: string
  status:
    | ConsultationPrescriptionStatus
    | "all"
  allergyReviewStatus:
    | ConsultationAllergyReviewStatus
    | "all"
  recordStatus:
    | ConsultationPrescriptionRecordStatus
    | "all"
}

const DEFAULT_PRESCRIPTION_FILTERS:
  PrescriptionFilters = {
  search: "",
  status: "all",
  allergyReviewStatus: "all",
  recordStatus: "current",
}

const statusOrder: Record<
  ConsultationPrescriptionStatus,
  number
> = {
  draft: 0,
  active: 1,
  discontinued: 2,
  cancelled: 3,
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function isStatusFilter(
  value: string
): value is
  | ConsultationPrescriptionStatus
  | "all" {
  return (
    value === "all" ||
    CONSULTATION_PRESCRIPTION_STATUSES.some(
      (status) => status === value
    )
  )
}

function isAllergyReviewFilter(
  value: string
): value is
  | ConsultationAllergyReviewStatus
  | "all" {
  return (
    value === "all" ||
    CONSULTATION_ALLERGY_REVIEW_STATUSES.some(
      (status) => status === value
    )
  )
}

function isRecordStatusFilter(
  value: string
): value is
  | ConsultationPrescriptionRecordStatus
  | "all" {
  return (
    value === "all" ||
    CONSULTATION_PRESCRIPTION_RECORD_STATUSES.some(
      (status) => status === value
    )
  )
}

function matchesPrescriptionSearch(
  record:
    ConsultationPrescriptionRecord,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableRecord =
    normalizePatientSearch(
      record.prescriptionNumber,
      record.medicationName,
      record.strength,
      record.indication,
      record.patientInstructions,
      record.prescriberNotes,
      record.allergyWarningNote,
      record.prescribedBy,
      record.updatedBy
    )

  return searchableRecord.includes(
    normalizedSearch
  )
}

export function ConsultationPrescriptionWorkspace({
  consultation,
}: ConsultationPrescriptionWorkspaceProps) {
  const {
    prescriptionRecords,
    createPrescriptionRecord,
    updatePrescriptionRecord,
    archivePrescriptionRecord,
  } = useConsultationPrescriptions()

  const [filters, setFilters] =
    useState<PrescriptionFilters>(() => ({
      ...DEFAULT_PRESCRIPTION_FILTERS,
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
      prescriptionRecords
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
            statusOrder[
              firstRecord.status
            ] -
              statusOrder[
                secondRecord.status
              ] ||
            new Date(
              secondRecord.updatedAt
            ).getTime() -
              new Date(
                firstRecord.updatedAt
              ).getTime()
        ),
    [
      prescriptionRecords,
      consultation.id,
    ]
  )

  const filteredRecords = useMemo(
    () =>
      consultationRecords.filter(
        (record) => {
          const matchesSearch =
            matchesPrescriptionSearch(
              record,
              filters.search
            )

          const matchesStatus =
            filters.status === "all" ||
            record.status === filters.status

          const matchesAllergyReview =
            filters.allergyReviewStatus ===
              "all" ||
            record.allergyReviewStatus ===
              filters.allergyReviewStatus

          const matchesRecordStatus =
            filters.recordStatus === "all" ||
            record.recordStatus ===
              filters.recordStatus

          return (
            matchesSearch &&
            matchesStatus &&
            matchesAllergyReview &&
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

  const draftCount =
    currentRecords.filter(
      (record) =>
        record.status === "draft"
    ).length

  const activeCount =
    currentRecords.filter(
      (record) =>
        record.status === "active"
    ).length

  const allergyWarningCount =
    currentRecords.filter(
      (record) =>
        record.allergyReviewStatus ===
        "reviewed-with-warning"
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
    filters.status !== "all" ||
    filters.allergyReviewStatus !== "all" ||
    filters.recordStatus !== "current"

  function updateFilter<
    Key extends keyof PrescriptionFilters,
  >(
    key: Key,
    value: PrescriptionFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_PRESCRIPTION_FILTERS,
    })
  }

  async function handleCreateRecord(
    values:
      ConsultationPrescriptionFormValues
  ): Promise<void> {
    const newRecord =
      createPrescriptionRecord(
        consultation.id,
        values
      )

    toast.success(
      "Prescription draft added",
      {
        description: `${newRecord.medicationName} was added to the consultation.`,
      }
    )
  }

  async function handleUpdateRecord(
    values:
      ConsultationPrescriptionFormValues
  ): Promise<void> {
    if (!editingRecord) {
      throw new Error(
        "No prescription draft was selected."
      )
    }

    const updatedRecord =
      updatePrescriptionRecord(
        editingRecord.id,
        values
      )

    toast.success(
      "Prescription draft updated",
      {
        description: `${updatedRecord.medicationName} was updated successfully.`,
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
        archivePrescriptionRecord(
          archivingRecord.id,
          archiveReason
        )

      toast.success(
        "Prescription draft archived",
        {
          description: `${archivedRecord.medicationName} remains available for clinical audit.`,
        }
      )

      setArchivingRecordId(null)
    } catch (error) {
      toast.error(
        "Unable to archive draft",
        {
          description:
            error instanceof Error
              ? error.message
              : "The prescription draft could not be archived.",
        }
      )
    }
  }

  function editRecordFromDetails(
    record:
      ConsultationPrescriptionRecord
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
              <Pill
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h2 className="text-lg font-semibold">
                Prescriptions
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Structured medication-order drafts,
              instructions, and allergy review.
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
            Add prescription
          </Button>
        </div>

        <ConsultationPrescriptionAllergyPanel
          patientId={consultation.patientId}
          compact
        />

        {!canEdit ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            This completed encounter is read-only.
            Prescription records cannot be changed
            without a future authorized amendment
            workflow.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Current prescriptions
              </p>

              <p className="mt-1 text-xl font-semibold">
                {currentRecords.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-amber-700">
                Draft orders
              </p>

              <p className="mt-1 text-xl font-semibold text-amber-800">
                {draftCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Active orders
              </p>

              <p className="mt-1 text-xl font-semibold">
                {activeCount}
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              allergyWarningCount > 0
                ? "border-rose-200 bg-rose-50/40 shadow-none"
                : "shadow-none"
            }
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Allergy warnings / Archived
              </p>

              <p className="mt-1 text-xl font-semibold">
                {allergyWarningCount}
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
                  placeholder="Search medication, prescription, indication, or notes"
                  aria-label="Search prescriptions"
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
                  value={filters.status}
                  aria-label="Filter prescription status"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isStatusFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "status",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All prescription statuses
                  </option>

                  {CONSULTATION_PRESCRIPTION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          CONSULTATION_PRESCRIPTION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filters.allergyReviewStatus
                  }
                  aria-label="Filter allergy review status"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isAllergyReviewFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "allergyReviewStatus",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All allergy-review statuses
                  </option>

                  {CONSULTATION_ALLERGY_REVIEW_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          CONSULTATION_ALLERGY_REVIEW_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.recordStatus}
                  aria-label="Filter current or archived prescriptions"
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

                  {CONSULTATION_PRESCRIPTION_RECORD_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          CONSULTATION_PRESCRIPTION_RECORD_STATUS_LABELS[
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
              {consultationRecords.length} prescription
              records
            </p>
          </div>

          {consultationRecords.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Pill
                className="size-8 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No prescriptions recorded
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No structured medication-order records
                have been added to this consultation.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching prescriptions
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
            <Table className="min-w-[1400px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dose / Route</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Duration / Quantity</TableHead>
                  <TableHead>Allergy review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prescribed</TableHead>
                  <TableHead>Record status</TableHead>
                  <TableHead>
                    <span className="sr-only">
                      Prescription actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map((record) => {
                  const canModifyRecord =
                    canEdit &&
                    record.status === "draft" &&
                    record.recordStatus === "current"

                  return (
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
                            {record.medicationName}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {record.strength ??
                              "Strength not recorded"}
                          </p>

                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {
                              record.prescriptionNumber
                            }
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium">
                          {formatPrescriptionDose(
                            record
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatPrescriptionRoute(
                            record
                          )}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="max-w-64 whitespace-normal">
                          {formatPrescriptionFrequency(
                            record
                          )}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p>
                          {formatPrescriptionDuration(
                            record
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatPrescriptionQuantity(
                            record
                          )}
                        </p>
                      </TableCell>

                      <TableCell>
                        <PrescriptionAllergyReviewBadge
                          status={
                            record.allergyReviewStatus
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <PrescriptionStatusBadge
                          status={record.status}
                        />
                      </TableCell>

                      <TableCell>
                        <p>
                          {formatPatientDateTime(
                            record.prescribedAt
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {record.prescribedBy}
                        </p>
                      </TableCell>

                      <TableCell>
                        <PrescriptionRecordStatusBadge
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
                                aria-label={`Open actions for ${record.medicationName}`}
                              >
                                <MoreHorizontal
                                  aria-hidden="true"
                                />
                              </Button>
                            }
                          />

                          <DropdownMenuContent
                            align="end"
                            className="w-52"
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                Prescription actions
                              </DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() =>
                                  setViewingRecordId(
                                    record.id
                                  )
                                }
                              >
                                <Eye aria-hidden="true" />
                                View prescription
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={
                                  !canModifyRecord
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
                                  ? "Archived draft"
                                  : record.status !==
                                      "draft"
                                    ? "Read-only prescription"
                                    : canEdit
                                      ? "Edit draft"
                                      : "Read-only draft"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              variant="destructive"
                              disabled={
                                !canModifyRecord
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
                                : record.status !==
                                    "draft"
                                  ? "Cannot archive active order"
                                  : "Archive draft"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
            Prescription drafts are not digitally
            signed, electronically transmitted,
            dispensed, or connected to inventory.
          </p>
        </div>
      </section>

      <ConsultationPrescriptionFormDialog
        mode="create"
        patientId={consultation.patientId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmitRecord={handleCreateRecord}
      />

      <ConsultationPrescriptionFormDialog
        mode="edit"
        patientId={consultation.patientId}
        record={editingRecord}
        open={Boolean(editingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingRecordId(null)
          }
        }}
        onSubmitRecord={handleUpdateRecord}
      />

      <ConsultationPrescriptionDetailsSheet
        record={viewingRecord}
        open={Boolean(viewingRecord)}
        canEdit={canEdit}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
        onEditRecord={editRecordFromDetails}
      />

      <ConsultationPrescriptionArchiveDialog
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
