"use client"

import {
  useEffect,
  useMemo,
  type ChangeEvent,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form"
import {
  FilePlus2,
  LoaderCircle,
  Save,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  PhilHealthEligibilityStatusBadge,
} from "@/features/philhealth/components/philhealth-status-badges"
import {
  PHILHEALTH_DEVELOPMENT_NOTICE,
  PHILHEALTH_MANUAL_MODE_NOTICE,
  PHILHEALTH_STAFF_ROLE_DEFINITIONS,
} from "@/features/philhealth/constants/philhealth.constants"
import {
  usePhilHealth,
} from "@/features/philhealth/providers/philhealth-provider"
import {
  philHealthClaimFormSchema,
  type PhilHealthClaimFormValues,
} from "@/features/philhealth/schemas/philhealth.schema"
import {
  PHILHEALTH_ENCOUNTER_TYPES,
  PHILHEALTH_STAFF_ROLES,
  type PhilHealthEncounterType,
} from "@/features/philhealth/types/philhealth.types"
import {
  calculatePhilHealthPatientResponsibility,
  parsePhilHealthPesoToCentavos,
} from "@/features/philhealth/utils/philhealth.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import {
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"

interface PhilHealthClaimDraftDialogProps {
  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  initialPatientId?:
    string | null

  onSubmitClaim: (
    values:
      PhilHealthClaimFormValues
  ) => Promise<void>
}

const encounterTypeLabels: Record<
  PhilHealthEncounterType,
  string
> = {
  inpatient: "Inpatient",
  outpatient: "Outpatient",
  emergency: "Emergency",
  consultation: "Consultation",
  procedure: "Procedure",
  other: "Other",
}

function getDefaultValues({
  initialPatientId,
  profileId,
}: {
  initialPatientId:
    string | null | undefined

  profileId: string
}): PhilHealthClaimFormValues {
  return {
    patientId:
      initialPatientId ?? "",

    profileId,

    branchId:
      GALENMED_BRANCHES[0]
        ?.id ?? "",

    encounterType:
      "inpatient",

    encounterRecordId: "",
    encounterReference: "",

    admissionAt: "",
    dischargeAt: "",

    primaryDiagnosisCode: "",
    primaryDiagnosisName: "",

    benefitPackageCode: "",
    benefitPackageName: "",

    grossHospitalChargesPhp: "",
    estimatedPhilHealthBenefitPhp:
      "0.00",

    notes: "",

    createdBy: "",

    actorRole:
      "philhealth-officer",
  }
}

export function PhilHealthClaimDraftDialog({
  open,
  onOpenChange,
  initialPatientId = null,
  onSubmitClaim,
}: PhilHealthClaimDraftDialogProps) {
  const {
    patients,
  } = usePatients()

  const {
    profiles,
  } = usePhilHealth()

  const initialProfileId =
    initialPatientId
      ? profiles.find(
          (profile) =>
            profile.patientId ===
            initialPatientId
        )?.id ?? ""
      : ""

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<PhilHealthClaimFormValues>(
      {
        resolver:
          zodResolver(
            philHealthClaimFormSchema
          ) as Resolver<PhilHealthClaimFormValues>,

        defaultValues:
          getDefaultValues({
            initialPatientId,
            profileId:
              initialProfileId,
          }),

        mode: "onTouched",
      }
    )

  const patientId =
    useWatch({
      control,
      name: "patientId",
    })

  const grossHospitalChargesPhp =
    useWatch({
      control,
      name:
        "grossHospitalChargesPhp",
    })

  const estimatedPhilHealthBenefitPhp =
    useWatch({
      control,
      name:
        "estimatedPhilHealthBenefitPhp",
    })

  useEffect(() => {
    if (open) {
      const profileId =
        initialPatientId
          ? profiles.find(
              (profile) =>
                profile.patientId ===
                initialPatientId
            )?.id ?? ""
          : ""

      reset(
        getDefaultValues({
          initialPatientId,
          profileId,
        })
      )
    }
  }, [
    initialPatientId,
    open,
    profiles,
    reset,
  ])

  const activePatients =
    useMemo(
      () =>
        patients
          .filter(
            (patient) =>
              patient.status !==
              "archived"
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
      [patients]
    )

  const selectedPatient =
    activePatients.find(
      (patient) =>
        patient.id ===
        patientId
    ) ?? null

  const selectedProfile =
    profiles.find(
      (profile) =>
        profile.patientId ===
        patientId
    ) ?? null

  const amountPreview =
    useMemo(() => {
      try {
        if (
          !grossHospitalChargesPhp ||
          !estimatedPhilHealthBenefitPhp
        ) {
          return null
        }

        const grossAmount =
          parsePhilHealthPesoToCentavos(
            grossHospitalChargesPhp
          )

        const estimatedBenefit =
          parsePhilHealthPesoToCentavos(
            estimatedPhilHealthBenefitPhp
          )

        return {
          grossAmount,
          estimatedBenefit,

          patientResponsibility:
            calculatePhilHealthPatientResponsibility(
              grossAmount,
              estimatedBenefit
            ),
        }
      } catch {
        return null
      }
    }, [
      estimatedPhilHealthBenefitPhp,
      grossHospitalChargesPhp,
    ])

  const patientRegistration =
    register("patientId")

  function handlePatientChange(
    event:
      ChangeEvent<HTMLSelectElement>
  ) {
    patientRegistration.onChange(
      event
    )

    const nextPatientId =
      event.target.value

    const nextProfile =
      profiles.find(
        (profile) =>
          profile.patientId ===
          nextPatientId
      )

    setValue(
      "profileId",
      nextProfile?.id ?? "",
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  async function submitClaim(
    values:
      PhilHealthClaimFormValues
  ) {
    try {
      await onSubmitClaim(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The internal PhilHealth claim draft could not be created.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <FilePlus2
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Create internal PhilHealth claim draft
          </DialogTitle>

          <DialogDescription>
            Prepare a hospital-side claim
            draft before official eligibility,
            review, approval, and submission.
          </DialogDescription>
        </DialogHeader>

        <form
          id="philhealth-claim-draft-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitClaim
          )}
        >
          <input
            type="hidden"
            {...register(
              "profileId"
            )}
          />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Patient and hospital branch
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="philhealth-claim-patient">
                  Patient
                </Label>

                <select
                  id="philhealth-claim-patient"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...patientRegistration}
                  onChange={
                    handlePatientChange
                  }
                >
                  <option value="">
                    Select patient
                  </option>

                  {activePatients.map(
                    (patient) => (
                      <option
                        key={patient.id}
                        value={patient.id}
                      >
                        {getPatientFullName(
                          patient
                        )}
                        {" — "}
                        {
                          patient.medicalRecordNumber
                        }
                      </option>
                    )
                  )}
                </select>

                {errors.patientId
                  ?.message ? (
                    <p className="text-xs font-medium text-destructive">
                      {
                        errors.patientId
                          .message
                      }
                    </p>
                  ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-claim-branch">
                  Hospital branch
                </Label>

                <select
                  id="philhealth-claim-branch"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "branchId"
                  )}
                >
                  {GALENMED_BRANCHES.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {selectedPatient &&
            !selectedProfile ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                This patient does not have a
                PhilHealth profile. Create the
                patient PhilHealth profile
                before making a claim draft.
              </div>
            ) : null}

            {selectedProfile ? (
              <div className="flex flex-col gap-3 rounded-xl border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Patient PhilHealth profile found
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Relationship:{" "}
                    {
                      selectedProfile.memberRelationship
                    }
                  </p>
                </div>

                <PhilHealthEligibilityStatusBadge
                  status={
                    selectedProfile.eligibilityStatus
                  }
                />
              </div>
            ) : null}

            {errors.profileId
              ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.profileId
                      .message
                  }
                </p>
              ) : null}
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Encounter information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="philhealth-encounter-type">
                  Encounter type
                </Label>

                <select
                  id="philhealth-encounter-type"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "encounterType"
                  )}
                >
                  {PHILHEALTH_ENCOUNTER_TYPES.map(
                    (
                      encounterType
                    ) => (
                      <option
                        key={
                          encounterType
                        }
                        value={
                          encounterType
                        }
                      >
                        {
                          encounterTypeLabels[
                            encounterType
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-encounter-reference">
                  Encounter reference
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-encounter-reference"
                  placeholder="Example: admission or consultation number"
                  {...register(
                    "encounterReference"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-encounter-record-id">
                  Linked internal record ID
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-encounter-record-id"
                  placeholder="Internal GalenMed encounter ID"
                  {...register(
                    "encounterRecordId"
                  )}
                />
              </div>

              <div />

              <div className="space-y-2">
                <Label htmlFor="philhealth-admission-at">
                  Admission date and time
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-admission-at"
                  type="datetime-local"
                  {...register(
                    "admissionAt"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-discharge-at">
                  Discharge date and time
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-discharge-at"
                  type="datetime-local"
                  {...register(
                    "dischargeAt"
                  )}
                />

                {errors.dischargeAt
                  ?.message ? (
                    <p className="text-xs font-medium text-destructive">
                      {
                        errors.dischargeAt
                          .message
                      }
                    </p>
                  ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Diagnosis and benefit package
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="philhealth-diagnosis-code">
                  Primary diagnosis code
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-diagnosis-code"
                  placeholder="Example: ICD-10 code"
                  {...register(
                    "primaryDiagnosisCode"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-diagnosis-name">
                  Primary diagnosis
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-diagnosis-name"
                  {...register(
                    "primaryDiagnosisName"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-package-code">
                  Benefit package code
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-package-code"
                  {...register(
                    "benefitPackageCode"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-package-name">
                  Benefit package name
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-package-name"
                  {...register(
                    "benefitPackageName"
                  )}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Internal financial estimate
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="philhealth-gross-charges">
                  Gross hospital charges in PHP
                </Label>

                <Input
                  id="philhealth-gross-charges"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...register(
                    "grossHospitalChargesPhp"
                  )}
                />

                {errors.grossHospitalChargesPhp
                  ?.message ? (
                    <p className="text-xs font-medium text-destructive">
                      {
                        errors
                          .grossHospitalChargesPhp
                          .message
                      }
                    </p>
                  ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-estimated-benefit">
                  Estimated PhilHealth benefit in PHP
                </Label>

                <Input
                  id="philhealth-estimated-benefit"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...register(
                    "estimatedPhilHealthBenefitPhp"
                  )}
                />

                {errors.estimatedPhilHealthBenefitPhp
                  ?.message ? (
                    <p className="text-xs font-medium text-destructive">
                      {
                        errors
                          .estimatedPhilHealthBenefitPhp
                          .message
                      }
                    </p>
                  ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Gross charges
                </p>

                <p className="mt-1 break-words font-semibold tabular-nums [overflow-wrap:anywhere]">
                  {amountPreview
                    ? formatBillingAmount(
                        amountPreview.grossAmount
                      )
                    : "Enter valid amounts"}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <p className="text-xs text-emerald-700">
                  Estimated benefit
                </p>

                <p className="mt-1 break-words font-semibold text-emerald-800 tabular-nums [overflow-wrap:anywhere]">
                  {amountPreview
                    ? formatBillingAmount(
                        amountPreview.estimatedBenefit
                      )
                    : "—"}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <p className="text-xs text-amber-700">
                  Estimated patient responsibility
                </p>

                <p className="mt-1 break-words font-semibold text-amber-800 tabular-nums [overflow-wrap:anywhere]">
                  {amountPreview
                    ? formatBillingAmount(
                        amountPreview.patientResponsibility
                      )
                    : "—"}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This is only an internal hospital
              estimate and is not an official
              PhilHealth benefit determination.
            </p>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div className="space-y-2">
              <Label htmlFor="philhealth-claim-notes">
                Claim preparation notes
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="philhealth-claim-notes"
                rows={4}
                {...register("notes")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="philhealth-claim-created-by">
                  Created by
                </Label>

                <Input
                  id="philhealth-claim-created-by"
                  placeholder="Synthetic PhilHealth Officer"
                  {...register(
                    "createdBy"
                  )}
                />

                {errors.createdBy
                  ?.message ? (
                    <p className="text-xs font-medium text-destructive">
                      {
                        errors.createdBy
                          .message
                      }
                    </p>
                  ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-claim-role">
                  Staff role
                </Label>

                <select
                  id="philhealth-claim-role"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "actorRole"
                  )}
                >
                  {PHILHEALTH_STAFF_ROLES.map(
                    (role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {
                          PHILHEALTH_STAFF_ROLE_DEFINITIONS[
                            role
                          ].name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {PHILHEALTH_MANUAL_MODE_NOTICE}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {PHILHEALTH_DEVELOPMENT_NOTICE}
            </p>
          </div>

          {errors.root?.message ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="philhealth-claim-draft-form"
            disabled={
              isSubmitting ||
              !selectedProfile
            }
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Creating claim draft
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Create claim draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
