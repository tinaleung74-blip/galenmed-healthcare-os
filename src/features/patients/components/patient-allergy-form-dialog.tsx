"use client"

import {
  useEffect,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ALLERGY_CATEGORY_LABELS,
  ALLERGY_CLINICAL_STATUS_LABELS,
  ALLERGY_CRITICALITY_LABELS,
  ALLERGY_INFORMATION_SOURCE_LABELS,
  ALLERGY_INTOLERANCE_TYPE_LABELS,
  ALLERGY_REACTION_SEVERITY_LABELS,
  ALLERGY_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-allergy.constants"
import {
  patientAllergyFormSchema,
  type PatientAllergyFormValues,
} from "@/features/patients/schemas/patient-allergy.schema"
import {
  ALLERGY_CATEGORIES,
  ALLERGY_CLINICAL_STATUSES,
  ALLERGY_CRITICALITIES,
  ALLERGY_INFORMATION_SOURCES,
  ALLERGY_INTOLERANCE_TYPES,
  ALLERGY_REACTION_SEVERITIES,
  ALLERGY_VERIFICATION_STATUSES,
  type PatientAllergyRecord,
} from "@/features/patients/types/patient-allergy.types"

export type PatientAllergyFormMode =
  | "create"
  | "edit"

interface PatientAllergyFormDialogProps {
  mode: PatientAllergyFormMode
  record?: PatientAllergyRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitRecord: (
    values: PatientAllergyFormValues
  ) => Promise<void>
}

const EMPTY_ALLERGY_FORM_VALUES: PatientAllergyFormValues =
  {
    allergenName: "",
    allergenCode: "",
    codeSystem: "",
    type: "allergy",
    category: "medication",
    clinicalStatus: "active",
    verificationStatus: "unconfirmed",
    criticality: "unable-to-assess",
    onsetDate: "",
    lastOccurrenceDate: "",
    reactionManifestations: "",
    reactionSeverity: "",
    exposureRoute: "",
    source: "patient",
    sourceDetails: "",
    notes: "",
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
    date.getTime() - timezoneOffsetMilliseconds
  )
    .toISOString()
    .slice(0, 10)
}

function getAllergyFormValues(
  mode: PatientAllergyFormMode,
  record?: PatientAllergyRecord | null
): PatientAllergyFormValues {
  if (mode !== "edit" || !record) {
    return EMPTY_ALLERGY_FORM_VALUES
  }

  return {
    allergenName: record.allergenName,
    allergenCode: record.allergenCode ?? "",
    codeSystem: record.codeSystem ?? "",
    type: record.type,
    category: record.category,
    clinicalStatus: record.clinicalStatus,
    verificationStatus:
      record.verificationStatus,
    criticality: record.criticality,
    onsetDate: record.onsetDate ?? "",
    lastOccurrenceDate:
      record.lastOccurrenceDate ?? "",
    reactionManifestations:
      record.reactionManifestations.join(", "),
    reactionSeverity:
      record.reactionSeverity ?? "",
    exposureRoute: record.exposureRoute ?? "",
    source: record.source,
    sourceDetails: record.sourceDetails ?? "",
    notes: record.notes ?? "",
  }
}

