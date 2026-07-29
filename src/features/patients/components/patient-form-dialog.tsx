"use client"

import {
  useEffect,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  LoaderCircle,
  Pencil,
  Save,
  ShieldCheck,
  UserPlus,
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
  BIOLOGICAL_SEX_LABELS,
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  patientFormSchema,
  type PatientFormValues,
} from "@/features/patients/schemas/patient.schema"
import {
  BIOLOGICAL_SEXES,
  type Patient,
} from "@/features/patients/types/patient.types"

export type PatientFormMode = "create" | "edit"

interface PatientFormDialogProps {
  mode: PatientFormMode
  patient?: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitPatient: (
    values: PatientFormValues
  ) => Promise<void>
}

const EMPTY_PATIENT_FORM_VALUES: PatientFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  biologicalSex: "unknown",
  mobileNumber: "",
  emailAddress: "",
  branchId: "",
  address: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  consentAcknowledged: false,
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

function getLocalDateInputValue(date: Date): string {
  const timezoneOffsetInMilliseconds =
    date.getTimezoneOffset() * 60 * 1000

  return new Date(
    date.getTime() - timezoneOffsetInMilliseconds
  )
    .toISOString()
    .slice(0, 10)
}

function getPatientFormValues(
  mode: PatientFormMode,
  patient?: Patient | null
): PatientFormValues {
  if (mode !== "edit" || !patient) {
    return EMPTY_PATIENT_FORM_VALUES
  }

  return {
    firstName: patient.firstName,
    middleName: patient.middleName ?? "",
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    biologicalSex: patient.biologicalSex,
    mobileNumber: patient.mobileNumber ?? "",
    emailAddress: patient.emailAddress ?? "",
    branchId: patient.branchId,
    address: patient.address,
    emergencyContactName:
      patient.emergencyContactName,
    emergencyContactNumber:
      patient.emergencyContactNumber,
    consentAcknowledged: true,
  }
}

