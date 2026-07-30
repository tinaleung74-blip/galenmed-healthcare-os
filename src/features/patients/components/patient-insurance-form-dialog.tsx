"use client"

import {
  useEffect,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  BadgeCheck,
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
  INSURANCE_COVERAGE_STATUS_LABELS,
  INSURANCE_COVERAGE_TYPE_LABELS,
  INSURANCE_INFORMATION_SOURCE_LABELS,
  INSURANCE_PRIORITY_LABELS,
  INSURANCE_SUBSCRIBER_RELATIONSHIP_LABELS,
  INSURANCE_VERIFICATION_STATUS_LABELS,
} from "@/features/patients/constants/patient-insurance.constants"
import {
  patientInsuranceFormSchema,
  type PatientInsuranceFormValues,
} from "@/features/patients/schemas/patient-insurance.schema"
import {
  INSURANCE_COVERAGE_STATUSES,
  INSURANCE_COVERAGE_TYPES,
  INSURANCE_INFORMATION_SOURCES,
  INSURANCE_PRIORITIES,
  INSURANCE_SUBSCRIBER_RELATIONSHIPS,
  INSURANCE_VERIFICATION_STATUSES,
  type PatientInsuranceRecord,
} from "@/features/patients/types/patient-insurance.types"

export type PatientInsuranceFormMode =
  | "create"
  | "edit"

interface PatientInsuranceFormDialogProps {
  mode: PatientInsuranceFormMode
  record?: PatientInsuranceRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitRecord: (
    values: PatientInsuranceFormValues
  ) => Promise<void>
}

