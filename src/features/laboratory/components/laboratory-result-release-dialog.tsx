"use client"

import {
  useEffect,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Send,
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
  laboratoryResultReleaseSchema,
  type LaboratoryResultReleaseValues,
} from "@/features/laboratory/schemas/laboratory-result.schema"
import type {
  LaboratoryResultSet,
} from "@/features/laboratory/types/laboratory-result.types"

interface LaboratoryResultReleaseDialogProps {
  resultSet:
    | LaboratoryResultSet
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitRelease: (
    values:
      LaboratoryResultReleaseValues
  ) => Promise<void>
}

export function LaboratoryResultReleaseDialog({
  resultSet,
  open,
  onOpenChange,
  onSubmitRelease,
}: LaboratoryResultReleaseDialogProps) {
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
    useForm<LaboratoryResultReleaseValues>(
      {
        resolver: zodResolver(
          laboratoryResultReleaseSchema
        ),

        defaultValues: {
          releasedBy: "",
          releaseNote: "",
          releaseConfirmed: false,
        },

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset({
        releasedBy: "",
        releaseNote: "",
        releaseConfirmed: false,
      })
    }
  }, [open, reset])

  if (!resultSet) {
    return null
  }

  async function submitRelease(
    values:
      LaboratoryResultReleaseValues
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
            : "Laboratory result release failed.",
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
            Release laboratory results
          </DialogTitle>

          <DialogDescription>
            Release the technically
            verified {resultSet.testName} result.
          </DialogDescription>
        </DialogHeader>

        <form
          id="laboratory-release-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitRelease
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="laboratory-released-by">
              Releasing laboratory
              professional
            </Label>

            <Input
              id="laboratory-released-by"
              placeholder="Synthetic Laboratory Releaser"
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

          <div className="space-y-2">
            <Label htmlFor="laboratory-release-note">
              Release note
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="laboratory-release-note"
              rows={4}
              {...register(
                "releaseNote"
              )}
            />
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
              I confirm that this
              synthetic verified result
              is ready for release.
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
              Released development results
              are read-only but are not
              real laboratory reports.
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
            form="laboratory-release-form"
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
                Release result
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