export function PatientAllergyFormDialog({
  mode,
  record = null,
  open,
  onOpenChange,
  onSubmitRecord,
}: PatientAllergyFormDialogProps) {
  const isEditMode = mode === "edit"
  const formId = `patient-allergy-form-${mode}`

  const maximumHistoryDate = useMemo(
    () => getLocalDateInputValue(new Date()),
    []
  )

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<PatientAllergyFormValues>({
    resolver: zodResolver(
      patientAllergyFormSchema
    ),
    defaultValues: getAllergyFormValues(
      mode,
      record
    ),
    mode: "onTouched",
  })

  useEffect(() => {
    if (open) {
      reset(getAllergyFormValues(mode, record))
    }
  }, [mode, open, record, reset])

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen && !isSubmitting) {
      reset(getAllergyFormValues(mode, record))
    }

    onOpenChange(nextOpen)
  }

  async function submitAllergyRecord(
    values: PatientAllergyFormValues
  ) {
    try {
      await onSubmitRecord(values)
      reset(getAllergyFormValues(mode, record))
      onOpenChange(false)
    } catch {
      setError("root", {
        type: "manual",
        message: isEditMode
          ? "The allergy record could not be updated."
          : "The allergy record could not be created.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            {isEditMode ? (
              <FilePenLine
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <ShieldAlert
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <DialogTitle>
            {isEditMode
              ? "Edit allergy record"
              : "Add allergy or intolerance"}
          </DialogTitle>

          <DialogDescription>
            Record the substance, reaction, verification,
            source, and clinical status. Do not infer an
            allergy from an unrelated symptom or medication
            side effect.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitAllergyRecord
          )}
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Allergen information
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Identify the substance and its allergy or
                intolerance classification.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`${formId}-allergen-name`}>
                  Allergen or substance
                </Label>

                <Input
                  id={`${formId}-allergen-name`}
                  placeholder="Example: Penicillin"
                  aria-invalid={Boolean(
                    errors.allergenName
                  )}
                  aria-describedby={
                    errors.allergenName
                      ? `${formId}-allergen-name-error`
                      : undefined
                  }
                  {...register("allergenName")}
                />

                <FieldError
                  id={`${formId}-allergen-name-error`}
                  message={
                    errors.allergenName?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-type`}>
                  Record type
                </Label>

                <select
                  id={`${formId}-type`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("type")}
                >
                  {ALLERGY_INTOLERANCE_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {
                          ALLERGY_INTOLERANCE_TYPE_LABELS[
                            type
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-category`}>
                  Category
                </Label>

                <select
                  id={`${formId}-category`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("category")}
                >
                  {ALLERGY_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {
                          ALLERGY_CATEGORY_LABELS[
                            category
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-clinical-status`}
                >
                  Clinical status
                </Label>

                <select
                  id={`${formId}-clinical-status`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("clinicalStatus")}
                >
                  {ALLERGY_CLINICAL_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          ALLERGY_CLINICAL_STATUS_LABELS[
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
                  htmlFor={`${formId}-verification-status`}
                >
                  Verification status
                </Label>

                <select
                  id={`${formId}-verification-status`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register(
                    "verificationStatus"
                  )}
                >
                  {ALLERGY_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          ALLERGY_VERIFICATION_STATUS_LABELS[
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
                  htmlFor={`${formId}-criticality`}
                >
                  Criticality
                </Label>

                <select
                  id={`${formId}-criticality`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("criticality")}
                >
                  {ALLERGY_CRITICALITIES.map(
                    (criticality) => (
                      <option
                        key={criticality}
                        value={criticality}
                      >
                        {
                          ALLERGY_CRITICALITY_LABELS[
                            criticality
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Optional coded identification
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Store a terminology code only when it is
                available from a supported clinical source.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-allergen-code`}>
                  Allergen code
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-allergen-code`}
                  placeholder="Terminology code"
                  aria-invalid={Boolean(
                    errors.allergenCode
                  )}
                  aria-describedby={
                    errors.allergenCode
                      ? `${formId}-allergen-code-error`
                      : undefined
                  }
                  {...register("allergenCode")}
                />

                <FieldError
                  id={`${formId}-allergen-code-error`}
                  message={
                    errors.allergenCode?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-code-system`}>
                  Code system
                  <span className="ml-1 font-normal text-muted-foreground">
                    Required when coded
                  </span>
                </Label>

                <Input
                  id={`${formId}-code-system`}
                  placeholder="Example: SNOMED CT"
                  aria-invalid={Boolean(
                    errors.codeSystem
                  )}
                  aria-describedby={
                    errors.codeSystem
                      ? `${formId}-code-system-error`
                      : undefined
                  }
                  {...register("codeSystem")}
                />

                <FieldError
                  id={`${formId}-code-system-error`}
                  message={errors.codeSystem?.message}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Reaction information
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Separate multiple reaction manifestations
                using commas or new lines.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor={`${formId}-manifestations`}
                >
                  Reaction manifestations
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Textarea
                  id={`${formId}-manifestations`}
                  rows={3}
                  placeholder="Example: Hives, facial swelling"
                  aria-invalid={Boolean(
                    errors.reactionManifestations
                  )}
                  aria-describedby={
                    errors.reactionManifestations
                      ? `${formId}-manifestations-error`
                      : undefined
                  }
                  {...register(
                    "reactionManifestations"
                  )}
                />

                <FieldError
                  id={`${formId}-manifestations-error`}
                  message={
                    errors.reactionManifestations
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-reaction-severity`}
                >
                  Reaction severity
                </Label>

                <select
                  id={`${formId}-reaction-severity`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("reactionSeverity")}
                >
                  <option value="">
                    Not recorded
                  </option>

                  {ALLERGY_REACTION_SEVERITIES.map(
                    (severity) => (
                      <option
                        key={severity}
                        value={severity}
                      >
                        {
                          ALLERGY_REACTION_SEVERITY_LABELS[
                            severity
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-exposure-route`}
                >
                  Exposure route
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-exposure-route`}
                  placeholder="Example: Oral or inhalation"
                  aria-invalid={Boolean(
                    errors.exposureRoute
                  )}
                  aria-describedby={
                    errors.exposureRoute
                      ? `${formId}-exposure-route-error`
                      : undefined
                  }
                  {...register("exposureRoute")}
                />

                <FieldError
                  id={`${formId}-exposure-route-error`}
                  message={
                    errors.exposureRoute?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-onset-date`}>
                  Onset date
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-onset-date`}
                  type="date"
                  max={maximumHistoryDate}
                  aria-invalid={Boolean(
                    errors.onsetDate
                  )}
                  aria-describedby={
                    errors.onsetDate
                      ? `${formId}-onset-date-error`
                      : undefined
                  }
                  {...register("onsetDate")}
                />

                <FieldError
                  id={`${formId}-onset-date-error`}
                  message={errors.onsetDate?.message}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-last-occurrence`}
                >
                  Last occurrence
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-last-occurrence`}
                  type="date"
                  max={maximumHistoryDate}
                  aria-invalid={Boolean(
                    errors.lastOccurrenceDate
                  )}
                  aria-describedby={
                    errors.lastOccurrenceDate
                      ? `${formId}-last-occurrence-error`
                      : undefined
                  }
                  {...register(
                    "lastOccurrenceDate"
                  )}
                />

                <FieldError
                  id={`${formId}-last-occurrence-error`}
                  message={
                    errors.lastOccurrenceDate?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Information source
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Identify where the allergy information
                originated.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-source`}>
                  Source
                </Label>

                <select
                  id={`${formId}-source`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("source")}
                >
                  {ALLERGY_INFORMATION_SOURCES.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {
                          ALLERGY_INFORMATION_SOURCE_LABELS[
                            source
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-source-details`}
                >
                  Source details
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-source-details`}
                  placeholder="Facility, document, or informant"
                  aria-invalid={Boolean(
                    errors.sourceDetails
                  )}
                  aria-describedby={
                    errors.sourceDetails
                      ? `${formId}-source-details-error`
                      : undefined
                  }
                  {...register("sourceDetails")}
                />

                <FieldError
                  id={`${formId}-source-details-error`}
                  message={
                    errors.sourceDetails?.message
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`${formId}-notes`}>
                  Notes
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Textarea
                  id={`${formId}-notes`}
                  rows={4}
                  placeholder="Record relevant allergy history supported by the source."
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={
                    errors.notes
                      ? `${formId}-notes-error`
                      : undefined
                  }
                  {...register("notes")}
                />

                <FieldError
                  id={`${formId}-notes-error`}
                  message={errors.notes?.message}
                />
              </div>
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Allergy information may affect medication,
              dietary, procedural, and emergency workflows.
              Production changes will require clinical
              authorization and audit logging.
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
                  : "Adding record"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save changes
              </>
            ) : (
              <>
                <ShieldAlert aria-hidden="true" />
                Add allergy record
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
