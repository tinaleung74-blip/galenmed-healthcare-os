"use client"

import {
  useEffect,
  type ChangeEvent,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  FilePenLine,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  RADIOLOGY_FINDING_LEVEL_LABELS,
  RADIOLOGY_REPORT_SYNTHETIC_NOTICE,
} from "@/features/radiology/constants/radiology-report.constants"
import {
  radiologyReportFormSchema,
  type RadiologyReportFormValues,
} from "@/features/radiology/schemas/radiology-report.schema"
import {
  RADIOLOGY_FINDING_LEVELS,
  type RadiologyReportRecord,
} from "@/features/radiology/types/radiology-report.types"
import type {
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"

interface RadiologyReportFormDialogProps {
  order:
    | RadiologyOrder
    | null

  report:
    | RadiologyReportRecord
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSaveReport: (
    values: RadiologyReportFormValues
  ) => Promise<void>
}

function getDefaultValues(
  report:
    | RadiologyReportRecord
    | null
): RadiologyReportFormValues {
  return {
    draftedBy:
      report?.draftedBy ?? "",

    findings:
      report?.findings ?? "",

    impression:
      report?.impression ?? "",

    recommendation:
      report?.recommendation ?? "",

    findingLevel:
      report?.findingLevel ??
      "routine",

    criticalFindingSummary:
      report
        ?.criticalFindingSummary ??
      "",
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

export function RadiologyReportFormDialog({
  order,
  report,
  open,
  onOpenChange,
  onSaveReport,
}: RadiologyReportFormDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<RadiologyReportFormValues>(
      {
        resolver: zodResolver(
          radiologyReportFormSchema
        ),

        defaultValues:
          getDefaultValues(report),

        mode: "onTouched",
      }
    )

  const findingLevel =
    useWatch({
      control,
      name: "findingLevel",
    })

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(report)
      )
    }
  }, [
    open,
    report,
    reset,
  ])

  if (!order) {
    return null
  }

  const findingLevelRegistration =
    register("findingLevel")

  function handleFindingLevelChange(
    event:
      ChangeEvent<HTMLSelectElement>
  ) {
    findingLevelRegistration.onChange(
      event
    )

    if (
      event.target.value !==
      "critical"
    ) {
      setValue(
        "criticalFindingSummary",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      )
    }
  }

  async function submitReport(
    values:
      RadiologyReportFormValues
  ) {
    try {
      await onSaveReport(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The radiology report draft could not be saved.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <FilePenLine
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            {report
              ? "Edit radiology report draft"
              : "Create radiology report draft"}
          </DialogTitle>

          <DialogDescription>
            {order.orderNumber}
            {" · "}
            {order.procedureName}
          </DialogDescription>
        </DialogHeader>

        <form
          id="radiology-report-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitReport
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="radiology-report-drafted-by">
              Reporting radiologist or authorized reporter
            </Label>

            <input
              id="radiology-report-drafted-by"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              placeholder="Synthetic Radiologist"
              {...register("draftedBy")}
            />

            <FieldError
              message={
                errors.draftedBy?.message
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="radiology-report-findings">
              Findings
            </Label>

            <Textarea
              id="radiology-report-findings"
              rows={8}
              placeholder="Document the synthetic imaging findings."
              {...register("findings")}
            />

            <FieldError
              message={
                errors.findings?.message
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="radiology-report-impression">
              Impression
            </Label>

            <Textarea
              id="radiology-report-impression"
              rows={5}
              placeholder="Document the synthetic diagnostic impression."
              {...register("impression")}
            />

            <FieldError
              message={
                errors.impression?.message
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="radiology-report-recommendation">
              Recommendation
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="radiology-report-recommendation"
              rows={4}
              {...register(
                "recommendation"
              )}
            />

            <FieldError
              message={
                errors.recommendation
                  ?.message
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="radiology-finding-level">
              Finding level
            </Label>

            <select
              id="radiology-finding-level"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              {...findingLevelRegistration}
              onChange={
                handleFindingLevelChange
              }
            >
              {RADIOLOGY_FINDING_LEVELS.map(
                (level) => (
                  <option
                    key={level}
                    value={level}
                  >
                    {
                      RADIOLOGY_FINDING_LEVEL_LABELS[
                        level
                      ]
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {findingLevel ===
          "critical" ? (
            <section className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-2 text-rose-800">
                <ShieldAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-sm font-semibold">
                    Critical finding
                  </p>

                  <p className="mt-1 text-xs">
                    Verification will require
                    complete critical-finding
                    communication documentation.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="radiology-critical-summary">
                  Critical-finding summary
                </Label>

                <Textarea
                  id="radiology-critical-summary"
                  rows={4}
                  {...register(
                    "criticalFindingSummary"
                  )}
                />

                <FieldError
                  message={
                    errors
                      .criticalFindingSummary
                      ?.message
                  }
                />
              </div>
            </section>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {
                RADIOLOGY_REPORT_SYNTHETIC_NOTICE
              }
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
            form="radiology-report-form"
            disabled={isSubmitting}
            className="bg-amber-700 text-white hover:bg-amber-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving report
              </>
            ) : (
              <>
                <Save aria-hidden="true" />
                Save report draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
