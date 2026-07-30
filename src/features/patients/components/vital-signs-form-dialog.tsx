"use client"

import {
  useEffect,
} from "react"
import {
  useForm,
  useWatch,
  type UseFormRegisterReturn,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Activity,
  ClipboardPlus,
  FilePenLine,
  LoaderCircle,
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
import {
  BLOOD_PRESSURE_POSITION_LABELS,
  OXYGEN_SUPPORT_LABELS,
  TEMPERATURE_SITE_LABELS,
  VITAL_SIGNS_CONTEXT_LABELS,
} from "@/features/patients/constants/vital-signs.constants"
import {
  vitalSignsFormSchema,
  type VitalSignsFormValues,
} from "@/features/patients/schemas/vital-signs.schema"
import {
  BLOOD_PRESSURE_POSITIONS,
  OXYGEN_SUPPORT_TYPES,
  TEMPERATURE_SITES,
  VITAL_SIGNS_MEASUREMENT_CONTEXTS,
  type VitalSignsRecord,
} from "@/features/patients/types/vital-signs.types"
import {
  calculateBmi,
  parseOptionalVitalMeasurement,
} from "@/features/patients/utils/vital-signs.utils"

export type VitalSignsFormMode =
  | "create"
  | "edit"

interface VitalSignsFormDialogProps {
  mode: VitalSignsFormMode
  record?: VitalSignsRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitRecord: (
    values: VitalSignsFormValues
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

interface VitalMeasurementFieldProps {
  id: string
  label: string
  unit?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  registration: UseFormRegisterReturn
  error?: string
}

function VitalMeasurementField({
  id,
  label,
  unit,
  placeholder,
  min,
  max,
  step = 1,
  registration,
  error,
}: VitalMeasurementFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}

        {unit ? (
          <span className="ml-1 font-normal text-muted-foreground">
            ({unit})
          </span>
        ) : null}
      </Label>

      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? errorId : undefined
        }
        {...registration}
      />

      <FieldError
        id={errorId}
        message={error}
      />
    </div>
  )
}

function getLocalDateTimeInputValue(
  value: string | Date
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const timezoneOffsetMilliseconds =
    date.getTimezoneOffset() * 60 * 1000

  return new Date(
    date.getTime() -
      timezoneOffsetMilliseconds
  )
    .toISOString()
    .slice(0, 16)
}

function numberToFormValue(
  value: number | null
): string {
  return value === null ? "" : String(value)
}

function getVitalSignsFormValues(
  mode: VitalSignsFormMode,
  record?: VitalSignsRecord | null
): VitalSignsFormValues {
  if (mode !== "edit" || !record) {
    return {
      measuredAt:
        getLocalDateTimeInputValue(new Date()),
      context: "triage",
      systolicBloodPressure: "",
      diastolicBloodPressure: "",
      bloodPressurePosition: "sitting",
      heartRate: "",
      respiratoryRate: "",
      temperatureCelsius: "",
      temperatureSite: "not-recorded",
      oxygenSaturation: "",
      oxygenSupport: "not-recorded",
      supplementalOxygenLitersPerMinute: "",
      heightCm: "",
      weightKg: "",
      painScore: "",
      notes: "",
    }
  }

  return {
    measuredAt:
      getLocalDateTimeInputValue(
        record.measuredAt
      ),
    context: record.context,
    systolicBloodPressure:
      numberToFormValue(
        record.systolicBloodPressureMmHg
      ),
    diastolicBloodPressure:
      numberToFormValue(
        record.diastolicBloodPressureMmHg
      ),
    bloodPressurePosition:
      record.bloodPressurePosition,
    heartRate:
      numberToFormValue(record.heartRateBpm),
    respiratoryRate:
      numberToFormValue(
        record.respiratoryRatePerMinute
      ),
    temperatureCelsius:
      numberToFormValue(
        record.temperatureCelsius
      ),
    temperatureSite:
      record.temperatureSite,
    oxygenSaturation:
      numberToFormValue(
        record.oxygenSaturationPercent
      ),
    oxygenSupport: record.oxygenSupport,
    supplementalOxygenLitersPerMinute:
      numberToFormValue(
        record.supplementalOxygenLitersPerMinute
      ),
    heightCm:
      numberToFormValue(record.heightCm),
    weightKg:
      numberToFormValue(record.weightKg),
    painScore:
      numberToFormValue(record.painScore),
    notes: record.notes ?? "",
  }
}

