"use client"

import {
  useEffect,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  FilePenLine,
  LoaderCircle,
  Pill,
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
import { ConsultationPrescriptionAllergyPanel } from "@/features/consultations/components/consultation-prescription-allergy-panel"
import {
  CONSULTATION_ALLERGY_REVIEW_STATUS_LABELS,
  CONSULTATION_MEDICATION_DOSE_UNIT_LABELS,
  CONSULTATION_MEDICATION_DURATION_UNIT_LABELS,
  CONSULTATION_MEDICATION_FREQUENCY_LABELS,
  CONSULTATION_MEDICATION_ROUTE_LABELS,
} from "@/features/consultations/constants/consultation-prescription.constants"
import {
  consultationPrescriptionFormSchema,
  type ConsultationPrescriptionFormValues,
} from "@/features/consultations/schemas/consultation-prescription.schema"
import {
  CONSULTATION_ALLERGY_REVIEW_STATUSES,
  CONSULTATION_MEDICATION_DOSE_UNITS,
  CONSULTATION_MEDICATION_DURATION_UNITS,
  CONSULTATION_MEDICATION_FREQUENCIES,
  CONSULTATION_MEDICATION_ROUTES,
  type ConsultationPrescriptionRecord,
} from "@/features/consultations/types/consultation-prescription.types"

export type ConsultationPrescriptionFormMode =
  | "create"
  | "edit"

interface ConsultationPrescriptionFormDialogProps {
  mode: ConsultationPrescriptionFormMode
  patientId: string
  record?:
    | ConsultationPrescriptionRecord
    | null
  open: boolean
  onOpenChange: (open: boolean) => void

  onSubmitRecord: (
    values:
      ConsultationPrescriptionFormValues
  ) => Promise<void>
}

interface FieldErrorProps {
  id: string
  message?: string
}

function FieldError({
  id,
  message,
}: FieldErrorProps) {
  if (!message) {
    return null
  }

  return (
    <p
      id={id}
      role="alert"
      className="text-xs font-medium text-destructive"
    >
      {message}
    </p>
  )
}

function getLocalDateInputValue(
  date: Date
): string {
  const timezoneOffsetMilliseconds =
    date.getTimezoneOffset() * 60 * 1000

  return new Date(
    date.getTime() -
      timezoneOffsetMilliseconds
  )
    .toISOString()
    .slice(0, 10)
}

function numberToFormValue(
  value: number | null
): string {
  return value === null
    ? ""
    : String(value)
}

function getPrescriptionFormValues(
  mode: ConsultationPrescriptionFormMode,
  record?:
    | ConsultationPrescriptionRecord
    | null
): ConsultationPrescriptionFormValues {
  if (mode !== "edit" || !record) {
    return {
      medicationName: "",
      strength: "",
      doseAmount: "",
      doseUnit: "tablet",
      route: "oral",
      frequency: "once-daily",
      frequencyDetails: "",
      durationValue: "",
      durationUnit: "days",
      quantity: "",
      quantityUnit: "tablet(s)",
      refillsAllowed: "0",
      startDate:
        getLocalDateInputValue(new Date()),
      endDate: "",
      indication: "",
      patientInstructions: "",
      prescriberNotes: "",
      substitutionAllowed: true,
      allergyReviewStatus:
        "not-reviewed",
      allergyWarningNote: "",
    }
  }

  return {
    medicationName:
      record.medicationName,

    strength:
      record.strength ?? "",

    doseAmount:
      String(record.doseAmount),

    doseUnit:
      record.doseUnit,

    route:
      record.route,

    frequency:
      record.frequency,

    frequencyDetails:
      record.frequencyDetails ?? "",

    durationValue:
      numberToFormValue(
        record.durationValue
      ),

    durationUnit:
      record.durationUnit,

    quantity:
      String(record.quantity),

    quantityUnit:
      record.quantityUnit,

    refillsAllowed:
      String(record.refillsAllowed),

    startDate:
      record.startDate,

    endDate:
      record.endDate ?? "",

    indication:
      record.indication,

    patientInstructions:
      record.patientInstructions,

    prescriberNotes:
      record.prescriberNotes ?? "",

    substitutionAllowed:
      record.substitutionAllowed,

    allergyReviewStatus:
      record.allergyReviewStatus,

    allergyWarningNote:
      record.allergyWarningNote ?? "",
  }
}

export function ConsultationPrescriptionFormDialog({
  mode,
  patientId,
  record = null,
  open,
  onOpenChange,
  onSubmitRecord,
}: ConsultationPrescriptionFormDialogProps) {
  const isEditMode = mode === "edit"

  const formId =
    `consultation-prescription-form-${mode}`

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<ConsultationPrescriptionFormValues>(
      {
        resolver: zodResolver(
          consultationPrescriptionFormSchema
        ),

        defaultValues:
          getPrescriptionFormValues(
            mode,
            record
          ),

        mode: "onTouched",
      }
    )

  const frequency = useWatch({
    control,
    name: "frequency",
  })

  const durationUnit = useWatch({
    control,
    name: "durationUnit",
  })

  const allergyReviewStatus =
    useWatch({
      control,
      name: "allergyReviewStatus",
    })

  useEffect(() => {
    if (open) {
      reset(
        getPrescriptionFormValues(
          mode,
          record
        )
      )
    }
  }, [mode, open, record, reset])

  const formTitle = useMemo(
    () =>
      isEditMode
        ? "Edit prescription draft"
        : "Add prescription draft",
    [isEditMode]
  )

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (
      !nextOpen &&
      !isSubmitting
    ) {
      reset(
        getPrescriptionFormValues(
          mode,
          record
        )
      )
    }

    onOpenChange(nextOpen)
  }

  async function submitPrescription(
    values:
      ConsultationPrescriptionFormValues
  ) {
    try {
      await onSubmitRecord(values)

      reset(
        getPrescriptionFormValues(
          mode,
          record
        )
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : isEditMode
              ? "The prescription draft could not be updated."
              : "The prescription draft could not be added.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleDialogOpenChange
      }
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            {isEditMode ? (
              <FilePenLine
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <Pill
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <DialogTitle>
            {formTitle}
          </DialogTitle>

          <DialogDescription>
            Record a structured medication order
            draft. Saving does not dispense,
            activate, or electronically transmit
            the prescription.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitPrescription
          )}
        >
          <ConsultationPrescriptionAllergyPanel
            patientId={patientId}
          />

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Medication
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Enter only the medication order
                documented by the authorized
                prescriber.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-medication`}
                >
                  Medication name
                </Label>

                <Input
                  id={`${formId}-medication`}
                  placeholder="Enter medication name"
                  aria-invalid={Boolean(
                    errors.medicationName
                  )}
                  aria-describedby={
                    errors.medicationName
                      ? `${formId}-medication-error`
                      : undefined
                  }
                  {...register(
                    "medicationName"
                  )}
                />

                <FieldError
                  id={`${formId}-medication-error`}
                  message={
                    errors.medicationName
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-strength`}
                >
                  Strength
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-strength`}
                  placeholder="Example: 500 mg tablet"
                  aria-invalid={Boolean(
                    errors.strength
                  )}
                  {...register("strength")}
                />

                <FieldError
                  id={`${formId}-strength-error`}
                  message={
                    errors.strength?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Dose and route
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-dose`}
                >
                  Dose amount
                </Label>

                <Input
                  id={`${formId}-dose`}
                  type="number"
                  min={0.01}
                  step={0.01}
                  inputMode="decimal"
                  aria-invalid={Boolean(
                    errors.doseAmount
                  )}
                  {...register("doseAmount")}
                />

                <FieldError
                  id={`${formId}-dose-error`}
                  message={
                    errors.doseAmount?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-dose-unit`}
                >
                  Dose unit
                </Label>

                <select
                  id={`${formId}-dose-unit`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("doseUnit")}
                >
                  {CONSULTATION_MEDICATION_DOSE_UNITS.map(
                    (unit) => (
                      <option
                        key={unit}
                        value={unit}
                      >
                        {
                          CONSULTATION_MEDICATION_DOSE_UNIT_LABELS[
                            unit
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-route`}
                >
                  Route
                </Label>

                <select
                  id={`${formId}-route`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("route")}
                >
                  {CONSULTATION_MEDICATION_ROUTES.map(
                    (route) => (
                      <option
                        key={route}
                        value={route}
                      >
                        {
                          CONSULTATION_MEDICATION_ROUTE_LABELS[
                            route
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-frequency`}
                >
                  Frequency
                </Label>

                <select
                  id={`${formId}-frequency`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("frequency")}
                >
                  {CONSULTATION_MEDICATION_FREQUENCIES.map(
                    (frequencyValue) => (
                      <option
                        key={frequencyValue}
                        value={frequencyValue}
                      >
                        {
                          CONSULTATION_MEDICATION_FREQUENCY_LABELS[
                            frequencyValue
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-frequency-details`}
              >
                Frequency details
                <span className="ml-1 font-normal text-muted-foreground">
                  {frequency === "custom"
                    ? "Required"
                    : "Optional"}
                </span>
              </Label>

              <Input
                id={`${formId}-frequency-details`}
                placeholder="Additional schedule or as-needed instructions"
                aria-invalid={Boolean(
                  errors.frequencyDetails
                )}
                {...register(
                  "frequencyDetails"
                )}
              />

              <FieldError
                id={`${formId}-frequency-details-error`}
                message={
                  errors.frequencyDetails
                    ?.message
                }
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Duration and quantity
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-duration`}
                >
                  Duration
                  <span className="ml-1 font-normal text-muted-foreground">
                    {durationUnit === "ongoing"
                      ? "Leave blank"
                      : "Required"}
                  </span>
                </Label>

                <Input
                  id={`${formId}-duration`}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  aria-invalid={Boolean(
                    errors.durationValue
                  )}
                  {...register(
                    "durationValue"
                  )}
                />

                <FieldError
                  id={`${formId}-duration-error`}
                  message={
                    errors.durationValue
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-duration-unit`}
                >
                  Duration unit
                </Label>

                <select
                  id={`${formId}-duration-unit`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register(
                    "durationUnit"
                  )}
                >
                  {CONSULTATION_MEDICATION_DURATION_UNITS.map(
                    (unit) => (
                      <option
                        key={unit}
                        value={unit}
                      >
                        {
                          CONSULTATION_MEDICATION_DURATION_UNIT_LABELS[
                            unit
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-quantity`}
                >
                  Quantity
                </Label>

                <Input
                  id={`${formId}-quantity`}
                  type="number"
                  min={0.01}
                  step={0.01}
                  inputMode="decimal"
                  aria-invalid={Boolean(
                    errors.quantity
                  )}
                  {...register("quantity")}
                />

                <FieldError
                  id={`${formId}-quantity-error`}
                  message={
                    errors.quantity?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-quantity-unit`}
                >
                  Quantity unit
                </Label>

                <Input
                  id={`${formId}-quantity-unit`}
                  placeholder="Example: tablet(s)"
                  aria-invalid={Boolean(
                    errors.quantityUnit
                  )}
                  {...register(
                    "quantityUnit"
                  )}
                />

                <FieldError
                  id={`${formId}-quantity-unit-error`}
                  message={
                    errors.quantityUnit
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-refills`}
                >
                  Refills allowed
                </Label>

                <Input
                  id={`${formId}-refills`}
                  type="number"
                  min={0}
                  max={12}
                  step={1}
                  inputMode="numeric"
                  aria-invalid={Boolean(
                    errors.refillsAllowed
                  )}
                  {...register(
                    "refillsAllowed"
                  )}
                />

                <FieldError
                  id={`${formId}-refills-error`}
                  message={
                    errors.refillsAllowed
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-start-date`}
                >
                  Start date
                </Label>

                <Input
                  id={`${formId}-start-date`}
                  type="date"
                  aria-invalid={Boolean(
                    errors.startDate
                  )}
                  {...register("startDate")}
                />

                <FieldError
                  id={`${formId}-start-date-error`}
                  message={
                    errors.startDate?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-end-date`}
                >
                  End date
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-end-date`}
                  type="date"
                  aria-invalid={Boolean(
                    errors.endDate
                  )}
                  {...register("endDate")}
                />

                <FieldError
                  id={`${formId}-end-date-error`}
                  message={
                    errors.endDate?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-indication`}
              >
                Indication
              </Label>

              <Textarea
                id={`${formId}-indication`}
                rows={3}
                placeholder="Document the indication for this medication order."
                aria-invalid={Boolean(
                  errors.indication
                )}
                {...register("indication")}
              />

              <FieldError
                id={`${formId}-indication-error`}
                message={
                  errors.indication?.message
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-instructions`}
              >
                Patient instructions
              </Label>

              <Textarea
                id={`${formId}-instructions`}
                rows={4}
                placeholder="Enter the instructions intended for the patient."
                aria-invalid={Boolean(
                  errors.patientInstructions
                )}
                {...register(
                  "patientInstructions"
                )}
              />

              <FieldError
                id={`${formId}-instructions-error`}
                message={
                  errors.patientInstructions
                    ?.message
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-prescriber-notes`}
              >
                Prescriber notes
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id={`${formId}-prescriber-notes`}
                rows={3}
                {...register(
                  "prescriberNotes"
                )}
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Allergy review
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Record the prescriber&apos;s manual
                allergy review decision.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-allergy-review`}
                >
                  Review status
                </Label>

                <select
                  id={`${formId}-allergy-review`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register(
                    "allergyReviewStatus"
                  )}
                >
                  {CONSULTATION_ALLERGY_REVIEW_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          CONSULTATION_ALLERGY_REVIEW_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-allergy-warning`}
                >
                  Allergy review note
                  <span className="ml-1 font-normal text-muted-foreground">
                    {allergyReviewStatus ===
                    "reviewed-with-warning"
                      ? "Required"
                      : "Optional"}
                  </span>
                </Label>

                <Input
                  id={`${formId}-allergy-warning`}
                  placeholder="Document warning and clinical decision"
                  aria-invalid={Boolean(
                    errors.allergyWarningNote
                  )}
                  {...register(
                    "allergyWarningNote"
                  )}
                />

                <FieldError
                  id={`${formId}-allergy-warning-error`}
                  message={
                    errors.allergyWarningNote
                      ?.message
                  }
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-teal-700"
                {...register(
                  "substitutionAllowed"
                )}
              />

              <span>
                <span className="block text-sm font-medium">
                  Substitution allowed
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  This development flag does not
                  authorize dispensing or substitution.
                </span>
              </span>
            </label>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This is a draft medication order. It
              is not signed, transmitted, dispensed,
              or connected to pharmacy inventory.
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
              handleDialogOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />

                {isEditMode
                  ? "Saving changes"
                  : "Adding draft"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save changes
              </>
            ) : (
              <>
                <Pill aria-hidden="true" />
                Add prescription draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
