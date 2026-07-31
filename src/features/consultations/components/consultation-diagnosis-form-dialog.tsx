"use client"

import {
  useEffect,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  FilePenLine,
  HeartPulse,
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
  CONSULTATION_DIAGNOSIS_ROLE_LABELS,
  CONSULTATION_DIAGNOSIS_VERIFICATION_LABELS,
} from "@/features/consultations/constants/consultation-diagnosis.constants"
import {
  consultationDiagnosisFormSchema,
  type ConsultationDiagnosisFormValues,
} from "@/features/consultations/schemas/consultation-diagnosis.schema"
import {
  CONSULTATION_DIAGNOSIS_ROLES,
  CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES,
  type ConsultationDiagnosisRecord,
} from "@/features/consultations/types/consultation-diagnosis.types"

export type ConsultationDiagnosisFormMode =
  | "create"
  | "edit"

interface ConsultationDiagnosisFormDialogProps {
  mode: ConsultationDiagnosisFormMode
  record?:
    | ConsultationDiagnosisRecord
    | null
  open: boolean
  onOpenChange: (open: boolean) => void

  onSubmitRecord: (
    values:
      ConsultationDiagnosisFormValues
  ) => Promise<void>
}

const EMPTY_DIAGNOSIS_VALUES:
  ConsultationDiagnosisFormValues = {
  diagnosisName: "",
  icd10Code: "",
  role: "primary",
  verificationStatus: "provisional",
  onsetDate: "",
  clinicalNotes: "",
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
    date.getTimezoneOffset() *
    60 *
    1000

  return new Date(
    date.getTime() -
      timezoneOffsetMilliseconds
  )
    .toISOString()
    .slice(0, 10)
}

function getDiagnosisFormValues(
  mode: ConsultationDiagnosisFormMode,
  record?:
    | ConsultationDiagnosisRecord
    | null
): ConsultationDiagnosisFormValues {
  if (mode !== "edit" || !record) {
    return EMPTY_DIAGNOSIS_VALUES
  }

  return {
    diagnosisName:
      record.diagnosisName,

    icd10Code:
      record.icd10Code ?? "",

    role: record.role,

    verificationStatus:
      record.verificationStatus,

    onsetDate:
      record.onsetDate ?? "",

    clinicalNotes:
      record.clinicalNotes ?? "",
  }
}

export function ConsultationDiagnosisFormDialog({
  mode,
  record = null,
  open,
  onOpenChange,
  onSubmitRecord,
}: ConsultationDiagnosisFormDialogProps) {
  const isEditMode = mode === "edit"

  const formId =
    `consultation-diagnosis-form-${mode}`

  const maximumOnsetDate = useMemo(
    () =>
      getLocalDateInputValue(
        new Date()
      ),
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
  } =
    useForm<ConsultationDiagnosisFormValues>(
      {
        resolver: zodResolver(
          consultationDiagnosisFormSchema
        ),

        defaultValues:
          getDiagnosisFormValues(
            mode,
            record
          ),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        getDiagnosisFormValues(
          mode,
          record
        )
      )
    }
  }, [mode, open, record, reset])

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (
      !nextOpen &&
      !isSubmitting
    ) {
      reset(
        getDiagnosisFormValues(
          mode,
          record
        )
      )
    }

    onOpenChange(nextOpen)
  }

  async function submitDiagnosis(
    values:
      ConsultationDiagnosisFormValues
  ) {
    try {
      await onSubmitRecord(values)

      reset(
        getDiagnosisFormValues(
          mode,
          record
        )
      )

      onOpenChange(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isEditMode
            ? "The diagnosis could not be updated."
            : "The diagnosis could not be added."

      setError("root", {
        type: "manual",
        message: errorMessage,
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            {isEditMode ? (
              <FilePenLine
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <HeartPulse
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <DialogTitle>
            {isEditMode
              ? "Edit diagnosis"
              : "Add diagnosis"}
          </DialogTitle>

          <DialogDescription>
            Record the diagnosis narrative,
            role, verification status, and
            optional ICD-10 code. Code format
            validation does not confirm clinical
            appropriateness.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitDiagnosis
          )}
        >
          <section className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-name`}
              >
                Diagnosis name
              </Label>

              <Input
                id={`${formId}-name`}
                placeholder="Enter documented diagnosis"
                aria-invalid={Boolean(
                  errors.diagnosisName
                )}
                aria-describedby={
                  errors.diagnosisName
                    ? `${formId}-name-error`
                    : undefined
                }
                {...register(
                  "diagnosisName"
                )}
              />

              <FieldError
                id={`${formId}-name-error`}
                message={
                  errors.diagnosisName
                    ?.message
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-icd10`}
                >
                  ICD-10 code
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional for provisional or
                    differential diagnoses
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
                      : `${formId}-icd10-help`
                  }
                  {...register(
                    "icd10Code"
                  )}
                />

                <p
                  id={`${formId}-icd10-help`}
                  className="text-xs text-muted-foreground"
                >
                  Technical format validation
                  only.
                </p>

                <FieldError
                  id={`${formId}-icd10-error`}
                  message={
                    errors.icd10Code
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-onset`}
                >
                  Onset date
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-onset`}
                  type="date"
                  max={maximumOnsetDate}
                  aria-invalid={Boolean(
                    errors.onsetDate
                  )}
                  aria-describedby={
                    errors.onsetDate
                      ? `${formId}-onset-error`
                      : undefined
                  }
                  {...register(
                    "onsetDate"
                  )}
                />

                <FieldError
                  id={`${formId}-onset-error`}
                  message={
                    errors.onsetDate?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-role`}
                >
                  Diagnosis role
                </Label>

                <select
                  id={`${formId}-role`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("role")}
                >
                  {CONSULTATION_DIAGNOSIS_ROLES.map(
                    (role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {
                          CONSULTATION_DIAGNOSIS_ROLE_LABELS[
                            role
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-verification`}
                >
                  Verification status
                </Label>

                <select
                  id={`${formId}-verification`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
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
                  {CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          CONSULTATION_DIAGNOSIS_VERIFICATION_LABELS[
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
                    errors
                      .verificationStatus
                      ?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-2 border-t pt-5">
            <Label
              htmlFor={`${formId}-notes`}
            >
              Clinical notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id={`${formId}-notes`}
              rows={5}
              placeholder="Document relevant diagnostic context and clinical reasoning."
              aria-invalid={Boolean(
                errors.clinicalNotes
              )}
              aria-describedby={
                errors.clinicalNotes
                  ? `${formId}-notes-error`
                  : undefined
              }
              {...register(
                "clinicalNotes"
              )}
            />

            <FieldError
              id={`${formId}-notes-error`}
              message={
                errors.clinicalNotes
                  ?.message
              }
            />
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Diagnoses remain part of the
              consultation record. They do not
              automatically update the longitudinal
              Medical History module in this UI
              phase.
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
              handleDialogOpenChange(
                false
              )
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
                  : "Adding diagnosis"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save changes
              </>
            ) : (
              <>
                <HeartPulse
                  aria-hidden="true"
                />
                Add diagnosis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