export function VitalSignsFormDialog({
  mode,
  record = null,
  open,
  onOpenChange,
  onSubmitRecord,
}: VitalSignsFormDialogProps) {
  const isEditMode = mode === "edit"
  const formId = `vital-signs-form-${mode}`

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
  } = useForm<VitalSignsFormValues>({
    resolver: zodResolver(
      vitalSignsFormSchema
    ),
    defaultValues: getVitalSignsFormValues(
      mode,
      record
    ),
    mode: "onTouched",
  })

  const heightValue = useWatch({
    control,
    name: "heightCm",
  })

  const weightValue = useWatch({
    control,
    name: "weightKg",
  })

  const bmiPreview = calculateBmi(
    parseOptionalVitalMeasurement(
      heightValue ?? ""
    ),
    parseOptionalVitalMeasurement(
      weightValue ?? ""
    )
  )

  useEffect(() => {
    if (open) {
      reset(
        getVitalSignsFormValues(mode, record)
      )
    }
  }, [mode, open, record, reset])

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen && !isSubmitting) {
      reset(
        getVitalSignsFormValues(mode, record)
      )
    }

    onOpenChange(nextOpen)
  }

  async function submitVitalSigns(
    values: VitalSignsFormValues
  ) {
    try {
      await onSubmitRecord(values)

      reset(
        getVitalSignsFormValues(mode, record)
      )

      onOpenChange(false)
    } catch {
      setError("root", {
        type: "manual",
        message: isEditMode
          ? "The vital-sign record could not be updated."
          : "The vital-sign record could not be created.",
      })
    }
  }

  const maximumMeasuredAt =
    getLocalDateTimeInputValue(new Date())

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
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
              <ClipboardPlus
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <DialogTitle>
            {isEditMode
              ? "Edit vital-sign measurement"
              : "Record vital signs"}
          </DialogTitle>

          <DialogDescription>
            Record one timestamped measurement set.
            Enter only measurements actually obtained
            during this assessment.
          </DialogDescription>

          {isEditMode && record ? (
            <p className="pt-1 text-xs text-muted-foreground">
              Originally recorded by{" "}
              {record.recordedBy}
            </p>
          ) : null}
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitVitalSigns
          )}
        >
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <div>
                <h3 className="text-sm font-semibold">
                  Measurement information
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Specify when and where the measurement
                  set was obtained.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-measured-at`}>
                  Measurement date and time
                </Label>

                <Input
                  id={`${formId}-measured-at`}
                  type="datetime-local"
                  max={maximumMeasuredAt}
                  aria-invalid={Boolean(
                    errors.measuredAt
                  )}
                  aria-describedby={
                    errors.measuredAt
                      ? `${formId}-measured-at-error`
                      : undefined
                  }
                  {...register("measuredAt")}
                />

                <FieldError
                  id={`${formId}-measured-at-error`}
                  message={
                    errors.measuredAt?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-context`}>
                  Measurement context
                </Label>

                <select
                  id={`${formId}-context`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(
                    errors.context
                  )}
                  aria-describedby={
                    errors.context
                      ? `${formId}-context-error`
                      : undefined
                  }
                  {...register("context")}
                >
                  {VITAL_SIGNS_MEASUREMENT_CONTEXTS.map(
                    (contextValue) => (
                      <option
                        key={contextValue}
                        value={contextValue}
                      >
                        {
                          VITAL_SIGNS_CONTEXT_LABELS[
                            contextValue
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  id={`${formId}-context-error`}
                  message={errors.context?.message}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Circulation and respiration
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Blood-pressure components must be entered
                together.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <VitalMeasurementField
                id={`${formId}-systolic`}
                label="Systolic blood pressure"
                unit="mmHg"
                min={1}
                max={400}
                registration={register(
                  "systolicBloodPressure"
                )}
                error={
                  errors
                    .systolicBloodPressure
                    ?.message
                }
              />

              <VitalMeasurementField
                id={`${formId}-diastolic`}
                label="Diastolic blood pressure"
                unit="mmHg"
                min={1}
                max={300}
                registration={register(
                  "diastolicBloodPressure"
                )}
                error={
                  errors
                    .diastolicBloodPressure
                    ?.message
                }
              />

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-bp-position`}
                >
                  Blood-pressure position
                </Label>

                <select
                  id={`${formId}-bp-position`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register(
                    "bloodPressurePosition"
                  )}
                >
                  {BLOOD_PRESSURE_POSITIONS.map(
                    (position) => (
                      <option
                        key={position}
                        value={position}
                      >
                        {
                          BLOOD_PRESSURE_POSITION_LABELS[
                            position
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <VitalMeasurementField
                id={`${formId}-heart-rate`}
                label="Heart rate"
                unit="bpm"
                min={1}
                max={400}
                registration={register(
                  "heartRate"
                )}
                error={errors.heartRate?.message}
              />

              <VitalMeasurementField
                id={`${formId}-respiratory-rate`}
                label="Respiratory rate"
                unit="breaths/min"
                min={1}
                max={200}
                registration={register(
                  "respiratoryRate"
                )}
                error={
                  errors.respiratoryRate?.message
                }
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Temperature and oxygenation
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Record the temperature site and oxygen
                support context whenever applicable.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <VitalMeasurementField
                id={`${formId}-temperature`}
                label="Temperature"
                unit="°C"
                min={1}
                max={60}
                step={0.1}
                registration={register(
                  "temperatureCelsius"
                )}
                error={
                  errors.temperatureCelsius
                    ?.message
                }
              />

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-temperature-site`}
                >
                  Temperature site
                </Label>

                <select
                  id={`${formId}-temperature-site`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(
                    errors.temperatureSite
                  )}
                  aria-describedby={
                    errors.temperatureSite
                      ? `${formId}-temperature-site-error`
                      : undefined
                  }
                  {...register("temperatureSite")}
                >
                  {TEMPERATURE_SITES.map(
                    (site) => (
                      <option
                        key={site}
                        value={site}
                      >
                        {
                          TEMPERATURE_SITE_LABELS[
                            site
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  id={`${formId}-temperature-site-error`}
                  message={
                    errors.temperatureSite?.message
                  }
                />
              </div>

              <VitalMeasurementField
                id={`${formId}-oxygen-saturation`}
                label="Oxygen saturation"
                unit="%"
                min={0}
                max={100}
                step={0.1}
                registration={register(
                  "oxygenSaturation"
                )}
                error={
                  errors.oxygenSaturation
                    ?.message
                }
              />

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-oxygen-support`}
                >
                  Oxygen support
                </Label>

                <select
                  id={`${formId}-oxygen-support`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(
                    errors.oxygenSupport
                  )}
                  aria-describedby={
                    errors.oxygenSupport
                      ? `${formId}-oxygen-support-error`
                      : undefined
                  }
                  {...register("oxygenSupport")}
                >
                  {OXYGEN_SUPPORT_TYPES.map(
                    (support) => (
                      <option
                        key={support}
                        value={support}
                      >
                        {
                          OXYGEN_SUPPORT_LABELS[
                            support
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  id={`${formId}-oxygen-support-error`}
                  message={
                    errors.oxygenSupport?.message
                  }
                />
              </div>

              <VitalMeasurementField
                id={`${formId}-oxygen-flow`}
                label="Supplemental oxygen flow"
                unit="L/min"
                min={0.1}
                max={100}
                step={0.1}
                registration={register(
                  "supplementalOxygenLitersPerMinute"
                )}
                error={
                  errors
                    .supplementalOxygenLitersPerMinute
                    ?.message
                }
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Anthropometrics and pain
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                BMI is automatically calculated when both
                height and weight are present.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <VitalMeasurementField
                id={`${formId}-height`}
                label="Height"
                unit="cm"
                min={1}
                max={300}
                step={0.1}
                registration={register("heightCm")}
                error={errors.heightCm?.message}
              />

              <VitalMeasurementField
                id={`${formId}-weight`}
                label="Weight"
                unit="kg"
                min={0.1}
                max={1000}
                step={0.1}
                registration={register("weightKg")}
                error={errors.weightKg?.message}
              />

              <div className="space-y-2">
                <Label>
                  Calculated BMI
                </Label>

                <div className="flex h-8 items-center rounded-lg border bg-slate-50 px-2.5 text-sm font-medium">
                  {bmiPreview === null
                    ? "Not available"
                    : `${bmiPreview} kg/m²`}
                </div>

                <p className="text-xs text-muted-foreground">
                  Derived automatically; not entered
                  manually.
                </p>
              </div>

              <VitalMeasurementField
                id={`${formId}-pain-score`}
                label="Pain score"
                unit="0–10"
                min={0}
                max={10}
                step={1}
                registration={register("painScore")}
                error={errors.painScore?.message}
              />
            </div>
          </section>

          <section className="space-y-2 border-t pt-5">
            <Label htmlFor={`${formId}-notes`}>
              Measurement notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id={`${formId}-notes`}
              rows={4}
              placeholder="Document relevant measurement context, equipment, cooperation, or limitations."
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={
                errors.notes
                  ? `${formId}-notes-error`
                  : `${formId}-notes-description`
              }
              {...register("notes")}
            />

            <p
              id={`${formId}-notes-description`}
              className="text-xs text-muted-foreground"
            >
              Use consultation notes for clinical
              assessment, diagnosis, and treatment plans.
            </p>

            <FieldError
              id={`${formId}-notes-error`}
              message={errors.notes?.message}
            />
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Automated clinical interpretation is not
              enabled in this UI phase. Measurements are
              stored as not clinically evaluated until
              configurable facility and patient-specific
              rules are implemented.
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
                  : "Recording"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save changes
              </>
            ) : (
              <>
                <ClipboardPlus aria-hidden="true" />
                Record vital signs
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
