"use client"

import type { ReactNode } from "react"
import {
  Archive,
  CalendarDays,
  FileCode2,
  HeartPulse,
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
  DiagnosisRecordStatusBadge,
  DiagnosisRoleBadge,
  DiagnosisVerificationBadge,
} from "@/features/consultations/components/consultation-diagnosis-status-badges"
import type { ConsultationDiagnosisRecord } from "@/features/consultations/types/consultation-diagnosis.types"
import {
  formatPatientDate,
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface ConsultationDiagnosisDetailsSheetProps {
  record:
    | ConsultationDiagnosisRecord
    | null

  open: boolean

  canEdit: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onEditRecord: (
    record:
      ConsultationDiagnosisRecord
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

export function ConsultationDiagnosisDetailsSheet({
  record,
  open,
  canEdit,
  onOpenChange,
  onEditRecord,
}: ConsultationDiagnosisDetailsSheetProps) {
  if (!record) {
    return null
  }

  const isArchived =
    record.recordStatus === "archived"

  const editIsAllowed =
    canEdit && !isArchived

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
            <div className="rounded-xl bg-rose-50 p-3 text-rose-700">
              <HeartPulse
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {record.diagnosisName}
              </SheetTitle>

              <SheetDescription className="mt-1">
                Structured consultation
                diagnosis
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <DiagnosisRoleBadge
                  role={record.role}
                />

                <DiagnosisVerificationBadge
                  status={
                    record.verificationStatus
                  }
                />

                <DiagnosisRecordStatusBadge
                  status={
                    record.recordStatus
                  }
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileCode2
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Diagnosis information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Diagnosis"
                value={
                  record.diagnosisName
                }
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
                label="Code system"
                value={record.codeSystem}
              />

              <DetailItem
                label="Onset date"
                value={formatPatientDate(
                  record.onsetDate,
                  "Not recorded"
                )}
              />

              <DetailItem
                label="Role"
                value={
                  <DiagnosisRoleBadge
                    role={record.role}
                  />
                }
              />

              <DetailItem
                label="Verification"
                value={
                  <DiagnosisVerificationBadge
                    status={
                      record.verificationStatus
                    }
                  />
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
                {record.clinicalNotes ??
                  "No diagnostic notes were recorded."}
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
                Audit information
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
                  Archived diagnosis
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
              This diagnosis belongs to the
              current consultation encounter.
              Longitudinal Medical History remains
              a separate patient module.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t bg-slate-50 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>

          <Button
            type="button"
            disabled={!editIsAllowed}
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() =>
              onEditRecord(record)
            }
          >
            <Pencil aria-hidden="true" />

            {isArchived
              ? "Archived diagnosis"
              : canEdit
                ? "Edit diagnosis"
                : "Read-only diagnosis"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
