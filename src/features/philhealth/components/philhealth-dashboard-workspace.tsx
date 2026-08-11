"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  ClipboardCheck,
  Eye,
  FilePlus2,
  FileText,
  IdCard,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PhilHealthClaimDetailsSheet } from "@/features/philhealth/components/philhealth-claim-details-sheet"
import { PhilHealthClaimDraftDialog } from "@/features/philhealth/components/philhealth-claim-draft-dialog"
import { PhilHealthEligibilityDialog } from "@/features/philhealth/components/philhealth-eligibility-dialog"
import { PhilHealthProfileDialog } from "@/features/philhealth/components/philhealth-profile-dialog"
import { PhilHealthRequirementDialog } from "@/features/philhealth/components/philhealth-requirement-dialog"
import {
  PhilHealthClaimStatusBadge,
  PhilHealthConnectionModeBadge,
  PhilHealthEligibilityStatusBadge,
  PhilHealthIntegrationStatusBadge,
} from "@/features/philhealth/components/philhealth-status-badges"
import {
  PHILHEALTH_CLAIM_STATUS_LABELS,
  PHILHEALTH_DEVELOPMENT_NOTICE,
  PHILHEALTH_ELIGIBILITY_STATUS_LABELS,
  PHILHEALTH_MANUAL_MODE_NOTICE,
  PHILHEALTH_MEMBER_RELATIONSHIP_LABELS,
  PHILHEALTH_SECURITY_NOTICE,
} from "@/features/philhealth/constants/philhealth.constants"
import {
  usePhilHealth,
} from "@/features/philhealth/providers/philhealth-provider"
import type {
  PhilHealthClaimFormValues,
  PhilHealthEligibilityFormValues,
  PhilHealthProfileFormValues,
  PhilHealthRequirementUpdateValues,
} from "@/features/philhealth/schemas/philhealth.schema"
import {
  PHILHEALTH_CLAIM_STATUSES,
  PHILHEALTH_ELIGIBILITY_STATUSES,
  type PhilHealthClaimStatus,
  type PhilHealthEligibilityStatus,
} from "@/features/philhealth/types/philhealth.types"
import { formatBillingAmount } from "@/features/billing/utils/billing.utils"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  getPatientFullName,
  getPatientInitials,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

type WorkspaceView =
  | "patients"
  | "claims"

function findPatient(
  patients:
    readonly Patient[],
  patientId: string
): Patient | null {
  return (
    patients.find(
      (patient) =>
        patient.id === patientId
    ) ?? null
  )
}

