"use client"

import {
  useEffect,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  BadgeCheck,
  LoaderCircle,
  ShieldAlert,
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
  laboratoryResultVerificationSchema,
  type LaboratoryResultVerificationValues,
} from "@/features/laboratory/schemas/laboratory-result.schema"
import type {
  LaboratoryResultSet,
} from "@/features/laboratory/types/laboratory-result.types"

interface LaboratoryResultVerificationDialogProps {
  resultSet:
    | LaboratoryResultSet
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitVerification: (
    values:
      LaboratoryResultVerificationValues
  ) => Promise<void>
}

export function LaboratoryResultVerificationDialog({
  resultSet,
  open,
  onOpenChange,
  onSubmitVerification,
}: LaboratoryResultVerificationDialogProps) {
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
    useForm<LaboratoryResultVerificationValues>(
      {
        resolver: zodResolver(
          laboratoryResultVerificationSchema
        ),

        defaultValues: {
          verifiedBy: "",
          verificationNote: "",
          attestationAccepted: false,
        },

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset({
        verifiedBy: "",
        verificationNote: "",
        attestationAccepted: false,
      })
    }
  }, [open, reset])

  if (!resultSet) {
    return null
  }

  const criticalCount =
    resultSet.entries.filter(
      (entry) =>
        entry.flag ===
          "critical-low" ||
        entry.flag ===
          "critical-high"
    ).length

  async function submitVerification(
    values:
      LaboratoryResultVerificationValues
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
            : "Technical verification failed.",
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
            Technical verification
          </DialogTitle>

          <DialogDescription>
            Review and verify{" "}
            {resultSet.testName}.
          </DialogDescription>
        </DialogHeader>

        <form
          id="laboratory-verification-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitVerification
          )}
        >
          {criticalCount > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <ShieldAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                {criticalCount} critical
                result
                {criticalCount === 1
                  ? ""
                  : "s"}{" "}
                require documented review.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="laboratory-verified-by">
              Verifying laboratory
              professional
            </Label>

            <Input
              id="laboratory-verified-by"
              placeholder="Synthetic Laboratory Verifier"
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
            <Label htmlFor="laboratory-verification-note">
              Verification note
              <span className="ml-1 font-normal text-muted-foreground">
                {criticalCount > 0
                  ? "Required"
                  : "Optional"}
              </span>
            </Label>

            <Textarea
              id="laboratory-verification-note"
              rows={4}
              {...register(
                "verificationNote"
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
              result values, flags, and
              configured reference ranges.
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
            form="laboratory-verification-form"
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
                Verify results
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
