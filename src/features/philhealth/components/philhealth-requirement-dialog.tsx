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
  ClipboardList,
  LoaderCircle,
  Save,
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
  PhilHealthRequirementStatusBadge,
} from "@/features/philhealth/components/philhealth-status-badges"
import {
  PHILHEALTH_REQUIREMENT_STATUS_LABELS,
  PHILHEALTH_STAFF_ROLE_DEFINITIONS,
} from "@/features/philhealth/constants/philhealth.constants"
import {
  philHealthRequirementUpdateSchema,
  type PhilHealthRequirementUpdateValues,
} from "@/features/philhealth/schemas/philhealth.schema"
import {
  PHILHEALTH_REQUIREMENT_STATUSES,
  PHILHEALTH_STAFF_ROLES,
  type PhilHealthClaim,
  type PhilHealthClaimRequirement,
} from "@/features/philhealth/types/philhealth.types"

interface PhilHealthRequirementDialogProps {
  claim:
    | PhilHealthClaim
    | null

  requirement:
    | PhilHealthClaimRequirement
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitRequirement: (
    values:
      PhilHealthRequirementUpdateValues
  ) => Promise<void>
}

function getDefaultValues({
  claim,
  requirement,
}: {
  claim:
    | PhilHealthClaim
    | null

  requirement:
    | PhilHealthClaimRequirement
    | null
}): PhilHealthRequirementUpdateValues {
  return {
    claimId:
      claim?.id ?? "",

    requirementId:
      requirement?.id ?? "",

    status:
      requirement?.status ??
      "missing",

    patientDocumentId:
      requirement
        ?.patientDocumentId ??
      "",

    remarks:
      requirement?.remarks ??
      "",

    reviewedBy: "",

    actorRole:
      "philhealth-officer",
  }
}

export function PhilHealthRequirementDialog({
  claim,
  requirement,
  open,
  onOpenChange,
  onSubmitRequirement,
}: PhilHealthRequirementDialogProps) {
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
    useForm<PhilHealthRequirementUpdateValues>(
      {
        resolver:
          zodResolver(
            philHealthRequirementUpdateSchema
          ) as Resolver<PhilHealthRequirementUpdateValues>,

        defaultValues:
          getDefaultValues({
            claim,
            requirement,
          }),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues({
          claim,
          requirement,
        })
      )
    }
  }, [
    claim,
    open,
    requirement,
    reset,
  ])

  if (
    !claim ||
    !requirement
  ) {
    return null
  }

  const availableStatuses =
    PHILHEALTH_REQUIREMENT_STATUSES.filter(
      (status) =>
        !(
          requirement.required &&
          status ===
            "not-required"
        )
    )

  async function submitRequirement(
    values:
      PhilHealthRequirementUpdateValues
  ) {
    try {
      await onSubmitRequirement(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The PhilHealth requirement could not be updated.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <ClipboardList
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Update claim requirement
          </DialogTitle>

          <DialogDescription>
            {claim.internalClaimNumber}
            {" · "}
            {requirement.label}
          </DialogDescription>

          <div className="pt-2">
            <PhilHealthRequirementStatusBadge
              status={
                requirement.status
              }
            />
          </div>
        </DialogHeader>

        <form
          id="philhealth-requirement-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitRequirement
          )}
        >
          <input
            type="hidden"
            {...register("claimId")}
          />

          <input
            type="hidden"
            {...register(
              "requirementId"
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="philhealth-requirement-status">
              Requirement status
            </Label>

            <select
              id="philhealth-requirement-status"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              {...register("status")}
            >
              {availableStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {
                      PHILHEALTH_REQUIREMENT_STATUS_LABELS[
                        status
                      ]
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="philhealth-requirement-document">
              Linked patient document ID
              <span className="ml-1 font-normal text-muted-foreground">
                Optional internal reference
              </span>
            </Label>

            <Input
              id="philhealth-requirement-document"
              autoComplete="off"
              placeholder="Synthetic internal document ID"
              {...register(
                "patientDocumentId"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="philhealth-requirement-remarks">
              Review remarks
              <span className="ml-1 font-normal text-muted-foreground">
                Required when rejected
              </span>
            </Label>

            <Textarea
              id="philhealth-requirement-remarks"
              rows={4}
              {...register("remarks")}
            />

            {errors.remarks
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.remarks
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="philhealth-requirement-reviewed-by">
                Reviewed by
              </Label>

              <Input
                id="philhealth-requirement-reviewed-by"
                placeholder="Synthetic PhilHealth Officer"
                {...register(
                  "reviewedBy"
                )}
              />

              {errors.reviewedBy
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.reviewedBy
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="philhealth-requirement-role">
                Staff role
              </Label>

              <select
                id="philhealth-requirement-role"
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
              Requirement status changes are
              retained in the PhilHealth audit
              ledger. No document is submitted
              to PhilHealth from this screen.
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
            form="philhealth-requirement-form"
            disabled={isSubmitting}
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving requirement
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save requirement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
