"use client"

import {
  useEffect,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
} from "react-hook-form"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  radiologyReportReleaseSchema,
  type RadiologyReportReleaseValues,
} from "@/features/radiology/schemas/radiology-report.schema"
import type {
  RadiologyReportRecord,
} from "@/features/radiology/types/radiology-report.types"

interface RadiologyReportReleaseDialogProps {
  report:
    | RadiologyReportRecord
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitRelease: (
    values:
      RadiologyReportReleaseValues
  ) => Promise<void>
}

const EMPTY_RELEASE_VALUES:
  RadiologyReportReleaseValues = {
  releasedBy: "",
  releaseNote: "",
  releaseConfirmed: false,
}

export function RadiologyReportReleaseDialog({
  report,
  open,
  onOpenChange,
  onSubmitRelease,
}: RadiologyReportReleaseDialogProps) {
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
    useForm<RadiologyReportReleaseValues>(
      {
        resolver: zodResolver(
          radiologyReportReleaseSchema
        ),

        defaultValues:
          EMPTY_RELEASE_VALUES,

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_RELEASE_VALUES
      )
    }
  }, [open, reset])

  if (!report) {
    return null
  }

  async function submitRelease(
    values:
      RadiologyReportReleaseValues
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
            : "Final report release failed.",
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
            Release final radiology report
          </DialogTitle>

          <DialogDescription>
            Release the verified report for{" "}
            {report.procedureName}.
          </DialogDescription>
        </DialogHeader>

        <form
          id="radiology-report-release-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitRelease
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="radiology-report-released-by">
              Releasing radiology professional
            </Label>

            <Input
              id="radiology-report-released-by"
              placeholder="Synthetic Radiology Releaser"
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
            <Label htmlFor="radiology-report-release-note">
              Release note
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="radiology-report-release-note"
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
              I confirm that this synthetic
              verified report is ready for
              final release.
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
              Released development reports
              become read-only but are not
              real diagnostic reports.
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
            form="radiology-report-release-form"
            disabled={isSubmitting}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Releasing report
              </>
            ) : (
              <>
                <Send aria-hidden="true" />
                Release final report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
