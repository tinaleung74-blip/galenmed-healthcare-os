"use client"

import {
  useEffect,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
} from "react-hook-form"
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
  RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS,
} from "@/features/radiology/constants/radiology-report.constants"
import {
  radiologyReportVerificationSchema,
  type RadiologyReportVerificationValues,
} from "@/features/radiology/schemas/radiology-report.schema"
import {
  RADIOLOGY_CRITICAL_COMMUNICATION_METHODS,
  type RadiologyReportRecord,
} from "@/features/radiology/types/radiology-report.types"

interface RadiologyReportVerificationDialogProps {
  report:
    | RadiologyReportRecord
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitVerification: (
    values:
      RadiologyReportVerificationValues
  ) => Promise<void>
}

const EMPTY_VERIFICATION_VALUES:
  RadiologyReportVerificationValues = {
  verifiedBy: "",

  radiologistRegistrationNumber:
    "",

  verificationNote: "",

  criticalCommunicatedAt: "",

  criticalCommunicatedBy: "",

  criticalCommunicatedTo: "",

  criticalCommunicationMethod:
    "",

  criticalCommunicationNote: "",

  attestationAccepted: false,
}

export function RadiologyReportVerificationDialog({
  report,
  open,
  onOpenChange,
  onSubmitVerification,
}: RadiologyReportVerificationDialogProps) {
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
    useForm<RadiologyReportVerificationValues>(
      {
        resolver: zodResolver(
          radiologyReportVerificationSchema
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

  if (!report) {
    return null
  }

  const isCritical =
    report.findingLevel ===
    "critical"

  async function submitVerification(
    values:
      RadiologyReportVerificationValues
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
            : "Radiologist verification failed.",
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
            <BadgeCheck
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Radiologist verification
          </DialogTitle>

          <DialogDescription>
            Verify the report for{" "}
            {report.procedureName}.
          </DialogDescription>
        </DialogHeader>

        <form
          id="radiology-report-verification-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitVerification
          )}
        >
          {isCritical ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <ShieldAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-semibold">
                  Critical finding communication required
                </p>

                <p className="mt-1 text-xs">
                  Document who communicated
                  the finding, who received it,
                  when it occurred, and the
                  communication method.
                </p>

                <p className="mt-2 text-sm">
                  {
                    report.criticalFindingSummary
                  }
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="radiology-verified-by">
                Verifying radiologist
              </Label>

              <Input
                id="radiology-verified-by"
                placeholder="Synthetic Radiologist"
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
              <Label htmlFor="radiology-registration-number">
                Professional registration number
              </Label>

              <Input
                id="radiology-registration-number"
                placeholder="SYNTH-RAD-0001"
                {...register(
                  "radiologistRegistrationNumber"
                )}
              />

              {errors
                .radiologistRegistrationNumber
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors
                      .radiologistRegistrationNumber
                      .message
                  }
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="radiology-verification-note">
              Verification note
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="radiology-verification-note"
              rows={4}
              {...register(
                "verificationNote"
              )}
            />
          </div>

          {isCritical ? (
            <section className="space-y-4 rounded-xl border border-rose-200 p-4">
              <h3 className="text-sm font-semibold">
                Critical-finding communication
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="critical-communicated-at">
                    Communicated at
                  </Label>

                  <Input
                    id="critical-communicated-at"
                    type="datetime-local"
                    {...register(
                      "criticalCommunicatedAt"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="critical-communication-method">
                    Communication method
                  </Label>

                  <select
                    id="critical-communication-method"
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    {...register(
                      "criticalCommunicationMethod"
                    )}
                  >
                    <option value="">
                      Select method
                    </option>

                    {RADIOLOGY_CRITICAL_COMMUNICATION_METHODS.map(
                      (method) => (
                        <option
                          key={method}
                          value={method}
                        >
                          {
                            RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS[
                              method
                            ]
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="critical-communicated-by">
                    Communicated by
                  </Label>

                  <Input
                    id="critical-communicated-by"
                    placeholder="Synthetic Radiologist"
                    {...register(
                      "criticalCommunicatedBy"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="critical-communicated-to">
                    Communicated to
                  </Label>

                  <Input
                    id="critical-communicated-to"
                    placeholder="Synthetic Ordering Clinician"
                    {...register(
                      "criticalCommunicatedTo"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="critical-communication-note">
                  Communication note
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Textarea
                  id="critical-communication-note"
                  rows={3}
                  {...register(
                    "criticalCommunicationNote"
                  )}
                />
              </div>
            </section>
          ) : null}

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
              findings, impression, finding
              level, and applicable critical
              communication record.
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
            form="radiology-report-verification-form"
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
                Verify report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
