"use client"

import type { ReactNode } from "react"
import {
  Archive,
  CalendarDays,
  FileCode2,
  Pencil,
  ShieldAlert,
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
  AllergyClinicalStatusBadge,
  AllergyCriticalityBadge,
  AllergyRecordStatusBadge,
  AllergyVerificationBadge,
} from "@/features/patients/components/patient-allergy-status-badges"
import {
  ALLERGY_CATEGORY_LABELS,
  ALLERGY_INFORMATION_SOURCE_LABELS,
  ALLERGY_INTOLERANCE_TYPE_LABELS,
  ALLERGY_REACTION_SEVERITY_LABELS,
} from "@/features/patients/constants/patient-allergy.constants"
import type { PatientAllergyRecord } from "@/features/patients/types/patient-allergy.types"
import {
  formatPatientDate,
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface PatientAllergyDetailsSheetProps {
  record: PatientAllergyRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditRecord: (
    record: PatientAllergyRecord
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

export function PatientAllergyDetailsSheet({
  record,
  open,
  onOpenChange,
  onEditRecord,
}: PatientAllergyDetailsSheetProps) {
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
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-xl bg-rose-50 p-3 text-rose-700">
              <ShieldAlert
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {record.allergenName}
              </SheetTitle>

              <SheetDescription className="mt-1">
                {
                  ALLERGY_INTOLERANCE_TYPE_LABELS[
                    record.type
                  ]
                }
                {" · "}
                {
                  ALLERGY_CATEGORY_LABELS[
                    record.category
                  ]
                }
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <AllergyClinicalStatusBadge
                  status={record.clinicalStatus}
                />

                <AllergyVerificationBadge
                  status={record.verificationStatus}
                />

                <AllergyCriticalityBadge
                  criticality={record.criticality}
                />

                <AllergyRecordStatusBadge
                  status={record.recordStatus}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className="size-4 text-rose-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Allergy classification
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Allergen"
                value={record.allergenName}
              />

              <DetailItem
                label="Record type"
                value={
                  ALLERGY_INTOLERANCE_TYPE_LABELS[
                    record.type
                  ]
                }
              />

              <DetailItem
                label="Category"
                value={
                  ALLERGY_CATEGORY_LABELS[
                    record.category
                  ]
                }
              />

              <DetailItem
                label="Criticality"
                value={
                  <AllergyCriticalityBadge
                    criticality={record.criticality}
                  />
                }
              />

              <DetailItem
                label="Clinical status"
                value={
                  <AllergyClinicalStatusBadge
                    status={record.clinicalStatus}
                  />
                }
              />

              <DetailItem
                label="Verification"
                value={
                  <AllergyVerificationBadge
                    status={
                      record.verificationStatus
                    }
                  />
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileCode2
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Coded identification
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Allergen code"
                value={
                  record.allergenCode ? (
                    <span className="font-mono text-xs">
                      {record.allergenCode}
                    </span>
                  ) : (
                    "Not recorded"
                  )
                }
              />

              <DetailItem
                label="Code system"
                value={
                  record.codeSystem ??
                  "Not recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Reaction history
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Reaction severity"
                value={
                  record.reactionSeverity
                    ? ALLERGY_REACTION_SEVERITY_LABELS[
                        record.reactionSeverity
                      ]
                    : "Not recorded"
                }
              />

              <DetailItem
                label="Exposure route"
                value={
                  record.exposureRoute ??
                  "Not recorded"
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
                label="Last occurrence"
                value={formatPatientDate(
                  record.lastOccurrenceDate,
                  "Not recorded"
                )}
              />

              <DetailItem
                label="Reaction manifestations"
                className="sm:col-span-2"
                value={
                  record.reactionManifestations
                    .length > 0 ? (
                    <ul className="list-inside list-disc space-y-1">
                      {record.reactionManifestations.map(
                        (manifestation) => (
                          <li key={manifestation}>
                            {manifestation}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    "Not recorded"
                  )
                }
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
                  ALLERGY_INFORMATION_SOURCE_LABELS[
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
              Notes
            </h3>

            <div className="rounded-xl border p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {record.notes ??
                  "No additional allergy notes were recorded."}
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

          <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Allergy and intolerance records may affect
              medication, dietary, procedural, and emergency
              workflows. Clinical verification remains
              required.
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
              : "Edit allergy"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
