"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  LoaderCircle,
  Send,
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
import {
  pharmacyReleaseSchema,
  type PharmacyReleaseValues,
} from "@/features/pharmacy/schemas/pharmacy-review.schema"
import type {
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"

interface PharmacyReleaseDialogProps {
  prescription:
    | PharmacyPrescription
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitRelease: (
    values:
      PharmacyReleaseValues
  ) => Promise<void>
}

const EMPTY_RELEASE_VALUES:
  PharmacyReleaseValues = {
  releasedBy: "",
  releaseConfirmed: false,
}

export function PharmacyReleaseDialog({
  prescription,
  open,
  onOpenChange,
  onSubmitRelease,
}: PharmacyReleaseDialogProps) {
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
    useForm<PharmacyReleaseValues>({
      resolver: zodResolver(
        pharmacyReleaseSchema
      ),

      defaultValues:
        EMPTY_RELEASE_VALUES,

      mode: "onTouched",
    })

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_RELEASE_VALUES
      )
    }
  }, [open, reset])

  if (!prescription) {
    return null
  }

  async function submitRelease(
    values:
      PharmacyReleaseValues
  ) {
    try {
      await onSubmitRelease(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "Final medication release failed.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Send
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Release dispensed medication
          </DialogTitle>

          <DialogDescription>
            {prescription.prescriptionNumber}
            {" · "}
            Finalize the synthetic
            medication-release workflow.
          </DialogDescription>
        </DialogHeader>

        <form
          id="pharmacy-release-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitRelease
          )}
        >
          <div className="space-y-2">
            <label
              htmlFor="pharmacy-released-by"
              className="text-sm font-medium"
            >
              Released by
            </label>

            <Input
              id="pharmacy-released-by"
              placeholder="Synthetic Pharmacy Professional"
              {...register(
                "releasedBy"
              )}
            />

            {errors.releasedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.releasedBy
                    .message
                }
              </p>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-teal-700"
              {...register(
                "releaseConfirmed"
              )}
            />

            <span className="text-sm text-teal-900">
              I confirm that dispensing,
              pharmacist verification, and
              medication counseling were
              completed before release.
            </span>
          </label>

          {errors.releaseConfirmed
            ?.message ? (
            <p className="text-xs font-medium text-destructive">
              {
                errors.releaseConfirmed
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
              Released development
              prescriptions become read-only
              but are not real medication
              dispensing records.
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
            form="pharmacy-release-form"
            disabled={isSubmitting}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Releasing
              </>
            ) : (
              <>
                <Send aria-hidden="true" />
                Release medication
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
