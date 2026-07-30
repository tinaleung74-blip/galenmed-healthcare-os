"use client"

import type { ReactNode } from "react"
import {
  Archive,
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
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
  InsuranceCoverageStatusBadge,
  InsurancePriorityBadge,
  InsuranceRecordStatusBadge,
  InsuranceVerificationBadge,
} from "@/features/patients/components/patient-insurance-status-badges"
import {
  INSURANCE_COVERAGE_TYPE_LABELS,
  INSURANCE_INFORMATION_SOURCE_LABELS,
  INSURANCE_SUBSCRIBER_RELATIONSHIP_LABELS,
} from "@/features/patients/constants/patient-insurance.constants"
import type { PatientInsuranceRecord } from "@/features/patients/types/patient-insurance.types"
import {
  formatPatientDate,
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"
import {
  formatCoveragePeriod,
  maskInsuranceIdentifier,
} from "@/features/patients/utils/patient-insurance.utils"

interface PatientInsuranceDetailsSheetProps {
  record: PatientInsuranceRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditRecord: (
    record: PatientInsuranceRecord
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

export function PatientInsuranceDetailsSheet({
  record,
  open,
  onOpenChange,
  onEditRecord,
}: PatientInsuranceDetailsSheetProps) {
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
            <div className="rounded-xl bg-sky-50 p-3 text-sky-700">
              <BadgeCheck
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {record.payerName}
              </SheetTitle>

              <SheetDescription className="mt-1">
                {record.planName}
                {" · "}
                {
                  INSURANCE_COVERAGE_TYPE_LABELS[
                    record.coverageType
                  ]
                }
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <InsuranceCoverageStatusBadge
                  status={record.coverageStatus}
                />

                <InsuranceVerificationBadge
                  status={record.verificationStatus}
                />

                <InsurancePriorityBadge
                  priority={record.priority}
                />

                <InsuranceRecordStatusBadge
                  status={record.recordStatus}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BadgeCheck
                className="size-4 text-sky-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Coverage information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Payer"
                value={record.payerName}
              />

              <DetailItem
                label="Plan"
                value={record.planName}
              />

              <DetailItem
                label="Coverage type"
                value={
                  INSURANCE_COVERAGE_TYPE_LABELS[
                    record.coverageType
                  ]
                }
              />

              <DetailItem
                label="Coverage period"
                value={formatCoveragePeriod(
                  record.effectiveFrom,
                  record.effectiveTo
                )}
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Protected identifiers
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
              <DetailItem
                label="Member number"
                value={
                  <span className="font-mono text-xs">
                    {maskInsuranceIdentifier(
                      record.memberNumber
                    )}
                  </span>
                }
              />

              <DetailItem
                label="Policy number"
                value={
                  <span className="font-mono text-xs">
                    {maskInsuranceIdentifier(
                      record.policyNumber
                    )}
                  </span>
                }
              />

              <DetailItem
                label="Group number"
                value={
                  <span className="font-mono text-xs">
                    {maskInsuranceIdentifier(
                      record.groupNumber
                    )}
                  </span>
                }
              />
            </dl>

            <p className="text-xs text-muted-foreground">
              Full identifiers are intentionally masked in
              this general profile view.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Subscriber information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Subscriber"
                value={record.subscriberName}
              />

              <DetailItem
                label="Relationship"
                value={
                  INSURANCE_SUBSCRIBER_RELATIONSHIP_LABELS[
                    record.subscriberRelationship
                  ]
                }
              />

              <DetailItem
                label="Subscriber date of birth"
                value={formatPatientDate(
                  record.subscriberDateOfBirth,
                  "Not recorded"
                )}
              />

              <DetailItem
                label="Employer"
                value={
                  record.employerName ??
                  "Not recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CircleDollarSign
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Benefits and authorization
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Prior authorization"
                value={
                  record.authorizationRequired
                    ? "May be required"
                    : "Not indicated"
                }
              />

              <DetailItem
                label="Payer contact"
                value={
                  record.payerContactNumber ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Covered services"
                className="sm:col-span-2"
                value={
                  record.coveredServices.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1">
                      {record.coveredServices.map(
                        (service) => (
                          <li key={service}>
                            {service}
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
            <h3 className="text-sm font-semibold">
              Verification and source
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Source"
                value={
                  INSURANCE_INFORMATION_SOURCE_LABELS[
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
                className="sm:col-span-2"
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
                  "No insurance notes were recorded."}
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

          <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs text-sky-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Coverage verification is time-sensitive and
              does not guarantee authorization, claim
              acceptance, or payment.
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
              : "Edit coverage"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
