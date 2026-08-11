"use client"

import {
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  IdCard,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PhilHealthClaimStatusBadge,
  PhilHealthEligibilityStatusBadge,
  PhilHealthRequirementStatusBadge,
} from "@/features/philhealth/components/philhealth-status-badges"
import {
  PHILHEALTH_AUDIT_ACTION_LABELS,
  PHILHEALTH_MANUAL_MODE_NOTICE,
  PHILHEALTH_MEMBER_RELATIONSHIP_LABELS,
  PHILHEALTH_SUBMISSION_CHANNEL_LABELS,
} from "@/features/philhealth/constants/philhealth.constants"
import type {
  PhilHealthAuditRecord,
  PhilHealthClaim,
  PhilHealthClaimRequirement,
  PhilHealthPatientProfile,
} from "@/features/philhealth/types/philhealth.types"
import { formatBillingAmount } from "@/features/billing/utils/billing.utils"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface PhilHealthClaimDetailsSheetProps {
  claim:
    | PhilHealthClaim
    | null

  patient:
    | Patient
    | null

  profile:
    | PhilHealthPatientProfile
    | null

  auditRecords:
    readonly PhilHealthAuditRecord[]

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onEditRequirement: (
    requirement:
      PhilHealthClaimRequirement
  ) => void

  onEditProfile: (
    patient: Patient
  ) => void

  onRecordEligibility: (
    patient: Patient,
    profile:
      PhilHealthPatientProfile
  ) => void
}

const lockedRequirementStatuses =
  new Set([
    "submitted-manually",
    "submitted-electronically",
    "paid",
    "reconciled",
    "voided",
  ])

function formatToken(
  value: string
): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}