export function PhilHealthDashboardWorkspace() {
  const {
    patients,
  } = usePatients()

  const {
    profiles,
    claims,
    auditRecords,
    settings,

    savePatientProfile,
    recordEligibility,
    createClaimDraft,
    updateClaimRequirement,
  } = usePhilHealth()

  const [
    workspaceView,
    setWorkspaceView,
  ] =
    useState<WorkspaceView>(
      "patients"
    )

  const [search, setSearch] =
    useState("")

  const [
    claimStatusFilter,
    setClaimStatusFilter,
  ] =
    useState<
      | PhilHealthClaimStatus
      | "all"
    >("all")

  const [
    eligibilityFilter,
    setEligibilityFilter,
  ] =
    useState<
      | PhilHealthEligibilityStatus
      | "all"
    >("all")

  const [
    profilePatientId,
    setProfilePatientId,
  ] = useState<string | null>(
    null
  )

  const [
    eligibilityPatientId,
    setEligibilityPatientId,
  ] = useState<string | null>(
    null
  )

  const [
    isClaimDialogOpen,
    setIsClaimDialogOpen,
  ] = useState(false)

  const [
    claimInitialPatientId,
    setClaimInitialPatientId,
  ] = useState<string | null>(
    null
  )

  const [
    viewingClaimId,
    setViewingClaimId,
  ] = useState<string | null>(
    null
  )

  const [
    requirementSelection,
    setRequirementSelection,
  ] = useState<{
    claimId: string
    requirementId: string
  } | null>(null)

  const profileByPatientId =
    useMemo(
      () =>
        new Map(
          profiles.map(
            (profile) => [
              profile.patientId,
              profile,
            ]
          )
        ),
      [profiles]
    )

  const filteredPatients =
    useMemo(
      () =>
        patients
          .filter(
            (patient) => {
              const profile =
                profileByPatientId.get(
                  patient.id
                )

              const eligibilityStatus =
                profile
                  ?.eligibilityStatus ??
                "not-checked"

              const matchesSearch =
                normalizePatientSearch(
                  getPatientFullName(
                    patient
                  ),
                  patient.medicalRecordNumber,
                  patient.branchName,
                  profile
                    ?.membershipCategory,
                  profile
                    ?.memberRelationship
                ).includes(
                  normalizePatientSearch(
                    search
                  )
                )

              const matchesEligibility =
                eligibilityFilter ===
                  "all" ||
                eligibilityStatus ===
                  eligibilityFilter

              return (
                matchesSearch &&
                matchesEligibility
              )
            }
          )
          .sort(
            (
              firstPatient,
              secondPatient
            ) =>
              getPatientFullName(
                firstPatient
              ).localeCompare(
                getPatientFullName(
                  secondPatient
                ),
                "en-PH"
              )
          ),
      [
        eligibilityFilter,
        patients,
        profileByPatientId,
        search,
      ]
    )

  const filteredClaims =
    useMemo(
      () =>
        claims
          .filter(
            (claim) => {
              const patient =
                findPatient(
                  patients,
                  claim.patientId
                )

              const matchesSearch =
                normalizePatientSearch(
                  claim.internalClaimNumber,
                  claim.branchName,
                  claim.encounterReference,
                  claim.primaryDiagnosisCode,
                  claim.primaryDiagnosisName,
                  claim.benefitPackageCode,
                  claim.benefitPackageName,
                  patient
                    ? getPatientFullName(
                        patient
                      )
                    : null,
                  patient
                    ?.medicalRecordNumber
                ).includes(
                  normalizePatientSearch(
                    search
                  )
                )

              const matchesStatus =
                claimStatusFilter ===
                  "all" ||
                claim.status ===
                  claimStatusFilter

              return (
                matchesSearch &&
                matchesStatus
              )
            }
          )
          .sort(
            (
              firstClaim,
              secondClaim
            ) =>
              new Date(
                secondClaim.updatedAt
              ).getTime() -
              new Date(
                firstClaim.updatedAt
              ).getTime()
          ),
      [
        claimStatusFilter,
        claims,
        patients,
        search,
      ]
    )

  const eligibleProfileCount =
    profiles.filter(
      (profile) =>
        profile.eligibilityStatus ===
        "eligible"
    ).length

  const readyForReviewCount =
    claims.filter(
      (claim) =>
        claim.status ===
        "ready-for-review"
    ).length

  const activeClaimCount =
    claims.filter(
      (claim) =>
        ![
          "denied",
          "reconciled",
          "voided",
        ].includes(
          claim.status
        )
    ).length

  const profilePatient =
    profilePatientId
      ? findPatient(
          patients,
          profilePatientId
        )
      : null

  const profileForDialog =
    profilePatientId
      ? profileByPatientId.get(
          profilePatientId
        ) ?? null
      : null

  const eligibilityPatient =
    eligibilityPatientId
      ? findPatient(
          patients,
          eligibilityPatientId
        )
      : null

  const eligibilityProfile =
    eligibilityPatientId
      ? profileByPatientId.get(
          eligibilityPatientId
        ) ?? null
      : null

  const viewingClaim =
    claims.find(
      (claim) =>
        claim.id ===
        viewingClaimId
    ) ?? null

  const viewingPatient =
    viewingClaim
      ? findPatient(
          patients,
          viewingClaim.patientId
        )
      : null

  const viewingProfile =
    viewingClaim
      ? profiles.find(
          (profile) =>
            profile.id ===
            viewingClaim.profileId
        ) ?? null
      : null

  const requirementClaim =
    requirementSelection
      ? claims.find(
          (claim) =>
            claim.id ===
            requirementSelection.claimId
        ) ?? null
      : null

  const selectedRequirement =
    requirementClaim &&
    requirementSelection
      ? requirementClaim.requirements.find(
          (requirement) =>
            requirement.id ===
            requirementSelection.requirementId
        ) ?? null
      : null

  async function handleSaveProfile(
    values:
      PhilHealthProfileFormValues
  ) {
    const profile =
      savePatientProfile(values)

    toast.success(
      "PhilHealth profile saved",
      {
        description:
          profile.eligibilityStatus ===
          "not-checked"
            ? "The patient profile is ready for eligibility verification."
            : "The patient PhilHealth profile was updated.",
      }
    )
  }

  async function handleRecordEligibility(
    values:
      PhilHealthEligibilityFormValues
  ) {
    const profile =
      recordEligibility(values)

    toast.success(
      "Eligibility result recorded",
      {
        description:
          PHILHEALTH_ELIGIBILITY_STATUS_LABELS[
            profile.eligibilityStatus
          ],
      }
    )
  }

  async function handleCreateClaim(
    values:
      PhilHealthClaimFormValues
  ) {
    const claim =
      createClaimDraft(values)

    setViewingClaimId(
      claim.id
    )

    toast.success(
      "PhilHealth claim draft created",
      {
        description:
          claim.internalClaimNumber,
      }
    )
  }

  async function handleUpdateRequirement(
    values:
      PhilHealthRequirementUpdateValues
  ) {
    const claim =
      updateClaimRequirement(
        values
      )

    toast.success(
      "Claim requirement updated",
      {
        description: `${claim.internalClaimNumber} is ${claim.completenessPercent}% complete.`,
      }
    )
  }

  function openClaimDialog(
    patientId:
      string | null = null
  ) {
    setClaimInitialPatientId(
      patientId
    )

    setIsClaimDialogOpen(true)
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
              <ShieldPlus
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Hospital-side claim preparation
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                PhilHealth Claims Workspace
              </h1>

              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Manage patient PhilHealth
                profiles, manually record
                eligibility, prepare claim
                drafts, and track internal
                requirements before authorized
                eClaims integration.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-violet-700 text-white hover:bg-violet-800"
            onClick={() =>
              openClaimDialog()
            }
          >
            <FilePlus2
              aria-hidden="true"
            />
            Create claim draft
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Manual / semi-integrated mode
            </p>

            <p className="mt-1 max-w-3xl text-xs text-amber-800">
              {PHILHEALTH_MANUAL_MODE_NOTICE}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <PhilHealthConnectionModeBadge
              mode={
                settings.connectionMode
              }
            />

            <PhilHealthIntegrationStatusBadge
              status={
                settings.integrationStatus
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Patient profiles
              </p>

              <p className="mt-1 text-xl font-semibold">
                {profiles.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">
                Eligible profiles
              </p>

              <p className="mt-1 text-xl font-semibold text-emerald-800">
                {eligibleProfileCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-sky-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-sky-700">
                Active claims
              </p>

              <p className="mt-1 text-xl font-semibold text-sky-800">
                {activeClaimCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-violet-700">
                Ready for review
              </p>

              <p className="mt-1 text-xl font-semibold text-violet-800">
                {readyForReviewCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 rounded-xl border bg-background p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={
                  workspaceView ===
                  "patients"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setWorkspaceView(
                    "patients"
                  )
                }
              >
                <Users
                  aria-hidden="true"
                />
                Patients and profiles
              </Button>

              <Button
                type="button"
                variant={
                  workspaceView ===
                  "claims"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setWorkspaceView(
                    "claims"
                  )
                }
              >
                <FileText
                  aria-hidden="true"
                />
                Claims
              </Button>
            </div>

            <div className="relative min-w-0 flex-1 xl:max-w-md">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                placeholder="Search patient, MRN, claim, branch, diagnosis, or package"
                className="pl-8"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            {workspaceView ===
            "patients" ? (
              <select
                value={
                  eligibilityFilter
                }
                className="h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) =>
                  setEligibilityFilter(
                    event.target.value as
                      | PhilHealthEligibilityStatus
                      | "all"
                  )
                }
              >
                <option value="all">
                  All eligibility statuses
                </option>

                {PHILHEALTH_ELIGIBILITY_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {
                        PHILHEALTH_ELIGIBILITY_STATUS_LABELS[
                          status
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            ) : (
              <select
                value={
                  claimStatusFilter
                }
                className="h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) =>
                  setClaimStatusFilter(
                    event.target.value as
                      | PhilHealthClaimStatus
                      | "all"
                  )
                }
              >
                <option value="all">
                  All claim statuses
                </option>

                {PHILHEALTH_CLAIM_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {
                        PHILHEALTH_CLAIM_STATUS_LABELS[
                          status
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            )}
          </div>
        </div>

        {workspaceView ===
        "patients" ? (
          <div className="overflow-hidden rounded-xl border bg-background">
            <Table className="min-w-[1250px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Patient
                  </TableHead>

                  <TableHead>
                    Branch
                  </TableHead>

                  <TableHead>
                    Profile
                  </TableHead>

                  <TableHead>
                    Eligibility
                  </TableHead>

                  <TableHead>
                    Claims
                  </TableHead>

                  <TableHead>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredPatients.map(
                  (patient) => {
                    const profile =
                      profileByPatientId.get(
                        patient.id
                      ) ?? null

                    const patientClaimCount =
                      claims.filter(
                        (claim) =>
                          claim.patientId ===
                          patient.id
                      ).length

                    return (
                      <TableRow
                        key={patient.id}
                      >
                        <TableCell>
                          <div className="flex min-w-56 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700">
                              {getPatientInitials(
                                patient
                              )}
                            </div>

                            <div>
                              <p className="font-medium">
                                {getPatientFullName(
                                  patient
                                )}
                              </p>

                              <p className="font-mono text-xs text-muted-foreground">
                                {
                                  patient.medicalRecordNumber
                                }
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {patient.branchName}
                        </TableCell>

                        <TableCell>
                          {profile ? (
                            <div>
                              <p className="font-medium">
                                {
                                  PHILHEALTH_MEMBER_RELATIONSHIP_LABELS[
                                    profile.memberRelationship
                                  ]
                                }
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {profile.membershipCategory ??
                                  "Category not recorded"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No profile
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <PhilHealthEligibilityStatusBadge
                            status={
                              profile
                                ?.eligibilityStatus ??
                              "not-checked"
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {patientClaimCount}
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-96 flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setProfilePatientId(
                                  patient.id
                                )
                              }
                            >
                              <IdCard
                                aria-hidden="true"
                              />
                              {profile
                                ? "Edit profile"
                                : "Create profile"}
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                !profile
                              }
                              onClick={() =>
                                setEligibilityPatientId(
                                  patient.id
                                )
                              }
                            >
                              <ClipboardCheck
                                aria-hidden="true"
                              />
                              Eligibility
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              disabled={
                                !profile
                              }
                              onClick={() =>
                                openClaimDialog(
                                  patient.id
                                )
                              }
                            >
                              <FilePlus2
                                aria-hidden="true"
                              />
                              New claim
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-background">
            <Table className="min-w-[1450px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Claim
                  </TableHead>

                  <TableHead>
                    Patient
                  </TableHead>

                  <TableHead>
                    Branch / Encounter
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Completeness
                  </TableHead>

                  <TableHead>
                    Estimated benefit
                  </TableHead>

                  <TableHead>
                    Patient responsibility
                  </TableHead>

                  <TableHead>
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredClaims.map(
                  (claim) => {
                    const patient =
                      findPatient(
                        patients,
                        claim.patientId
                      )

                    return (
                      <TableRow
                        key={claim.id}
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {
                              claim.internalClaimNumber
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {claim.benefitPackageName ??
                              "Package not recorded"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {patient
                              ? getPatientFullName(
                                  patient
                                )
                              : "Patient unavailable"}
                          </p>

                          <p className="font-mono text-xs text-muted-foreground">
                            {patient
                              ?.medicalRecordNumber ??
                              "MRN unavailable"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            {claim.branchName}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {claim.encounterType}
                            {claim.encounterReference
                              ? ` · ${claim.encounterReference}`
                              : ""}
                          </p>
                        </TableCell>

                        <TableCell>
                          <PhilHealthClaimStatusBadge
                            status={
                              claim.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <div className="min-w-32">
                            <div className="flex items-center justify-between text-xs">
                              <span>
                                {
                                  claim.completenessPercent
                                }%
                              </span>
                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-violet-600"
                                style={{
                                  width:
                                    `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        claim.completenessPercent
                                      )
                                    )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="font-semibold text-emerald-700">
                          {formatBillingAmount(
                            claim.estimatedPhilHealthBenefitCentavos
                          )}
                        </TableCell>

                        <TableCell className="font-semibold text-amber-700">
                          {formatBillingAmount(
                            claim.patientResponsibilityCentavos
                          )}
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setViewingClaimId(
                                claim.id
                              )
                            }
                          >
                            <Eye
                              aria-hidden="true"
                            />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {PHILHEALTH_SECURITY_NOTICE}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {PHILHEALTH_DEVELOPMENT_NOTICE}
            </p>
          </div>
        </div>
      </section>

      <PhilHealthProfileDialog
        patient={profilePatient}
        profile={profileForDialog}
        open={Boolean(
          profilePatient
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setProfilePatientId(
              null
            )
          }
        }}
        onSubmitProfile={
          handleSaveProfile
        }
      />

      <PhilHealthEligibilityDialog
        patient={
          eligibilityPatient
        }
        profile={
          eligibilityProfile
        }
        open={Boolean(
          eligibilityPatient &&
            eligibilityProfile
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEligibilityPatientId(
              null
            )
          }
        }}
        onSubmitEligibility={
          handleRecordEligibility
        }
      />

      <PhilHealthClaimDraftDialog
        open={isClaimDialogOpen}
        initialPatientId={
          claimInitialPatientId
        }
        onOpenChange={(nextOpen) => {
          setIsClaimDialogOpen(
            nextOpen
          )

          if (!nextOpen) {
            setClaimInitialPatientId(
              null
            )
          }
        }}
        onSubmitClaim={
          handleCreateClaim
        }
      />

      <PhilHealthClaimDetailsSheet
        claim={viewingClaim}
        patient={viewingPatient}
        profile={viewingProfile}
        auditRecords={
          auditRecords
        }
        open={Boolean(
          viewingClaim &&
            viewingPatient &&
            viewingProfile
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingClaimId(null)
          }
        }}
        onEditRequirement={(
          requirement
        ) =>
          setRequirementSelection({
            claimId:
              viewingClaim?.id ??
              "",

            requirementId:
              requirement.id,
          })
        }
        onEditProfile={(patient) => {
          setViewingClaimId(null)

          setProfilePatientId(
            patient.id
          )
        }}
        onRecordEligibility={(
          patient
        ) => {
          setViewingClaimId(null)

          setEligibilityPatientId(
            patient.id
          )
        }}
      />

      <PhilHealthRequirementDialog
        claim={requirementClaim}
        requirement={
          selectedRequirement
        }
        open={Boolean(
          requirementClaim &&
            selectedRequirement
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRequirementSelection(
              null
            )
          }
        }}
        onSubmitRequirement={
          handleUpdateRequirement
        }
      />
    </>
  )
}
