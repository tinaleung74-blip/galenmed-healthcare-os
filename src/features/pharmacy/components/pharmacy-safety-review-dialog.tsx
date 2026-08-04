"use client"

import {
  useEffect,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
} from "react-hook-form"
import {
  LoaderCircle,
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
  PHARMACY_REVIEW_STATUS_LABELS,
} from "@/features/pharmacy/constants/pharmacy.constants"
import {
  pharmacyPrescriptionReviewSchema,
  type PharmacyPrescriptionReviewValues,
} from "@/features/pharmacy/schemas/pharmacy-review.schema"
import type {
  PharmacyPrescription,
  PharmacyReviewStatus,
} from "@/features/pharmacy/types/pharmacy.types"

interface PharmacySafetyReviewDialogProps {
  prescription:
    | PharmacyPrescription
    | null

  patientAllergySummary:
    readonly string[]

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitReview: (
    values:
      PharmacyPrescriptionReviewValues
  ) => Promise<void>
}

const reviewOptions = [
  "clear",
  "warning",
  "blocked",
  "not-applicable",
] as const

function normalizeReviewStatus(
  status:
    PharmacyReviewStatus
): PharmacyPrescriptionReviewValues["allergyReviewStatus"] {
  return status === "pending"
    ? "clear"
    : status
}

function getDefaultValues(
  prescription:
    | PharmacyPrescription
    | null
): PharmacyPrescriptionReviewValues {
  return {
    reviewedBy:
      prescription
        ?.allergyReviewBy ??
      prescription
        ?.interactionReviewBy ??
      "",

    allergyReviewStatus:
      prescription
        ? normalizeReviewStatus(
            prescription
              .allergyReviewStatus
          )
        : "clear",

    allergyReviewNotes:
      prescription
        ?.allergyReviewNotes ??
      "",

    interactionReviewStatus:
      prescription
        ? normalizeReviewStatus(
            prescription
              .interactionReviewStatus
          )
        : "clear",

    interactionReviewNotes:
      prescription
        ?.interactionReviewNotes ??
      "",
  }
}

export function PharmacySafetyReviewDialog({
  prescription,
  patientAllergySummary,
  open,
  onOpenChange,
  onSubmitReview,
}: PharmacySafetyReviewDialogProps) {
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
    useForm<PharmacyPrescriptionReviewValues>(
      {
        resolver: zodResolver(
          pharmacyPrescriptionReviewSchema
        ),

        defaultValues:
          getDefaultValues(
            prescription
          ),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(
          prescription
        )
      )
    }
  }, [
    open,
    prescription,
    reset,
  ])

  if (!prescription) {
    return null
  }

  async function submitReview(
    values:
      PharmacyPrescriptionReviewValues
  ) {
    try {
      await onSubmitReview(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The pharmacy safety review could not be saved.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <ShieldAlert
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Pharmacy safety review
          </DialogTitle>

          <DialogDescription>
            {prescription.prescriptionNumber}
            {" · "}
            Review documented allergies,
            interactions, and dispensing
            eligibility.
          </DialogDescription>
        </DialogHeader>

        <form
          id="pharmacy-safety-review-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitReview
          )}
        >
          <section className="rounded-xl border p-4">
            <h3 className="text-sm font-semibold">
              Patient allergy summary
            </h3>

            {patientAllergySummary.length ===
            0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No active allergy summary was
                supplied to this development
                review.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {patientAllergySummary.map(
                  (allergy) => (
                    <li
                      key={allergy}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                    >
                      {allergy}
                    </li>
                  )
                )}
              </ul>
            )}
          </section>

          <div className="space-y-2">
            <Label htmlFor="pharmacy-reviewed-by">
              Reviewing pharmacist
            </Label>

            <Input
              id="pharmacy-reviewed-by"
              placeholder="Synthetic Pharmacist"
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

          <section className="space-y-4 rounded-xl border p-4">
            <h3 className="text-sm font-semibold">
              Allergy review
            </h3>

            <div className="space-y-2">
              <Label htmlFor="pharmacy-allergy-review-status">
                Review decision
              </Label>

              <select
                id="pharmacy-allergy-review-status"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...register(
                  "allergyReviewStatus"
                )}
              >
                {reviewOptions.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {
                        PHARMACY_REVIEW_STATUS_LABELS[
                          status
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacy-allergy-review-notes">
                Allergy-review notes
              </Label>

              <Textarea
                id="pharmacy-allergy-review-notes"
                rows={4}
                {...register(
                  "allergyReviewNotes"
                )}
              />

              {errors.allergyReviewNotes
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors
                      .allergyReviewNotes
                      .message
                  }
                </p>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border p-4">
            <h3 className="text-sm font-semibold">
              Interaction review
            </h3>

            <div className="space-y-2">
              <Label htmlFor="pharmacy-interaction-review-status">
                Review decision
              </Label>

              <select
                id="pharmacy-interaction-review-status"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...register(
                  "interactionReviewStatus"
                )}
              >
                {reviewOptions.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {
                        PHARMACY_REVIEW_STATUS_LABELS[
                          status
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacy-interaction-review-notes">
                Interaction-review notes
              </Label>

              <Textarea
                id="pharmacy-interaction-review-notes"
                rows={4}
                {...register(
                  "interactionReviewNotes"
                )}
              />

              {errors
                .interactionReviewNotes
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors
                      .interactionReviewNotes
                      .message
                  }
                </p>
              ) : null}
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Review decisions are manual,
              synthetic development records.
              They are not automated
              medication-safety advice.
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
            form="pharmacy-safety-review-form"
            disabled={isSubmitting}
            className="bg-amber-700 text-white hover:bg-amber-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving review
              </>
            ) : (
              <>
                <ShieldCheck
                  aria-hidden="true"
                />
                Save safety review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