export function PatientFormDialog({
  mode,
  patient = null,
  open,
  onOpenChange,
  onSubmitPatient,
}: PatientFormDialogProps) {
  const isEditMode = mode === "edit"
  const formId = `patient-form-${mode}`

  const dateLimits = useMemo(() => {
    const today = new Date()
    const earliestPlausibleBirthDate = new Date(today)

    earliestPlausibleBirthDate.setFullYear(
      earliestPlausibleBirthDate.getFullYear() - 130
    )

    return {
      maximum: getLocalDateInputValue(today),
      minimum: getLocalDateInputValue(
        earliestPlausibleBirthDate
      ),
    }
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: getPatientFormValues(
      mode,
      patient
    ),
    mode: "onTouched",
  })

  useEffect(() => {
    if (open) {
      reset(getPatientFormValues(mode, patient))
    }
  }, [mode, open, patient, reset])

  function handleDialogOpenChange(
    nextOpen: boolean
  ) {
    if (!nextOpen && !isSubmitting) {
      reset(getPatientFormValues(mode, patient))
    }

    onOpenChange(nextOpen)
  }

  async function submitPatient(
    values: PatientFormValues
  ) {
    try {
      await onSubmitPatient(values)
      reset(getPatientFormValues(mode, patient))
      onOpenChange(false)
    } catch {
      setError("root", {
        type: "manual",
        message: isEditMode
          ? "The patient record could not be updated. Review the information and try again."
          : "The patient could not be registered. Review the information and try again.",
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
              <Pencil
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <UserPlus
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <DialogTitle>
            {isEditMode
              ? "Edit patient demographics"
              : "Register new patient"}
          </DialogTitle>

          <DialogDescription>
            {isEditMode
              ? "Update demographic and contact information. The patient's medical record number and clinical history will not be changed."
              : "Create a demographic patient record. Clinical history, allergies, insurance, and consultations will be managed separately in the patient profile."}
          </DialogDescription>

          {isEditMode && patient ? (
            <p className="pt-1 font-mono text-xs font-medium text-teal-700">
              {patient.medicalRecordNumber}
            </p>
          ) : null}
        </DialogHeader>

        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(submitPatient)}
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Patient identity
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Use the patient&apos;s legal demographic
                information.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-first-name`}>
                  First name
                </Label>

                <Input
                  id={`${formId}-first-name`}
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={
                    errors.firstName
                      ? `${formId}-first-name-error`
                      : undefined
                  }
                  {...register("firstName")}
                />

                <FieldError
                  id={`${formId}-first-name-error`}
                  message={errors.firstName?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-middle-name`}>
                  Middle name
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-middle-name`}
                  autoComplete="additional-name"
                  aria-invalid={Boolean(errors.middleName)}
                  aria-describedby={
                    errors.middleName
                      ? `${formId}-middle-name-error`
                      : undefined
                  }
                  {...register("middleName")}
                />

                <FieldError
                  id={`${formId}-middle-name-error`}
                  message={errors.middleName?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-last-name`}>
                  Last name
                </Label>

                <Input
                  id={`${formId}-last-name`}
                  autoComplete="family-name"
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={
                    errors.lastName
                      ? `${formId}-last-name-error`
                      : undefined
                  }
                  {...register("lastName")}
                />

                <FieldError
                  id={`${formId}-last-name-error`}
                  message={errors.lastName?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-date-of-birth`}>
                  Date of birth
                </Label>

                <Input
                  id={`${formId}-date-of-birth`}
                  type="date"
                  min={dateLimits.minimum}
                  max={dateLimits.maximum}
                  aria-invalid={Boolean(errors.dateOfBirth)}
                  aria-describedby={
                    errors.dateOfBirth
                      ? `${formId}-date-of-birth-error`
                      : undefined
                  }
                  {...register("dateOfBirth")}
                />

                <FieldError
                  id={`${formId}-date-of-birth-error`}
                  message={errors.dateOfBirth?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-biological-sex`}>
                  Biological sex
                </Label>

                <select
                  id={`${formId}-biological-sex`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(
                    errors.biologicalSex
                  )}
                  aria-describedby={
                    errors.biologicalSex
                      ? `${formId}-biological-sex-error`
                      : undefined
                  }
                  {...register("biologicalSex")}
                >
                  {BIOLOGICAL_SEXES.map(
                    (biologicalSex) => (
                      <option
                        key={biologicalSex}
                        value={biologicalSex}
                      >
                        {
                          BIOLOGICAL_SEX_LABELS[
                            biologicalSex
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  id={`${formId}-biological-sex-error`}
                  message={
                    errors.biologicalSex?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-branch`}>
                  Registration branch
                </Label>

                <select
                  id={`${formId}-branch`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
                  aria-invalid={Boolean(errors.branchId)}
                  aria-describedby={
                    errors.branchId
                      ? `${formId}-branch-error`
                      : undefined
                  }
                  {...register("branchId")}
                >
                  <option value="">
                    Select a GalenMed branch
                  </option>

                  {GALENMED_BRANCHES.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>

                <FieldError
                  id={`${formId}-branch-error`}
                  message={errors.branchId?.message}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Contact information
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Contact details are used for patient
                communication and appointment coordination.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-mobile-number`}>
                  Mobile number
                </Label>

                <Input
                  id={`${formId}-mobile-number`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09171234567"
                  aria-invalid={Boolean(
                    errors.mobileNumber
                  )}
                  aria-describedby={
                    errors.mobileNumber
                      ? `${formId}-mobile-number-error`
                      : undefined
                  }
                  {...register("mobileNumber")}
                />

                <FieldError
                  id={`${formId}-mobile-number-error`}
                  message={errors.mobileNumber?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-email-address`}>
                  Email address
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Input
                  id={`${formId}-email-address`}
                  type="email"
                  autoComplete="email"
                  placeholder="patient@example.com"
                  aria-invalid={Boolean(
                    errors.emailAddress
                  )}
                  aria-describedby={
                    errors.emailAddress
                      ? `${formId}-email-address-error`
                      : undefined
                  }
                  {...register("emailAddress")}
                />

                <FieldError
                  id={`${formId}-email-address-error`}
                  message={errors.emailAddress?.message}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`${formId}-address`}>
                  Complete address
                </Label>

                <Textarea
                  id={`${formId}-address`}
                  autoComplete="street-address"
                  rows={3}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={
                    errors.address
                      ? `${formId}-address-error`
                      : undefined
                  }
                  {...register("address")}
                />

                <FieldError
                  id={`${formId}-address-error`}
                  message={errors.address?.message}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Emergency contact
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Enter a person who may be contacted during an
                emergency or when the patient cannot be reached.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-emergency-contact-name`}
                >
                  Contact name
                </Label>

                <Input
                  id={`${formId}-emergency-contact-name`}
                  autoComplete="name"
                  aria-invalid={Boolean(
                    errors.emergencyContactName
                  )}
                  aria-describedby={
                    errors.emergencyContactName
                      ? `${formId}-emergency-contact-name-error`
                      : undefined
                  }
                  {...register("emergencyContactName")}
                />

                <FieldError
                  id={`${formId}-emergency-contact-name-error`}
                  message={
                    errors.emergencyContactName?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-emergency-contact-number`}
                >
                  Contact number
                </Label>

                <Input
                  id={`${formId}-emergency-contact-number`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09181234567"
                  aria-invalid={Boolean(
                    errors.emergencyContactNumber
                  )}
                  aria-describedby={
                    errors.emergencyContactNumber
                      ? `${formId}-emergency-contact-number-error`
                      : undefined
                  }
                  {...register("emergencyContactNumber")}
                />

                <FieldError
                  id={`${formId}-emergency-contact-number-error`}
                  message={
                    errors.emergencyContactNumber?.message
                  }
                />
              </div>
            </div>
          </section>

          {isEditMode ? (
            <section className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-teal-700"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-sm font-medium text-teal-900">
                    Patient consent record preserved
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-teal-800">
                    Editing demographic information does not
                    replace or revoke the patient&apos;s existing
                    consent record.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
              <div className="flex items-start gap-3">
                <input
                  id={`${formId}-consent`}
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-teal-700"
                  aria-invalid={Boolean(
                    errors.consentAcknowledged
                  )}
                  aria-describedby={
                    errors.consentAcknowledged
                      ? `${formId}-consent-error`
                      : `${formId}-consent-description`
                  }
                  {...register("consentAcknowledged")}
                />

                <div className="min-w-0">
                  <Label
                    htmlFor={`${formId}-consent`}
                    className="cursor-pointer"
                  >
                    Patient consent acknowledged
                  </Label>

                  <p
                    id={`${formId}-consent-description`}
                    className="mt-1 text-xs leading-relaxed text-teal-800"
                  >
                    I confirm that appropriate consent was
                    obtained for creating and maintaining this
                    demographic patient record.
                  </p>

                  <FieldError
                    id={`${formId}-consent-error`}
                    message={
                      errors.consentAcknowledged?.message
                    }
                  />
                </div>
              </div>
            </section>
          )}

          <div className="flex items-start gap-2 rounded-lg border bg-slate-50 p-3 text-xs text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-teal-700"
              aria-hidden="true"
            />

            <p>
              This development phase saves changes only in
              temporary browser memory. No production clinical
              database is connected.
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
                  : "Registering"}
              </>
            ) : isEditMode ? (
              <>
                <Save aria-hidden="true" />
                Save changes
              </>
            ) : (
              <>
                <UserPlus aria-hidden="true" />
                Register patient
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
