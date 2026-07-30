"use client"

import {
  useEffect,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
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
  MEDICAL_CONDITION_STATUS_LABELS,
  MEDICAL_HISTORY_SOURCE_LABELS,
  MEDICAL_HISTORY_VERIFICATION_LABELS,
} from "@/features/patients/constants/medical-history.constants"
import {
  medicalHistoryFormSchema,
  type MedicalHistoryFormValues,
} from "@/features/patients/schemas/medical-history.schema"
import {
  MEDICAL_CONDITION_CLINICAL_STATUSES,
  MEDICAL_HISTORY_SOURCES,
  MEDICAL_HISTORY_VERIFICATION_STATUSES,
  type MedicalHistoryRecord,
} from "@/features/patients/types/medical-history.types"

export type MedicalHistoryFormMode =
  | "create"
  | "edit"

interface MedicalHistoryFormDialogProps {
  mode: MedicalHistoryFormMode
  record?: MedicalHistoryRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitRecord: (
    values: MedicalHistoryFormValues
  ) => Promise<void>
}

const EMPTY_MEDICAL_HISTORY_VALUES: MedicalHistoryFormValues =
  {
    conditionName: "",
    icd10Code: "",
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    onsetDate: "",
    resolutionDate: "",
    source: "clinician",
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

function getMedicalHistoryFormValues(
  mode: MedicalHistoryFormMode,
  record?: MedicalHistoryRecord | null
): MedicalHistoryFormValues {
  if (mode !== "edit" || !record) {
    return EMPTY_MEDICAL_HISTORY_VALUES
  }

  return {
    conditionName: record.conditionName,
    icd10Code: record.icd10Code ?? "",
    clinicalStatus: record.clinicalStatus,
    verificationStatus:
      record.verificationStatus,
    onsetDate: record.onsetDate ?? "",
    resolutionDate: record.resolutionDate ?? "",
    source: record.source,
    sourceDetails: record.sourceDetails ?? "",
    notes: record.notes ?? "",
  }
}

function getLocalDateInputValue(
  date: Date
): string {
  const timezoneOffsetInMilliseconds =
    date.getTimezoneOffset() * 60 * 1000

  return new Date(
    date.getTime() - timezoneOffsetInMilliseconds
  )
    .toISOString()
    .slice(0, 10)
}

export function MedicalHistoryFormDialog({
  mode,
  record = null,
  open,
  onOpenChange,
  onSubmitRecord,
}: MedicalHistoryFormDialogProps) {
  const isEditMode = mode === "edit"
  const formId = `medical-history-form-${mode}`

  const maximumClinicalDate = useMemo(
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
  } = useForm<MedicalHistoryFormValues>({
    resolver: zodResolver(
      medicalHistoryFormSchema
    ),
    defaultValues: getMedicalHistoryFormValues(
      mode,
      record
    ),
    mode: "onTouched",
  })

  useEffect(() => {
    if (open) {
      reset(
        getMedicalHistoryFormValues(mode, record)
      )
    }
  }, [mode, open, record, reset])

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen && !isSubmitting) {
      reset(
        getMedicalHistoryFormValues(mode, record)
      )
    }

    onOpenChange(nextOpen)
  }

  async function submitMedicalHistory(
    values: MedicalHistoryFormValues
  ) {
    try {
      await onSubmitRecord(values)

      reset(
        getMedicalHistoryFormValues(mode, record)
      )

      onOpenChange(false)
    } catch {
      setError("root", {
        type: "manual",
        message: isEditMode
          ? "The medical-history record could not be updated."
          : "The medical-history record could not be created.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
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
              ? "Edit medical condition"
              : "Add medical condition"}
          </DialogTitle>

          <DialogDescription>
            Record structured historical or active
            condition information. This does not replace
            a consultation, diagnosis workflow, or signed
            clinical note.
          </DialogDescription>

          {isEditMode && record ? (
            <p className="pt-1 text-xs text-muted-foreground">
              Recorded by {record.recordedBy}
            </p>
          ) : null}
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitMedicalHistory
          )}
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Condition information
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Enter the documented condition and its
                current clinical classification.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`${formId}-condition`}>
                  Condition name
                </Label>

                <Input
                  id={`${formId}-condition`}
                  placeholder="Example: Essential hypertension"
                  aria-invalid={Boolean(
                    errors.conditionName
                  )}
                  aria-describedby={
                    errors.conditionName
                      ? `${formId}-condition-error`
                      : undefined
                  }
                  {...register("conditionName")}
                />

                <FieldError
                  id={`${formId}-condition-error`}
                  message={
                    errors.conditionName?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-icd10`}>
                  ICD-10 code
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-icd10`}
                  placeholder="Example: I10"
                  className="uppercase"
                  aria-invalid={Boolean(
                    errors.icd10Code
                  )}
                  aria-describedby={
                    errors.icd10Code
                      ? `${formId}-icd10-error`
                      : `${formId}-icd10-description`
                  }
                  {...register("icd10Code")}
                />

                <p
                  id={`${formId}-icd10-description`}
                  className="text-xs text-muted-foreground"
                >
                  Enter only a code supported by the
                  documented clinical record.
                </p>

                <FieldError
                  id={`${formId}-icd10-error`}
                  message={errors.icd10Code?.message}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-clinical-status`}
                >
                  Clinical status
                </Label>

                <select
                  id={`${formId}-clinical-status`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(
                    errors.clinicalStatus
                  )}
                  aria-describedby={
                    errors.clinicalStatus
                      ? `${formId}-clinical-status-error`
                      : undefined
                  }
                  {...register("clinicalStatus")}
                >
                  {MEDICAL_CONDITION_CLINICAL_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          MEDICAL_CONDITION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  id={`${formId}-clinical-status-error`}
                  message={
                    errors.clinicalStatus?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-verification`}
                >
                  Verification status
                </Label>

                <select
                  id={`${formId}-verification`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(
                    errors.verificationStatus
                  )}
                  aria-describedby={
                    errors.verificationStatus
                      ? `${formId}-verification-error`
                      : undefined
                  }
                  {...register(
                    "verificationStatus"
                  )}
                >
                  {MEDICAL_HISTORY_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          MEDICAL_HISTORY_VERIFICATION_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  id={`${formId}-verification-error`}
                  message={
                    errors.verificationStatus?.message
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
                  max={maximumClinicalDate}
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
                  htmlFor={`${formId}-resolution-date`}
                >
                  Resolution date
                  <span className="ml-1 font-normal text-muted-foreground">
                    Required only when resolved
                  </span>
                </Label>

                <Input
                  id={`${formId}-resolution-date`}
                  type="date"
                  max={maximumClinicalDate}
                  aria-invalid={Boolean(
                    errors.resolutionDate
                  )}
                  aria-describedby={
                    errors.resolutionDate
                      ? `${formId}-resolution-date-error`
                      : undefined
                  }
                  {...register("resolutionDate")}
                />

                <FieldError
                  id={`${formId}-resolution-date-error`}
                  message={
                    errors.resolutionDate?.message
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
                Identify where the historical information
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
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(errors.source)}
                  aria-describedby={
                    errors.source
                      ? `${formId}-source-error`
                      : undefined
                  }
                  {...register("source")}
                >
                  {MEDICAL_HISTORY_SOURCES.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {
                          MEDICAL_HISTORY_SOURCE_LABELS[
                            source
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  id={`${formId}-source-error`}
                  message={errors.source?.message}
                />
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
            </div>
          </section>

          <section className="space-y-2 border-t pt-5">
            <Label htmlFor={`${formId}-notes`}>
              Clinical notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id={`${formId}-notes`}
              rows={5}
              placeholder="Document only relevant historical context supported by the source."
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
              Do not use this field as a substitute for
              SOAP notes or a formal consultation record.
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
              This development workflow stores structured
              synthetic records in temporary browser memory.
              Every production change will later require
              authorization and an audit-log event.
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
                  : "Adding condition"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save changes
              </>
            ) : (
              <>
                <ClipboardPlus aria-hidden="true" />
                Add condition
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
