"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  BadgeCheck,
  LoaderCircle,
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
  pharmacyDispensingVerificationSchema,
  type PharmacyDispensingVerificationValues,
} from "@/features/pharmacy/schemas/pharmacy-review.schema"
import type {
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"

interface PharmacyDispensingVerificationDialogProps {
  prescription:
    | PharmacyPrescription
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitVerification: (
    values:
      PharmacyDispensingVerificationValues
  ) => Promise<void>
}

const EMPTY_VERIFICATION_VALUES:
  PharmacyDispensingVerificationValues = {
  verifiedBy: "",
  verificationNotes: "",
  attestationAccepted: false,
}

export function PharmacyDispensingVerificationDialog({
  prescription,
  open,
  onOpenChange,
  onSubmitVerification,
}: PharmacyDispensingVerificationDialogProps) {
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
    useForm<PharmacyDispensingVerificationValues>(
      {
        resolver: zodResolver(
          pharmacyDispensingVerificationSchema
        ),

        defaultValues:
          EMPTY_VERIFICATION_VALUES,

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_VERIFICATION_VALUES
      )
    }
  }, [open, reset])

  if (!prescription) {
    return null
  }

  async function submitVerification(
    values:
      PharmacyDispensingVerificationValues
  ) {
    try {
      await onSubmitVerification(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "Pharmacist verification failed.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <BadgeCheck
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Pharmacist dispensing verification
          </DialogTitle>

          <DialogDescription>
            {prescription.prescriptionNumber}
            {" · "}
            Confirm that all medication
            items were completely dispensed.
          </DialogDescription>
        </DialogHeader>

        <form
          id="pharmacy-verification-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitVerification
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="pharmacy-verified-by">
              Verifying pharmacist
            </Label>

            <Input
              id="pharmacy-verified-by"
              placeholder="Synthetic Pharmacist"
              {...register(
                "verifiedBy"
              )}
            />

            {errors.verifiedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.verifiedBy
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pharmacy-verification-notes">
              Verification notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="pharmacy-verification-notes"
              rows={4}
              {...register(
                "verificationNotes"
              )}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-emerald-700"
              {...register(
                "attestationAccepted"
              )}
            />

            <span className="text-sm text-emerald-900">
              I reviewed the synthetic
              prescription, dispensed
              quantities, medication labels,
              and pharmacy inventory records.
            </span>
          </label>

          {errors.attestationAccepted
            ?.message ? (
            <p className="text-xs font-medium text-destructive">
              {
                errors.attestationAccepted
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
              This verification applies only
              to synthetic development
              prescription and inventory
              records.
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
            form="pharmacy-verification-form"
            disabled={isSubmitting}
            className="bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Verifying
              </>
            ) : (
              <>
                <BadgeCheck
                  aria-hidden="true"
                />
                Verify dispensing
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
