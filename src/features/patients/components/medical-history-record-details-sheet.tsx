"use client"

import type { ReactNode } from "react"
import {
  Archive,
  CalendarDays,
  ClipboardList,
  FileText,
  Pencil,
  ShieldCheck,
  UserRound,
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
  MedicalConditionStatusBadge,
  MedicalHistoryRecordStatusBadge,
  MedicalHistoryVerificationBadge,
} from "@/features/patients/components/medical-history-status-badges"
import {
  MEDICAL_HISTORY_SOURCE_LABELS,
} from "@/features/patients/constants/medical-history.constants"
import type { MedicalHistoryRecord } from "@/features/patients/types/medical-history.types"
import {
  formatPatientDate,
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface MedicalHistoryRecordDetailsSheetProps {
  record: MedicalHistoryRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditRecord: (record: MedicalHistoryRecord) => void
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

export function MedicalHistoryRecordDetailsSheet({
  record,
  open,
  onOpenChange,
  onEditRecord,
}: MedicalHistoryRecordDetailsSheetProps) {
  if (!record) {
    return null
  }

  const isArchived =
    record.recordStatus === "archived"

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <ClipboardList
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {record.conditionName}
              </SheetTitle>

              <SheetDescription className="mt-1">
                Structured patient medical-history record
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <MedicalConditionStatusBadge
                  status={record.clinicalStatus}
                />

                <MedicalHistoryVerificationBadge
                  status={record.verificationStatus}
                />

                <MedicalHistoryRecordStatusBadge
                  status={record.recordStatus}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Condition information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Condition"
                value={record.conditionName}
              />

              <DetailItem
                label="ICD-10 code"
                value={
                  record.icd10Code ? (
                    <span className="font-mono text-xs">
                      {record.icd10Code}
                    </span>
                  ) : (
                    "Not recorded"
                  )
                }
              />

              <DetailItem
                label="Clinical status"
                value={
                  <MedicalConditionStatusBadge
                    status={record.clinicalStatus}
                  />
                }
              />

              <DetailItem
                label="Verification"
                value={
                  <MedicalHistoryVerificationBadge
                    status={record.verificationStatus}
                  />
                }
              />

              <DetailItem
                label="Onset date"
                value={formatPatientDate(
                  record.onsetDate,
                  "Not recorded"
                )}
              />

              <DetailItem
                label="Resolution date"
                value={formatPatientDate(
                  record.resolutionDate,
                  "Not resolved"
                )}
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Information source
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Source"
                value={
                  MEDICAL_HISTORY_SOURCE_LABELS[
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
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Clinical notes
            </h3>

            <div className="rounded-xl border p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {record.notes ??
                  "No additional clinical-history notes were recorded."}
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
                label="Recorded by"
                value={record.recordedBy}
              />

              <DetailItem
                label="Recorded at"
                value={formatPatientDateTime(
                  record.recordedAt
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

          <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This record is separate from consultation
              SOAP notes and signed diagnoses. Production
              access will later require clinical permissions
              and audit logging.
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
              : "Edit record"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
