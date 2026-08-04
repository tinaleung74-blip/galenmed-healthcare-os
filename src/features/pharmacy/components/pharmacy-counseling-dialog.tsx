"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  LoaderCircle,
  MessageSquare,
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
  pharmacyCounselingSchema,
  type PharmacyCounselingValues,
} from "@/features/pharmacy/schemas/pharmacy-review.schema"
import type {
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"

interface PharmacyCounselingDialogProps {
  prescription:
    | PharmacyPrescription
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitCounseling: (
    values:
      PharmacyCounselingValues
  ) => Promise<void>
}

const EMPTY_COUNSELING_VALUES:
  PharmacyCounselingValues = {
  counselingCompletedBy: "",
  counselingNotes: "",
  counselingConfirmed: false,
}

export function PharmacyCounselingDialog({
  prescription,
  open,
  onOpenChange,
  onSubmitCounseling,
}: PharmacyCounselingDialogProps) {
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
    useForm<PharmacyCounselingValues>(
      {
        resolver: zodResolver(
          pharmacyCounselingSchema
        ),

        defaultValues:
          EMPTY_COUNSELING_VALUES,

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_COUNSELING_VALUES
      )
    }
  }, [open, reset])

  if (!prescription) {
    return null
  }

  async function submitCounseling(
    values:
      PharmacyCounselingValues
  ) {
    try {
      await onSubmitCounseling(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "Medication counseling could not be completed.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <MessageSquare
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Medication counseling
          </DialogTitle>

          <DialogDescription>
            {prescription.prescriptionNumber}
            {" · "}
            Record the synthetic medication
            counseling workflow.
          </DialogDescription>
        </DialogHeader>

        <form
          id="pharmacy-counseling-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitCounseling
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="pharmacy-counseling-by">
              Counseling completed by
            </Label>

            <Input
              id="pharmacy-counseling-by"
              placeholder="Synthetic Pharmacist"
              {...register(
                "counselingCompletedBy"
              )}
            />

            {errors.counselingCompletedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors
                    .counselingCompletedBy
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pharmacy-counseling-notes">
              Counseling notes
            </Label>

            <Textarea
              id="pharmacy-counseling-notes"
              rows={5}
              placeholder="Synthetic medication instructions, label review, storage, and follow-up counseling."
              {...register(
                "counselingNotes"
              )}
            />

            {errors.counselingNotes
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.counselingNotes
                    .message
                }
              </p>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-cyan-700"
              {...register(
                "counselingConfirmed"
              )}
            />

            <span className="text-sm text-cyan-900">
              I confirm that the synthetic
              medication counseling workflow
              was completed.
            </span>
          </label>

          {errors.counselingConfirmed
            ?.message ? (
            <p className="text-xs font-medium text-destructive">
              {
                errors.counselingConfirmed
                  .message
              }
            </p>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Counseling records and
              medication instructions remain
              synthetic development data.
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
            form="pharmacy-counseling-form"
            disabled={isSubmitting}
            className="bg-cyan-700 text-white hover:bg-cyan-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving counseling
              </>
            ) : (
              <>
                <MessageSquare
                  aria-hidden="true"
                />
                Complete counseling
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
