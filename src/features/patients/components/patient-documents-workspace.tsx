"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  Archive,
  Eye,
  FilePlus2,
  FileText,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
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
import { PatientDocumentArchiveDialog } from "@/features/patients/components/patient-document-archive-dialog"
import { PatientDocumentDetailsSheet } from "@/features/patients/components/patient-document-details-sheet"
import { PatientDocumentFormDialog } from "@/features/patients/components/patient-document-form-dialog"
import {
  DocumentConfidentialityBadge,
  DocumentRecordStatusBadge,
  DocumentStatusBadge,
  DocumentVerificationBadge,
} from "@/features/patients/components/patient-document-status-badges"
import {
  DEFAULT_PATIENT_DOCUMENT_FILTERS,
  PATIENT_DOCUMENT_CATEGORY_LABELS,
  PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS,
  PATIENT_DOCUMENT_RECORD_STATUS_LABELS,
  PATIENT_DOCUMENT_STATUS_LABELS,
  PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-document.constants"
import { usePatientDocuments } from "@/features/patients/providers/patient-documents-provider"
import type { PatientDocumentFormValues } from "@/features/patients/schemas/patient-document.schema"
import {
  PATIENT_DOCUMENT_CATEGORIES,
  PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS,
  PATIENT_DOCUMENT_RECORD_STATUSES,
  PATIENT_DOCUMENT_STATUSES,
  PATIENT_DOCUMENT_VERIFICATION_STATUSES,
  type PatientDocumentCategory,
  type PatientDocumentConfidentialityLevel,
  type PatientDocumentFilters,
  type PatientDocumentRecord,
  type PatientDocumentRecordStatus,
  type PatientDocumentStatus,
  type PatientDocumentVerificationStatus,
} from "@/features/patients/types/patient-document.types"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  formatPatientDate,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import {
  formatDocumentFileSize,
  maskPatientDocumentFileName,
} from "@/features/patients/utils/patient-document.utils"

interface PatientDocumentsWorkspaceProps {
  patient: Patient
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function isCategoryFilter(
  value: string
): value is PatientDocumentCategory | "all" {
  return (
    value === "all" ||
    PATIENT_DOCUMENT_CATEGORIES.some(
      (category) => category === value
    )
  )
}

function isDocumentStatusFilter(
  value: string
): value is PatientDocumentStatus | "all" {
  return (
    value === "all" ||
    PATIENT_DOCUMENT_STATUSES.some(
      (status) => status === value
    )
  )
}

function isVerificationFilter(
  value: string
): value is
  | PatientDocumentVerificationStatus
  | "all" {
  return (
    value === "all" ||
    PATIENT_DOCUMENT_VERIFICATION_STATUSES.some(
      (status) => status === value
    )
  )
}

function isConfidentialityFilter(
  value: string
): value is
  | PatientDocumentConfidentialityLevel
  | "all" {
  return (
    value === "all" ||
    PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS.some(
      (level) => level === value
    )
  )
}

function isRecordStatusFilter(
  value: string
): value is
  | PatientDocumentRecordStatus
  | "all" {
  return (
    value === "all" ||
    PATIENT_DOCUMENT_RECORD_STATUSES.some(
      (status) => status === value
    )
  )
}

function matchesDocumentSearch(
  record: PatientDocumentRecord,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableRecord =
    normalizePatientSearch(
      record.title,
      record.description,
      record.fileName,
      record.mimeType,
      record.fileExtension,
      record.issuedBy,
      record.sourceDetails,
      record.relatedEncounterReference,
      record.verificationReference,
      record.notes,
      record.uploadedBy,
      record.updatedBy
    )

  return searchableRecord.includes(
    normalizedSearch
  )
}

export function PatientDocumentsWorkspace({
  patient,
}: PatientDocumentsWorkspaceProps) {
  const {
    documentRecords,
    createDocumentRecord,
    updateDocumentRecord,
    archiveDocumentRecord,
  } = usePatientDocuments()

  const [filters, setFilters] =
    useState<PatientDocumentFilters>(() => ({
      ...DEFAULT_PATIENT_DOCUMENT_FILTERS,
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
      documentRecords
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
    [documentRecords, patient.id]
  )

  const filteredRecords = useMemo(
    () =>
      patientRecords.filter((record) => {
        const matchesSearch =
          matchesDocumentSearch(
            record,
            filters.search
          )

        const matchesCategory =
          filters.category === "all" ||
          record.category === filters.category

        const matchesDocumentStatus =
          filters.documentStatus === "all" ||
          record.documentStatus ===
            filters.documentStatus

        const matchesVerification =
          filters.verificationStatus === "all" ||
          record.verificationStatus ===
            filters.verificationStatus

        const matchesConfidentiality =
          filters.confidentialityLevel ===
            "all" ||
          record.confidentialityLevel ===
            filters.confidentialityLevel

        const matchesRecordStatus =
          filters.recordStatus === "all" ||
          record.recordStatus ===
            filters.recordStatus

        return (
          matchesSearch &&
          matchesCategory &&
          matchesDocumentStatus &&
          matchesVerification &&
          matchesConfidentiality &&
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

  const verifiedDocumentCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.verificationStatus ===
          "verified"
    ).length

  const needsReviewCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.verificationStatus ===
          "needs-review"
    ).length

  const restrictedDocumentCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "current" &&
        record.confidentialityLevel !==
          "standard"
    ).length

  const archivedRecordCount =
    patientRecords.filter(
      (record) =>
        record.recordStatus === "archived"
    ).length

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.category !== "all" ||
    filters.documentStatus !== "all" ||
    filters.verificationStatus !== "all" ||
    filters.confidentialityLevel !== "all" ||
    filters.recordStatus !== "current"

  function updateFilter<
    Key extends keyof PatientDocumentFilters,
  >(
    key: Key,
    value: PatientDocumentFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_PATIENT_DOCUMENT_FILTERS,
    })
  }

  async function handleCreateRecord(
    values: PatientDocumentFormValues
  ): Promise<void> {
    const newRecord = createDocumentRecord(
      patient.id,
      values
    )

    toast.success(
      "Document metadata added",
      {
        description: `${newRecord.title} was added to the patient profile.`,
      }
    )
  }

  async function handleUpdateRecord(
    values: PatientDocumentFormValues
  ): Promise<void> {
    if (!editingRecord) {
      throw new Error(
        "No document record was selected."
      )
    }

    const updatedRecord =
      updateDocumentRecord(
        editingRecord.id,
        values
      )

    toast.success(
      "Document metadata updated",
      {
        description: `${updatedRecord.title} was updated successfully.`,
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
        archiveDocumentRecord(
          archivingRecord.id,
          archiveReason
        )

      toast.success(
        "Document record archived",
        {
          description: `${archivedRecord.title} remains available for audit reference.`,
        }
      )

      setArchivingRecordId(null)
    } catch {
      toast.error(
        "Unable to archive document",
        {
          description:
            "The patient-document record could not be archived.",
        }
      )
    }
  }

  function editRecordFromDetails(
    record: PatientDocumentRecord
  ) {
    setViewingRecordId(null)
    setEditingRecordId(record.id)
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
              <FileText
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Patient Documents
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Classified document metadata,
                verification, confidentiality, and audit
                records.
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
            <FilePlus2 aria-hidden="true" />
            Add document metadata
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
                Verified
              </p>
              <p className="mt-1 text-xl font-semibold">
                {verifiedDocumentCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-amber-700">
                Needs review
              </p>
              <p className="mt-1 text-xl font-semibold text-amber-800">
                {needsReviewCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/50 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-violet-700">
                Restricted
              </p>
              <p className="mt-1 text-xl font-semibold text-violet-800">
                {restrictedDocumentCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Archived
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
                  placeholder="Search title, file, issuer, encounter, or notes"
                  aria-label="Search patient documents"
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
                  aria-label="Filter document category"
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

                  {PATIENT_DOCUMENT_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {
                          PATIENT_DOCUMENT_CATEGORY_LABELS[
                            category
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.documentStatus}
                  aria-label="Filter document status"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isDocumentStatusFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "documentStatus",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All document statuses
                  </option>

                  {PATIENT_DOCUMENT_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          PATIENT_DOCUMENT_STATUS_LABELS[
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
                  aria-label="Filter document verification"
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

                  {PATIENT_DOCUMENT_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filters.confidentialityLevel
                  }
                  aria-label="Filter confidentiality level"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isConfidentialityFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "confidentialityLevel",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All confidentiality levels
                  </option>

                  {PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS.map(
                    (level) => (
                      <option
                        key={level}
                        value={level}
                      >
                        {
                          PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS[
                            level
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.recordStatus}
                  aria-label="Filter current or archived documents"
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

                  {PATIENT_DOCUMENT_RECORD_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          PATIENT_DOCUMENT_RECORD_STATUS_LABELS[
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
              {patientRecords.length} document records
            </p>
          </div>

          {patientRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <FileText
                className="size-8 text-violet-700"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No patient documents recorded
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No structured document metadata has been
                added for this patient.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching document records
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
            <Table className="min-w-[1480px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Confidentiality</TableHead>
                  <TableHead>File metadata</TableHead>
                  <TableHead>Issue / Expiration</TableHead>
                  <TableHead>Record status</TableHead>
                  <TableHead>
                    <span className="sr-only">
                      Document actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map((record) => {
                  const displayedFileName =
                    maskPatientDocumentFileName(
                      record.fileName,
                      record.category,
                      record.confidentialityLevel
                    )

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
                            {record.title}
                          </p>

                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {record.description ??
                              "No description"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {
                          PATIENT_DOCUMENT_CATEGORY_LABELS[
                            record.category
                          ]
                        }
                      </TableCell>

                      <TableCell>
                        <DocumentStatusBadge
                          status={
                            record.documentStatus
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <DocumentVerificationBadge
                          status={
                            record.verificationStatus
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <DocumentConfidentialityBadge
                          level={
                            record.confidentialityLevel
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <div className="max-w-52">
                          <p className="truncate font-mono text-xs">
                            {displayedFileName}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {record.mimeType}
                            {" · "}
                            {formatDocumentFileSize(
                              record.fileSizeBytes
                            )}
                          </p>

                          {!record.binaryAvailable ? (
                            <p className="mt-1 text-xs text-amber-700">
                              Metadata only
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <p>
                          {formatPatientDate(
                            record.issueDate,
                            "No issue date"
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Expires:{" "}
                          {formatPatientDate(
                            record.expirationDate,
                            "Not recorded"
                          )}
                        </p>
                      </TableCell>

                      <TableCell>
                        <DocumentRecordStatusBadge
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
                                aria-label={`Open actions for ${record.title}`}
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
                                Document actions
                              </DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() =>
                                  setViewingRecordId(
                                    record.id
                                  )
                                }
                              >
                                <Eye aria-hidden="true" />
                                View metadata
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
                                  : "Edit metadata"}
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
                                : "Archive document"}
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

        <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50 p-4 text-xs text-violet-800">
          <LockKeyhole
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            This development module stores metadata only.
            No document binary, preview, download, or
            external storage action is available.
          </p>
        </div>
      </section>

      <PatientDocumentFormDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmitRecord={handleCreateRecord}
      />

      <PatientDocumentFormDialog
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

      <PatientDocumentDetailsSheet
        record={viewingRecord}
        open={Boolean(viewingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
        onEditRecord={editRecordFromDetails}
      />

      <PatientDocumentArchiveDialog
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
