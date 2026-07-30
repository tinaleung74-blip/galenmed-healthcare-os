"use client"

import type { ReactNode } from "react"
import {
  Archive,
  CalendarDays,
  FileText,
  LockKeyhole,
  Pencil,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DocumentConfidentialityBadge,
  DocumentRecordStatusBadge,
  DocumentStatusBadge,
  DocumentVerificationBadge,
} from "@/features/patients/components/patient-document-status-badges"
import {
  PATIENT_DOCUMENT_CATEGORY_LABELS,
  PATIENT_DOCUMENT_SOURCE_LABELS,
} from "@/features/patients/constants/patient-document.constants"
import type { PatientDocumentRecord } from "@/features/patients/types/patient-document.types"
import {
  formatPatientDate,
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"
import {
  formatDocumentFileSize,
  maskPatientDocumentFileName,
} from "@/features/patients/utils/patient-document.utils"

interface PatientDocumentDetailsSheetProps {
  record: PatientDocumentRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditRecord: (
    record: PatientDocumentRecord
  ) => void
}

interface DetailItemProps {
  label: string
  value: ReactNode
  className?: string
}

function DetailItem({
  label,
  value,
  className,
}: DetailItemProps) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 text-sm text-foreground">
        {value}
      </dd>
    </div>
  )
}

export function PatientDocumentDetailsSheet({
  record,
  open,
  onOpenChange,
  onEditRecord,
}: PatientDocumentDetailsSheetProps) {
  if (!record) {
    return null
  }

  const isArchived =
    record.recordStatus === "archived"

  const displayedFileName =
    maskPatientDocumentFileName(
      record.fileName,
      record.category,
      record.confidentialityLevel
    )

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
              <FileText
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {record.title}
              </SheetTitle>

              <SheetDescription className="mt-1">
                {
                  PATIENT_DOCUMENT_CATEGORY_LABELS[
                    record.category
                  ]
                }
                {" · "}
                Version {record.versionNumber}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <DocumentStatusBadge
                  status={record.documentStatus}
                />

                <DocumentVerificationBadge
                  status={
                    record.verificationStatus
                  }
                />

                <DocumentConfidentialityBadge
                  level={
                    record.confidentialityLevel
                  }
                />

                <DocumentRecordStatusBadge
                  status={record.recordStatus}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Document information
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Title"
                value={record.title}
              />

              <DetailItem
                label="Category"
                value={
                  PATIENT_DOCUMENT_CATEGORY_LABELS[
                    record.category
                  ]
                }
              />

              <DetailItem
                label="Issued by"
                value={
                  record.issuedBy ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Issue date"
                value={formatPatientDate(
                  record.issueDate,
                  "Not recorded"
                )}
              />

              <DetailItem
                label="Expiration date"
                value={formatPatientDate(
                  record.expirationDate,
                  "No expiration recorded"
                )}
              />

              <DetailItem
                label="Version"
                value={`Version ${record.versionNumber}`}
              />

              <DetailItem
                label="Description"
                className="sm:col-span-2"
                value={
                  record.description ??
                  "No description recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <LockKeyhole
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Protected file metadata
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="File name"
                value={
                  <span className="font-mono text-xs">
                    {displayedFileName}
                  </span>
                }
              />

              <DetailItem
                label="File type"
                value={record.mimeType}
              />

              <DetailItem
                label="File extension"
                value={record.fileExtension.toUpperCase()}
              />

              <DetailItem
                label="File size"
                value={formatDocumentFileSize(
                  record.fileSizeBytes
                )}
              />

              <DetailItem
                label="Binary availability"
                className="sm:col-span-2"
                value={
                  record.binaryAvailable
                    ? "File available"
                    : "Metadata only — no file stored"
                }
              />
            </dl>

            <p className="text-xs text-muted-foreground">
              Sensitive file names are masked according to
              category and confidentiality level.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Source and verification
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Source"
                value={
                  PATIENT_DOCUMENT_SOURCE_LABELS[
                    record.source
                  ]
                }
              />

              <DetailItem
                label="Source details"
                value={
                  record.sourceDetails ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Related encounter"
                value={
                  record.relatedEncounterReference ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Verification reference"
                value={
                  record.verificationReference ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Verified by"
                value={
                  record.verifiedBy ??
                  "Not verified"
                }
              />

              <DetailItem
                label="Verified at"
                value={formatPatientDateTime(
                  record.verifiedAt,
                  "Not verified"
                )}
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Notes
            </h3>

            <div className="rounded-xl border p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {record.notes ??
                  "No document notes were recorded."}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Record audit information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Uploaded by"
                value={record.uploadedBy}
              />

              <DetailItem
                label="Uploaded at"
                value={formatPatientDateTime(
                  record.uploadedAt
                )}
              />

              <DetailItem
                label="Last updated by"
                value={record.updatedBy}
              />

              <DetailItem
                label="Last updated at"
                value={formatPatientDateTime(
                  record.updatedAt
                )}
              />
            </dl>
          </section>

          {isArchived ? (
            <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Archive
                  className="size-4"
                  aria-hidden="true"
                />

                <h3 className="text-sm font-semibold">
                  Archived record
                </h3>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Archived by"
                  value={
                    record.archivedBy ??
                    "Not recorded"
                  }
                />

                <DetailItem
                  label="Archived at"
                  value={formatPatientDateTime(
                    record.archivedAt
                  )}
                />

                <DetailItem
                  label="Archive reason"
                  className="sm:col-span-2"
                  value={
                    record.archiveReason ??
                    "Not recorded"
                  }
                />
              </dl>
            </section>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50 p-4 text-xs text-violet-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              No document binary is available in this UI
              phase. Download and preview actions are
              intentionally unavailable.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t bg-slate-50 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            disabled={isArchived}
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() => onEditRecord(record)}
          >
            <Pencil aria-hidden="true" />
            {isArchived
              ? "Archived record"
              : "Edit metadata"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
