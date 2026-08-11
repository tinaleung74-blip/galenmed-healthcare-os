"use client"

import {
  useEffect,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
  type Resolver,
} from "react-hook-form"
import {
  ClipboardCheck,
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
  PHILHEALTH_ELIGIBILITY_STATUS_LABELS,
  PHILHEALTH_MANUAL_MODE_NOTICE,
  PHILHEALTH_SECURITY_NOTICE,
  PHILHEALTH_STAFF_ROLE_DEFINITIONS,
} from "@/features/philhealth/constants/philhealth.constants"
import {
  usePhilHealth,
} from "@/features/philhealth/providers/philhealth-provider"
import {
  philHealthEligibilityFormSchema,
  type PhilHealthEligibilityFormValues,
} from "@/features/philhealth/schemas/philhealth.schema"
import {
  PHILHEALTH_STAFF_ROLES,
  type PhilHealthPatientProfile,
} from "@/features/philhealth/types/philhealth.types"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface PhilHealthEligibilityDialogProps {
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

  onSubmitEligibility: (
    values:
      PhilHealthEligibilityFormValues
  ) => Promise<void>
}

const recordableStatuses = [
  "pending",
  "eligible",
  "not-eligible",
  "mismatch",
  "error",
] as const

function getDefaultValues(
  profile:
    | PhilHealthPatientProfile
    | null,

  liveIntegrationEnabled:
    boolean
): PhilHealthEligibilityFormValues {
  const currentStatus =
    profile?.eligibilityStatus

  const status =
    currentStatus &&
    currentStatus !==
      "not-checked"
      ? currentStatus
      : "pending"

  const currentSource =
    profile?.eligibilitySource

  return {
    profileId:
      profile?.id ?? "",

    status,

    source:
      liveIntegrationEnabled &&
      currentSource ===
        "integration"
        ? "integration"
        : "official-portal-manual",

    pbefReference:
      profile?.pbefReference ??
      "",

    notes:
      profile?.eligibilityNotes ??
      "",

    checkedBy: "",

    actorRole:
      "philhealth-officer",
  }
}

export function PhilHealthEligibilityDialog({
  patient,
  profile,
  open,
  onOpenChange,
  onSubmitEligibility,
}: PhilHealthEligibilityDialogProps) {
  const {
    settings,
  } = usePhilHealth()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<PhilHealthEligibilityFormValues>(
      {
        resolver:
          zodResolver(
            philHealthEligibilityFormSchema
          ) as Resolver<PhilHealthEligibilityFormValues>,

        defaultValues:
          getDefaultValues(
            profile,
            settings.liveIntegrationEnabled
          ),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(
          profile,
          settings.liveIntegrationEnabled
        )
      )
    }
  }, [
    open,
    profile,
    reset,
    settings.liveIntegrationEnabled,
  ])

  if (
    !patient ||
    !profile
  ) {
    return null
  }

  async function submitEligibility(
    values:
      PhilHealthEligibilityFormValues
  ) {
    try {
      await onSubmitEligibility(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The PhilHealth eligibility result could not be recorded.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ClipboardCheck
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Record PhilHealth eligibility
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

          <div className="pt-2">
            <PhilHealthEligibilityStatusBadge
              status={
                profile.eligibilityStatus
              }
            />
          </div>
        </DialogHeader>

        <form
          id="philhealth-eligibility-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitEligibility
          )}
        >
          <input
            type="hidden"
            {...register(
              "profileId"
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="philhealth-eligibility-status">
                Eligibility result
              </Label>

              <select
                id="philhealth-eligibility-status"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...register("status")}
              >
                {recordableStatuses.map(
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="philhealth-eligibility-source">
                Verification source
              </Label>

              <select
                id="philhealth-eligibility-source"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...register("source")}
              >
                <option value="official-portal-manual">
                  Official Portal — Manual
                </option>

                <option
                  value="integration"
                  disabled={
                    !settings.liveIntegrationEnabled
                  }
                >
                  eClaims Integration
                  {!settings.liveIntegrationEnabled
                    ? " — Not Enabled"
                    : ""}
                </option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="philhealth-pbef-reference">
                PBEF or verification reference
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="philhealth-pbef-reference"
                autoComplete="off"
                placeholder="Synthetic reference only"
                {...register(
                  "pbefReference"
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="philhealth-eligibility-notes">
                Eligibility notes
                <span className="ml-1 font-normal text-muted-foreground">
                  Required for mismatch,
                  error, or not eligible
                </span>
              </Label>

              <Textarea
                id="philhealth-eligibility-notes"
                rows={4}
                {...register("notes")}
              />

              {errors.notes?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.notes.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="philhealth-eligibility-checked-by">
                Checked by
              </Label>

              <Input
                id="philhealth-eligibility-checked-by"
                placeholder="Synthetic PhilHealth Officer"
                {...register(
                  "checkedBy"
                )}
              />

              {errors.checkedBy
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.checkedBy
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="philhealth-eligibility-role">
                Staff role
              </Label>

              <select
                id="philhealth-eligibility-role"
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
              {PHILHEALTH_SECURITY_NOTICE}
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
            form="philhealth-eligibility-form"
            disabled={isSubmitting}
            className="bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Recording eligibility
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Record eligibility
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