export function PhilHealthClaimDetailsSheet({
  claim,
  patient,
  profile,
  auditRecords,
  open,
  onOpenChange,
  onEditRequirement,
  onEditProfile,
  onRecordEligibility,
}: PhilHealthClaimDetailsSheetProps) {
  if (
    !claim ||
    !patient ||
    !profile
  ) {
    return null
  }

  const completenessPercent =
    Math.max(
      0,
      Math.min(
        100,
        claim.completenessPercent
      )
    )

  const requirementsLocked =
    lockedRequirementStatuses.has(
      claim.status
    )

  const relatedAuditRecords =
    auditRecords
      .filter(
        (record) =>
          record.claimId ===
          claim.id
      )
      .sort(
        (
          firstRecord,
          secondRecord
        ) =>
          new Date(
            secondRecord.occurredAt
          ).getTime() -
          new Date(
            firstRecord.occurredAt
          ).getTime()
      )
      .slice(0, 10)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-5xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
              <FileText
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle>
                PhilHealth Claim Details
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {
                  claim.internalClaimNumber
                }
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <PhilHealthClaimStatusBadge
                  status={claim.status}
                />

                <PhilHealthEligibilityStatusBadge
                  status={
                    profile.eligibilityStatus
                  }
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-7 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-4 text-sky-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Patient and profile
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Patient
                </dt>

                <dd className="mt-1 font-medium">
                  {getPatientFullName(
                    patient
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Medical record number
                </dt>

                <dd className="mt-1 font-mono text-xs">
                  {
                    patient.medicalRecordNumber
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Member relationship
                </dt>

                <dd className="mt-1">
                  {
                    PHILHEALTH_MEMBER_RELATIONSHIP_LABELS[
                      profile.memberRelationship
                    ]
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Membership category
                </dt>

                <dd className="mt-1">
                  {profile.membershipCategory ??
                    "Not recorded"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Eligibility checked
                </dt>

                <dd className="mt-1">
                  {formatPatientDateTime(
                    profile.eligibilityCheckedAt,
                    "Not checked"
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Checked by
                </dt>

                <dd className="mt-1">
                  {profile.eligibilityCheckedBy ??
                    "Not recorded"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Claim preparation
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Hospital branch
                </dt>

                <dd className="mt-1">
                  {claim.branchName}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Encounter type
                </dt>

                <dd className="mt-1">
                  {formatToken(
                    claim.encounterType
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Encounter reference
                </dt>

                <dd className="mt-1 font-mono text-xs">
                  {claim.encounterReference ??
                    "Not linked"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Admission
                </dt>

                <dd className="mt-1">
                  {formatPatientDateTime(
                    claim.admissionAt
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Discharge
                </dt>

                <dd className="mt-1">
                  {formatPatientDateTime(
                    claim.dischargeAt
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Submission channel
                </dt>

                <dd className="mt-1">
                  {
                    PHILHEALTH_SUBMISSION_CHANNEL_LABELS[
                      claim.submissionChannel
                    ]
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Diagnosis
                </dt>

                <dd className="mt-1">
                  {claim.primaryDiagnosisName ??
                    "Not recorded"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Diagnosis code
                </dt>

                <dd className="mt-1 font-mono text-xs">
                  {claim.primaryDiagnosisCode ??
                    "Not recorded"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Benefit package
                </dt>

                <dd className="mt-1">
                  {claim.benefitPackageName ??
                    "Not recorded"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Created
                </dt>

                <dd className="mt-1">
                  {formatPatientDateTime(
                    claim.createdAt
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Created by
                </dt>

                <dd className="mt-1">
                  {claim.createdBy}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Last updated
                </dt>

                <dd className="mt-1">
                  {formatPatientDateTime(
                    claim.updatedAt
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Internal financial estimate
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Gross hospital charges
                </p>

                <p className="mt-1 break-words text-lg font-semibold tabular-nums [overflow-wrap:anywhere]">
                  {formatBillingAmount(
                    claim.grossHospitalChargesCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <p className="text-xs text-emerald-700">
                  Estimated PhilHealth benefit
                </p>

                <p className="mt-1 break-words text-lg font-semibold text-emerald-800 tabular-nums [overflow-wrap:anywhere]">
                  {formatBillingAmount(
                    claim.estimatedPhilHealthBenefitCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <p className="text-xs text-amber-700">
                  Estimated patient responsibility
                </p>

                <p className="mt-1 break-words text-lg font-semibold text-amber-800 tabular-nums [overflow-wrap:anywhere]">
                  {formatBillingAmount(
                    claim.patientResponsibilityCentavos
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardList
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Requirement checklist
              </h3>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  Claim completeness
                </p>

                <p className="text-sm font-semibold">
                  {completenessPercent}%
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-600 transition-[width]"
                  style={{
                    width:
                      `${completenessPercent}%`,
                  }}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Requirement
                    </TableHead>

                    <TableHead>
                      Required
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead>
                      Reviewed
                    </TableHead>

                    <TableHead>
                      Remarks
                    </TableHead>

                    <TableHead>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {claim.requirements.map(
                    (requirement) => (
                      <TableRow
                        key={requirement.id}
                      >
                        <TableCell>
                          <p className="font-medium">
                            {requirement.label}
                          </p>

                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {requirement.code}
                          </p>
                        </TableCell>

                        <TableCell>
                          {requirement.required
                            ? "Yes"
                            : "No"}
                        </TableCell>

                        <TableCell>
                          <PhilHealthRequirementStatusBadge
                            status={
                              requirement.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <p>
                            {formatPatientDateTime(
                              requirement.reviewedAt
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {requirement.reviewedBy ??
                              "Not reviewed"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="max-w-xs whitespace-normal">
                            {requirement.remarks ??
                              "No remarks"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={
                              requirementsLocked
                            }
                            onClick={() =>
                              onEditRequirement(
                                requirement
                              )
                            }
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History
                className="size-4 text-slate-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Recent claim activity
              </h3>
            </div>

            {relatedAuditRecords.length ===
            0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No claim activity recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {relatedAuditRecords.map(
                  (record) => (
                    <article
                      key={record.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {
                            PHILHEALTH_AUDIT_ACTION_LABELS[
                              record.action
                            ]
                          }
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatPatientDateTime(
                            record.occurredAt
                          )}
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {record.summary}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Actor: {record.actor}
                      </p>
                    </article>
                  )
                )}
              </div>
            )}
          </section>

          {requirementsLocked ? (
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              <ShieldAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                Requirements are locked for
                this claim status.
              </p>
            </div>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {PHILHEALTH_MANUAL_MODE_NOTICE}
            </p>
          </div>
        </div>

        <SheetFooter className="gap-2 border-t bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onEditProfile(patient)
            }
          >
            <IdCard
              aria-hidden="true"
            />
            Edit profile
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onRecordEligibility(
                patient,
                profile
              )
            }
          >
            <ClipboardCheck
              aria-hidden="true"
            />
            Record eligibility
          </Button>

          <Button
            type="button"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
