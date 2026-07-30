"use client"

import {
  useEffect,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  FilePenLine,
  FilePlus2,
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
  PATIENT_DOCUMENT_CATEGORY_LABELS,
  PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS,
  PATIENT_DOCUMENT_SOURCE_LABELS,
  PATIENT_DOCUMENT_STATUS_LABELS,
  PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-document.constants"
import {
  patientDocumentFormSchema,
  type PatientDocumentFormValues,
} from "@/features/patients/schemas/patient-document.schema"
import {
  PATIENT_DOCUMENT_CATEGORIES,
  PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS,
  PATIENT_DOCUMENT_SOURCES,
  PATIENT_DOCUMENT_STATUSES,
  PATIENT_DOCUMENT_VERIFICATION_STATUSES,
  type PatientDocumentRecord,
} from "@/features/patients/types/patient-document.types"
import {
  documentSizeBytesToKilobytes,
} from "@/features/patients/utils/patient-document.utils"

export type PatientDocumentFormMode =
  | "create"
  | "edit"

interface PatientDocumentFormDialogProps {
  mode: PatientDocumentFormMode
  record?: PatientDocumentRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitRecord: (
    values: PatientDocumentFormValues
  ) => Promise<void>
}

const EMPTY_DOCUMENT_FORM_VALUES: PatientDocumentFormValues =
  {
    title: "",
    description: "",
    category: "other",
    documentStatus: "active",
    verificationStatus: "unverified",
    confidentialityLevel: "standard",
    issuedBy: "",
    issueDate: "",
    expirationDate: "",
    fileName: "",
    mimeType: "application/pdf",
    fileSizeKilobytes: "",
    source: "staff",
    sourceDetails: "",
    relatedEncounterReference: "",
    verificationReference: "",
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

function getDocumentFormValues(
  mode: PatientDocumentFormMode,
  record?: PatientDocumentRecord | null
): PatientDocumentFormValues {
  if (mode !== "edit" || !record) {
    return EMPTY_DOCUMENT_FORM_VALUES
  }

  return {
    title: record.title,
    description: record.description ?? "",
    category: record.category,
    documentStatus: record.documentStatus,
    verificationStatus:
      record.verificationStatus,
    confidentialityLevel:
      record.confidentialityLevel,
    issuedBy: record.issuedBy ?? "",
    issueDate: record.issueDate ?? "",
    expirationDate:
      record.expirationDate ?? "",
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSizeKilobytes:
      documentSizeBytesToKilobytes(
        record.fileSizeBytes
      ),
    source: record.source,
    sourceDetails: record.sourceDetails ?? "",
    relatedEncounterReference:
      record.relatedEncounterReference ?? "",
    verificationReference:
      record.verificationReference ?? "",
    notes: record.notes ?? "",
  }
}

export function PatientDocumentFormDialog({
  mode,
  record = null,
  open,
  onOpenChange,
  onSubmitRecord,
}: PatientDocumentFormDialogProps) {
  const isEditMode = mode === "edit"
  const formId =
    `patient-document-form-${mode}`

  const maximumIssueDate = useMemo(
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
  } = useForm<PatientDocumentFormValues>({
    resolver: zodResolver(
      patientDocumentFormSchema
    ),
    defaultValues: getDocumentFormValues(
      mode,
      record
    ),
    mode: "onTouched",
  })

  useEffect(() => {
    if (open) {
      reset(
        getDocumentFormValues(mode, record)
      )
    }
  }, [mode, open, record, reset])

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen && !isSubmitting) {
      reset(
        getDocumentFormValues(mode, record)
      )
    }

    onOpenChange(nextOpen)
  }

  async function submitDocumentRecord(
    values: PatientDocumentFormValues
  ) {
    try {
      await onSubmitRecord(values)

      reset(
        getDocumentFormValues(mode, record)
      )

      onOpenChange(false)
    } catch {
      setError("root", {
        type: "manual",
        message: isEditMode
          ? "The document metadata could not be updated."
          : "The document metadata could not be created.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            {isEditMode ? (
              <FilePenLine
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <FilePlus2
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <DialogTitle>
            {isEditMode
              ? "Edit document metadata"
              : "Add patient document metadata"}
          </DialogTitle>

          <DialogDescription>
            Record document classification, dates,
            verification, confidentiality, and file
            metadata. No binary file will be uploaded in
            this development phase.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitDocumentRecord
          )}
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Document classification
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Identify the document and control how it
                should be handled.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`${formId}-title`}>
                  Document title
                </Label>

                <Input
                  id={`${formId}-title`}
                  aria-invalid={Boolean(
                    errors.title
                  )}
                  aria-describedby={
                    errors.title
                      ? `${formId}-title-error`
                      : undefined
                  }
                  {...register("title")}
                />

                <FieldError
                  id={`${formId}-title-error`}
                  message={errors.title?.message}
                />
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
                  {PATIENT_DOCUMENT_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {
                          PATIENT_DOCUMENT_CATEGORY_LABELS[
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
                  htmlFor={`${formId}-document-status`}
                >
                  Document status
                </Label>

                <select
                  id={`${formId}-document-status`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("documentStatus")}
                >
                  {PATIENT_DOCUMENT_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          PATIENT_DOCUMENT_STATUS_LABELS[
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
                  htmlFor={`${formId}-verification`}
                >
                  Verification status
                </Label>

                <select
                  id={`${formId}-verification`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register(
                    "verificationStatus"
                  )}
                >
                  {PATIENT_DOCUMENT_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          PATIENT_DOCUMENT_VERIFICATION_STATUS_LABELS[
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
                  htmlFor={`${formId}-confidentiality`}
                >
                  Confidentiality
                </Label>

                <select
                  id={`${formId}-confidentiality`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register(
                    "confidentialityLevel"
                  )}
                >
                  {PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS.map(
                    (level) => (
                      <option
                        key={level}
                        value={level}
                      >
                        {
                          PATIENT_DOCUMENT_CONFIDENTIALITY_LABELS[
                            level
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2 sm:col-span-3">
                <Label
                  htmlFor={`${formId}-description`}
                >
                  Description
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Textarea
                  id={`${formId}-description`}
                  rows={3}
                  {...register("description")}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Issuance and validity
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-issued-by`}
                >
                  Issued by
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-issued-by`}
                  {...register("issuedBy")}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-issue-date`}
                >
                  Issue date
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-issue-date`}
                  type="date"
                  max={maximumIssueDate}
                  aria-invalid={Boolean(
                    errors.issueDate
                  )}
                  aria-describedby={
                    errors.issueDate
                      ? `${formId}-issue-date-error`
                      : undefined
                  }
                  {...register("issueDate")}
                />

                <FieldError
                  id={`${formId}-issue-date-error`}
                  message={errors.issueDate?.message}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-expiration-date`}
                >
                  Expiration date
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-expiration-date`}
                  type="date"
                  aria-invalid={Boolean(
                    errors.expirationDate
                  )}
                  aria-describedby={
                    errors.expirationDate
                      ? `${formId}-expiration-date-error`
                      : undefined
                  }
                  {...register("expirationDate")}
                />

                <FieldError
                  id={`${formId}-expiration-date-error`}
                  message={
                    errors.expirationDate?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                File metadata
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Metadata only. No actual patient file will
                be uploaded or stored in this phase.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-file-name`}
                >
                  File name
                </Label>

                <Input
                  id={`${formId}-file-name`}
                  placeholder="document-name.pdf"
                  aria-invalid={Boolean(
                    errors.fileName
                  )}
                  aria-describedby={
                    errors.fileName
                      ? `${formId}-file-name-error`
                      : undefined
                  }
                  {...register("fileName")}
                />

                <FieldError
                  id={`${formId}-file-name-error`}
                  message={errors.fileName?.message}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-mime-type`}
                >
                  MIME type
                </Label>

                <Input
                  id={`${formId}-mime-type`}
                  placeholder="application/pdf"
                  aria-invalid={Boolean(
                    errors.mimeType
                  )}
                  aria-describedby={
                    errors.mimeType
                      ? `${formId}-mime-type-error`
                      : undefined
                  }
                  {...register("mimeType")}
                />

                <FieldError
                  id={`${formId}-mime-type-error`}
                  message={errors.mimeType?.message}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-file-size`}
                >
                  File size (KB)
                </Label>

                <Input
                  id={`${formId}-file-size`}
                  type="number"
                  inputMode="decimal"
                  min={0.1}
                  max={102400}
                  step={0.1}
                  aria-invalid={Boolean(
                    errors.fileSizeKilobytes
                  )}
                  aria-describedby={
                    errors.fileSizeKilobytes
                      ? `${formId}-file-size-error`
                      : undefined
                  }
                  {...register(
                    "fileSizeKilobytes"
                  )}
                />

                <FieldError
                  id={`${formId}-file-size-error`}
                  message={
                    errors.fileSizeKilobytes
                      ?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Source and references
              </h3>
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
                  {PATIENT_DOCUMENT_SOURCES.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {
                          PATIENT_DOCUMENT_SOURCE_LABELS[
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

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-encounter-reference`}
                >
                  Related encounter
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-encounter-reference`}
                  {...register(
                    "relatedEncounterReference"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-verification-reference`}
                >
                  Verification reference
                  <span className="ml-1 font-normal text-muted-foreground">
                    Required when verified
                  </span>
                </Label>

                <Input
                  id={`${formId}-verification-reference`}
                  aria-invalid={Boolean(
                    errors.verificationReference
                  )}
                  aria-describedby={
                    errors.verificationReference
                      ? `${formId}-verification-reference-error`
                      : undefined
                  }
                  {...register(
                    "verificationReference"
                  )}
                />

                <FieldError
                  id={`${formId}-verification-reference-error`}
                  message={
                    errors.verificationReference
                      ?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-2 border-t pt-5">
            <Label htmlFor={`${formId}-notes`}>
              Notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id={`${formId}-notes`}
              rows={4}
              {...register("notes")}
            />
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50 p-4 text-xs text-violet-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This workflow stores document metadata only.
              Secure binary storage, malware scanning,
              encryption, access logging, signed URLs, and
              retention policies will be implemented later.
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
                  ? "Saving metadata"
                  : "Adding document"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save metadata
              </>
            ) : (
              <>
                <FilePlus2 aria-hidden="true" />
                Add document metadata
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
