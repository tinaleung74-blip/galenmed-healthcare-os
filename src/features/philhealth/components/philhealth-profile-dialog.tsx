"use client"

import {
  useEffect,
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
  IdCard,
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
import {
  PhilHealthEligibilityStatusBadge,
} from "@/features/philhealth/components/philhealth-status-badges"
import {
  PHILHEALTH_DEVELOPMENT_NOTICE,
  PHILHEALTH_MEMBER_RELATIONSHIP_LABELS,
  PHILHEALTH_SECURITY_NOTICE,
  PHILHEALTH_STAFF_ROLE_DEFINITIONS,
} from "@/features/philhealth/constants/philhealth.constants"
import {
  philHealthProfileFormSchema,
  type PhilHealthProfileFormValues,
} from "@/features/philhealth/schemas/philhealth.schema"
import {
  PHILHEALTH_MEMBER_RELATIONSHIPS,
  PHILHEALTH_STAFF_ROLES,
  type PhilHealthPatientProfile,
} from "@/features/philhealth/types/philhealth.types"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface PhilHealthProfileDialogProps {
  patient:
    | Patient
    | null

  profile:
    | PhilHealthPatientProfile
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitProfile: (
    values:
      PhilHealthProfileFormValues
  ) => Promise<void>
}

function getDefaultValues({
  patient,
  profile,
}: {
  patient:
    | Patient
    | null

  profile:
    | PhilHealthPatientProfile
    | null
}): PhilHealthProfileFormValues {
  return {
    patientId:
      patient?.id ?? "",

    philHealthIdentificationNumber:
      profile
        ?.philHealthIdentificationNumber ??
      "",

    memberRelationship:
      profile?.memberRelationship ??
      "member",

    principalMemberName:
      profile?.principalMemberName ??
      "",

    principalMemberPin:
      profile?.principalMemberPin ??
      "",

    membershipCategory:
      profile?.membershipCategory ??
      "",

    consentAcknowledged:
      Boolean(
        profile
          ?.consentAcknowledgedAt
      ),

    consentAcknowledgedBy:
      profile
        ?.consentAcknowledgedBy ??
      "",

    updatedBy: "",

    actorRole:
      "philhealth-officer",
  }
}

function FieldError({
  message,
}: {
  message?: string
}) {
  if (!message) {
    return null
  }

  return (
    <p
      role="alert"
      className="text-xs font-medium text-destructive"
    >
      {message}
    </p>
  )
}

export function PhilHealthProfileDialog({
  patient,
  profile,
  open,
  onOpenChange,
  onSubmitProfile,
}: PhilHealthProfileDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<PhilHealthProfileFormValues>(
      {
        resolver:
          zodResolver(
            philHealthProfileFormSchema
          ) as Resolver<PhilHealthProfileFormValues>,

        defaultValues:
          getDefaultValues({
            patient,
            profile,
          }),

        mode: "onTouched",
      }
    )

  const memberRelationship =
    useWatch({
      control,
      name:
        "memberRelationship",
    })

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues({
          patient,
          profile,
        })
      )
    }
  }, [
    open,
    patient,
    profile,
    reset,
  ])

  if (!patient) {
    return null
  }

  const isPrincipalMember =
    memberRelationship ===
    "member"

  async function submitProfile(
    values:
      PhilHealthProfileFormValues
  ) {
    try {
      await onSubmitProfile(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The patient PhilHealth profile could not be saved.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <IdCard
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            {profile
              ? "Edit patient PhilHealth profile"
              : "Create patient PhilHealth profile"}
          </DialogTitle>

          <DialogDescription>
            {getPatientFullName(
              patient
            )}
            {" · "}
            {
              patient.medicalRecordNumber
            }
          </DialogDescription>

          {profile ? (
            <div className="pt-2">
              <PhilHealthEligibilityStatusBadge
                status={
                  profile.eligibilityStatus
                }
              />
            </div>
          ) : null}
        </DialogHeader>

        <form
          id="philhealth-profile-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitProfile
          )}
        >
          <input
            type="hidden"
            {...register(
              "patientId"
            )}
          />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Member information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="philhealth-member-relationship">
                  Patient relationship
                </Label>

                <select
                  id="philhealth-member-relationship"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "memberRelationship"
                  )}
                >
                  {PHILHEALTH_MEMBER_RELATIONSHIPS.map(
                    (
                      relationship
                    ) => (
                      <option
                        key={
                          relationship
                        }
                        value={
                          relationship
                        }
                      >
                        {
                          PHILHEALTH_MEMBER_RELATIONSHIP_LABELS[
                            relationship
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-patient-pin">
                  Patient PhilHealth PIN
                  {!isPrincipalMember ? (
                    <span className="ml-1 font-normal text-muted-foreground">
                      Optional
                    </span>
                  ) : null}
                </Label>

                <Input
                  id="philhealth-patient-pin"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Synthetic 12-digit PIN"
                  {...register(
                    "philHealthIdentificationNumber"
                  )}
                />

                <FieldError
                  message={
                    errors
                      .philHealthIdentificationNumber
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="philhealth-membership-category">
                  Membership category
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id="philhealth-membership-category"
                  placeholder="Example: Formal Economy"
                  {...register(
                    "membershipCategory"
                  )}
                />
              </div>
            </div>
          </section>

          {!isPrincipalMember ? (
            <section className="space-y-4 border-t pt-5">
              <h3 className="text-sm font-semibold">
                Principal member
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="philhealth-principal-name">
                    Principal member name
                  </Label>

                  <Input
                    id="philhealth-principal-name"
                    {...register(
                      "principalMemberName"
                    )}
                  />

                  <FieldError
                    message={
                      errors
                        .principalMemberName
                        ?.message
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="philhealth-principal-pin">
                    Principal member PIN
                  </Label>

                  <Input
                    id="philhealth-principal-pin"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Synthetic 12-digit PIN"
                    {...register(
                      "principalMemberPin"
                    )}
                  />

                  <FieldError
                    message={
                      errors
                        .principalMemberPin
                        ?.message
                    }
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Consent and responsible staff
            </h3>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-sky-700"
                {...register(
                  "consentAcknowledged"
                )}
              />

              <span className="text-sm text-sky-900">
                Patient consent or authorized
                representative acknowledgement
                was obtained for processing
                hospital PhilHealth information.
              </span>
            </label>

            <FieldError
              message={
                errors
                  .consentAcknowledged
                  ?.message
              }
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="philhealth-consent-by">
                  Consent acknowledged by
                </Label>

                <Input
                  id="philhealth-consent-by"
                  placeholder="Synthetic Admission Staff"
                  {...register(
                    "consentAcknowledgedBy"
                  )}
                />

                <FieldError
                  message={
                    errors
                      .consentAcknowledgedBy
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-profile-updated-by">
                  Saved by
                </Label>

                <Input
                  id="philhealth-profile-updated-by"
                  placeholder="Synthetic PhilHealth Officer"
                  {...register(
                    "updatedBy"
                  )}
                />

                <FieldError
                  message={
                    errors.updatedBy
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="philhealth-profile-actor-role">
                  Staff role
                </Label>

                <select
                  id="philhealth-profile-actor-role"
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
            form="philhealth-profile-form"
            disabled={isSubmitting}
            className="bg-sky-700 text-white hover:bg-sky-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving profile
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save PhilHealth profile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