const EMPTY_INSURANCE_FORM_VALUES: PatientInsuranceFormValues =
  {
    payerName: "",
    planName: "",
    coverageType: "hmo",
    coverageStatus: "pending",
    verificationStatus: "unverified",
    priority: "primary",
    memberNumber: "",
    policyNumber: "",
    groupNumber: "",
    subscriberName: "",
    subscriberRelationship: "self",
    subscriberDateOfBirth: "",
    effectiveFrom: "",
    effectiveTo: "",
    employerName: "",
    payerContactNumber: "",
    authorizationRequired: false,
    coveredServices: "",
    source: "patient",
    sourceDetails: "",
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

function getInsuranceFormValues(
  mode: PatientInsuranceFormMode,
  record?: PatientInsuranceRecord | null
): PatientInsuranceFormValues {
  if (mode !== "edit" || !record) {
    return EMPTY_INSURANCE_FORM_VALUES
  }

  return {
    payerName: record.payerName,
    planName: record.planName,
    coverageType: record.coverageType,
    coverageStatus: record.coverageStatus,
    verificationStatus:
      record.verificationStatus,
    priority: record.priority,
    memberNumber: record.memberNumber,
    policyNumber: record.policyNumber ?? "",
    groupNumber: record.groupNumber ?? "",
    subscriberName: record.subscriberName,
    subscriberRelationship:
      record.subscriberRelationship,
    subscriberDateOfBirth:
      record.subscriberDateOfBirth ?? "",
    effectiveFrom: record.effectiveFrom,
    effectiveTo: record.effectiveTo ?? "",
    employerName: record.employerName ?? "",
    payerContactNumber:
      record.payerContactNumber ?? "",
    authorizationRequired:
      record.authorizationRequired,
    coveredServices:
      record.coveredServices.join(", "),
    source: record.source,
    sourceDetails: record.sourceDetails ?? "",
    verificationReference:
      record.verificationReference ?? "",
    notes: record.notes ?? "",
  }
}

export function PatientInsuranceFormDialog({
  mode,
  record = null,
  open,
  onOpenChange,
  onSubmitRecord,
}: PatientInsuranceFormDialogProps) {
  const isEditMode = mode === "edit"
  const formId = `patient-insurance-form-${mode}`

  const maximumBirthDate = useMemo(
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
  } = useForm<PatientInsuranceFormValues>({
    resolver: zodResolver(
      patientInsuranceFormSchema
    ),
    defaultValues: getInsuranceFormValues(
      mode,
      record
    ),
    mode: "onTouched",
  })

  useEffect(() => {
    if (open) {
      reset(
        getInsuranceFormValues(mode, record)
      )
    }
  }, [mode, open, record, reset])

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen && !isSubmitting) {
      reset(
        getInsuranceFormValues(mode, record)
      )
    }

    onOpenChange(nextOpen)
  }

  async function submitInsuranceRecord(
    values: PatientInsuranceFormValues
  ) {
    try {
      await onSubmitRecord(values)

      reset(
        getInsuranceFormValues(mode, record)
      )

      onOpenChange(false)
    } catch {
      setError("root", {
        type: "manual",
        message: isEditMode
          ? "The insurance coverage record could not be updated."
          : "The insurance coverage record could not be created.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            {isEditMode ? (
              <FilePenLine
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <BadgeCheck
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <DialogTitle>
            {isEditMode
              ? "Edit insurance coverage"
              : "Add insurance coverage"}
          </DialogTitle>

          <DialogDescription>
            Record payer, member, subscriber, eligibility,
            verification, and authorization information.
            Insurance coverage does not guarantee payment.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitInsuranceRecord
          )}
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Coverage and payer
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Identify the payer, plan, coverage type,
                status, and priority.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-payer`}>
                  Payer name
                </Label>

                <Input
                  id={`${formId}-payer`}
                  aria-invalid={Boolean(
                    errors.payerName
                  )}
                  aria-describedby={
                    errors.payerName
                      ? `${formId}-payer-error`
                      : undefined
                  }
                  {...register("payerName")}
                />

                <FieldError
                  id={`${formId}-payer-error`}
                  message={errors.payerName?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-plan`}>
                  Plan name
                </Label>

                <Input
                  id={`${formId}-plan`}
                  aria-invalid={Boolean(
                    errors.planName
                  )}
                  aria-describedby={
                    errors.planName
                      ? `${formId}-plan-error`
                      : undefined
                  }
                  {...register("planName")}
                />

                <FieldError
                  id={`${formId}-plan-error`}
                  message={errors.planName?.message}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-coverage-type`}
                >
                  Coverage type
                </Label>

                <select
                  id={`${formId}-coverage-type`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("coverageType")}
                >
                  {INSURANCE_COVERAGE_TYPES.map(
                    (coverageType) => (
                      <option
                        key={coverageType}
                        value={coverageType}
                      >
                        {
                          INSURANCE_COVERAGE_TYPE_LABELS[
                            coverageType
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-coverage-status`}
                >
                  Coverage status
                </Label>

                <select
                  id={`${formId}-coverage-status`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("coverageStatus")}
                >
                  {INSURANCE_COVERAGE_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          INSURANCE_COVERAGE_STATUS_LABELS[
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
                  {INSURANCE_VERIFICATION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          INSURANCE_VERIFICATION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-priority`}>
                  Coverage priority
                </Label>

                <select
                  id={`${formId}-priority`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("priority")}
                >
                  {INSURANCE_PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {
                          INSURANCE_PRIORITY_LABELS[
                            priority
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
                Member and policy identifiers
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Identifiers will be masked in patient-facing
                and general list views.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-member-number`}>
                  Member number
                </Label>

                <Input
                  id={`${formId}-member-number`}
                  aria-invalid={Boolean(
                    errors.memberNumber
                  )}
                  aria-describedby={
                    errors.memberNumber
                      ? `${formId}-member-number-error`
                      : undefined
                  }
                  {...register("memberNumber")}
                />

                <FieldError
                  id={`${formId}-member-number-error`}
                  message={
                    errors.memberNumber?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-policy-number`}>
                  Policy number
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-policy-number`}
                  {...register("policyNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-group-number`}>
                  Group number
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-group-number`}
                  {...register("groupNumber")}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Subscriber information
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                The subscriber may be the patient or another
                policy holder.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-subscriber-name`}
                >
                  Subscriber name
                </Label>

                <Input
                  id={`${formId}-subscriber-name`}
                  aria-invalid={Boolean(
                    errors.subscriberName
                  )}
                  aria-describedby={
                    errors.subscriberName
                      ? `${formId}-subscriber-name-error`
                      : undefined
                  }
                  {...register("subscriberName")}
                />

                <FieldError
                  id={`${formId}-subscriber-name-error`}
                  message={
                    errors.subscriberName?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-subscriber-relationship`}
                >
                  Relationship
                </Label>

                <select
                  id={`${formId}-subscriber-relationship`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register(
                    "subscriberRelationship"
                  )}
                >
                  {INSURANCE_SUBSCRIBER_RELATIONSHIPS.map(
                    (relationship) => (
                      <option
                        key={relationship}
                        value={relationship}
                      >
                        {
                          INSURANCE_SUBSCRIBER_RELATIONSHIP_LABELS[
                            relationship
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-subscriber-birth-date`}
                >
                  Subscriber date of birth
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-subscriber-birth-date`}
                  type="date"
                  max={maximumBirthDate}
                  aria-invalid={Boolean(
                    errors.subscriberDateOfBirth
                  )}
                  aria-describedby={
                    errors.subscriberDateOfBirth
                      ? `${formId}-subscriber-birth-date-error`
                      : undefined
                  }
                  {...register(
                    "subscriberDateOfBirth"
                  )}
                />

                <FieldError
                  id={`${formId}-subscriber-birth-date-error`}
                  message={
                    errors.subscriberDateOfBirth
                      ?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Coverage period and contact
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-effective-from`}
                >
                  Effective from
                </Label>

                <Input
                  id={`${formId}-effective-from`}
                  type="date"
                  aria-invalid={Boolean(
                    errors.effectiveFrom
                  )}
                  aria-describedby={
                    errors.effectiveFrom
                      ? `${formId}-effective-from-error`
                      : undefined
                  }
                  {...register("effectiveFrom")}
                />

                <FieldError
                  id={`${formId}-effective-from-error`}
                  message={
                    errors.effectiveFrom?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-effective-to`}
                >
                  Effective to
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-effective-to`}
                  type="date"
                  aria-invalid={Boolean(
                    errors.effectiveTo
                  )}
                  aria-describedby={
                    errors.effectiveTo
                      ? `${formId}-effective-to-error`
                      : undefined
                  }
                  {...register("effectiveTo")}
                />

                <FieldError
                  id={`${formId}-effective-to-error`}
                  message={
                    errors.effectiveTo?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-employer-name`}
                >
                  Employer name
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-employer-name`}
                  {...register("employerName")}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-payer-contact`}
                >
                  Payer contact
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-payer-contact`}
                  type="tel"
                  aria-invalid={Boolean(
                    errors.payerContactNumber
                  )}
                  aria-describedby={
                    errors.payerContactNumber
                      ? `${formId}-payer-contact-error`
                      : undefined
                  }
                  {...register("payerContactNumber")}
                />

                <FieldError
                  id={`${formId}-payer-contact-error`}
                  message={
                    errors.payerContactNumber?.message
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Benefits and authorization
              </h3>
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-teal-700"
                  {...register(
                    "authorizationRequired"
                  )}
                />

                <span>
                  <span className="block text-sm font-medium">
                    Prior authorization may be required
                  </span>

                  <span className="mt-1 block text-xs text-muted-foreground">
                    This indicates a requirement only. It
                    does not mean authorization has already
                    been obtained.
                  </span>
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-covered-services`}
              >
                Covered services
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id={`${formId}-covered-services`}
                rows={4}
                placeholder="Separate services using commas or new lines."
                {...register("coveredServices")}
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Verification and source
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-source`}>
                  Information source
                </Label>

                <select
                  id={`${formId}-source`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  {...register("source")}
                >
                  {INSURANCE_INFORMATION_SOURCES.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {
                          INSURANCE_INFORMATION_SOURCE_LABELS[
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

              <div className="space-y-2 sm:col-span-2">
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

          <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs text-sky-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Eligibility and coverage details may change.
              Production workflows must re-verify coverage
              before authorization, claim submission, or
              financial commitment.
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
                  : "Adding coverage"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save changes
              </>
            ) : (
              <>
                <BadgeCheck aria-hidden="true" />
                Add coverage
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
