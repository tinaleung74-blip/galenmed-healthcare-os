"use client"

import type { ReactNode } from "react"
import {
  Archive,
  CalendarDays,
  Pencil,
  Pill,
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
  PrescriptionAllergyReviewBadge,
  PrescriptionRecordStatusBadge,
  PrescriptionStatusBadge,
} from "@/features/consultations/components/consultation-prescription-status-badges"
import type { ConsultationPrescriptionRecord } from "@/features/consultations/types/consultation-prescription.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"
import {
  formatPrescriptionDose,
  formatPrescriptionDuration,
  formatPrescriptionFrequency,
  formatPrescriptionPeriod,
  formatPrescriptionQuantity,
  formatPrescriptionRoute,
} from "@/features/consultations/utils/consultation-prescription.utils"

interface ConsultationPrescriptionDetailsSheetProps {
  record:
    | ConsultationPrescriptionRecord
    | null
  open: boolean
  canEdit: boolean
  onOpenChange: (open: boolean) => void
  onEditRecord: (
    record:
      ConsultationPrescriptionRecord
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

export function ConsultationPrescriptionDetailsSheet({
  record,
  open,
  canEdit,
  onOpenChange,
  onEditRecord,
}: ConsultationPrescriptionDetailsSheetProps) {
  if (!record) {
    return null
  }

  const isArchived =
    record.recordStatus === "archived"

  const editIsAllowed =
    canEdit &&
    !isArchived &&
    record.status === "draft"

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
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <Pill
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {record.medicationName}
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {record.prescriptionNumber}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <PrescriptionStatusBadge
                  status={record.status}
                />

                <PrescriptionAllergyReviewBadge
                  status={
                    record.allergyReviewStatus
                  }
                />

                <PrescriptionRecordStatusBadge
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
            <h3 className="text-sm font-semibold">
              Medication order
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Medication"
                value={record.medicationName}
              />

              <DetailItem
                label="Strength"
                value={
                  record.strength ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Dose"
                value={formatPrescriptionDose(
                  record
                )}
              />

              <DetailItem
                label="Route"
                value={formatPrescriptionRoute(
                  record
                )}
              />

              <DetailItem
                label="Frequency"
                className="sm:col-span-2"
                value={formatPrescriptionFrequency(
                  record
                )}
              />

              <DetailItem
                label="Duration"
                value={formatPrescriptionDuration(
                  record
                )}
              />

              <DetailItem
                label="Period"
                value={formatPrescriptionPeriod(
                  record
                )}
              />

              <DetailItem
                label="Quantity"
                value={formatPrescriptionQuantity(
                  record
                )}
              />

              <DetailItem
                label="Refills"
                value={String(
                  record.refillsAllowed
                )}
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Clinical instructions
            </h3>

            <dl className="space-y-4 rounded-xl border p-4">
              <DetailItem
                label="Indication"
                value={record.indication}
              />

              <DetailItem
                label="Patient instructions"
                value={
                  <p className="whitespace-pre-wrap">
                    {
                      record.patientInstructions
                    }
                  </p>
                }
              />

              <DetailItem
                label="Prescriber notes"
                value={
                  record.prescriberNotes ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Substitution"
                value={
                  record.substitutionAllowed
                    ? "Allowed"
                    : "Not allowed"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Allergy review
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Review status"
                value={
                  <PrescriptionAllergyReviewBadge
                    status={
                      record.allergyReviewStatus
                    }
                  />
                }
              />

              <DetailItem
                label="Warning note"
                value={
                  record.allergyWarningNote ??
                  "No warning note recorded"
                }
              />
            </dl>
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
                label="Prescribed by"
                value={record.prescribedBy}
              />

              <DetailItem
                label="Prescribed at"
                value={formatPatientDateTime(
                  record.prescribedAt
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
                  Archived draft
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
              This record belongs to the current
              consultation. Pharmacy dispensing,
              inventory allocation, and medication
              administration are separate workflows.
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
              ? "Archived draft"
              : record.status !== "draft"
                ? "Read-only prescription"
                : canEdit
                  ? "Edit draft"
                  : "Read-only draft"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
