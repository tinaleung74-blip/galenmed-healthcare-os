"use client"

import {
  useEffect,
  type ChangeEvent,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form"
import {
  LoaderCircle,
  Pill,
  Plus,
  ShieldCheck,
  Trash2,
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
  PHARMACY_DOSAGE_FORM_LABELS,
  PHARMACY_MEDICATION_CATALOG,
  PHARMACY_MEDICATION_ROUTE_LABELS,
  PHARMACY_PRESCRIPTION_PRIORITY_LABELS,
  PHARMACY_PRESCRIPTION_SOURCE_LABELS,
} from "@/features/pharmacy/constants/pharmacy.constants"
import {
  pharmacyPrescriptionFormSchema,
  type PharmacyPrescriptionFormValues,
} from "@/features/pharmacy/schemas/pharmacy-prescription.schema"
import {
  PHARMACY_MEDICATION_ROUTES,
  PHARMACY_PRESCRIPTION_PRIORITIES,
  PHARMACY_PRESCRIPTION_SOURCES,
} from "@/features/pharmacy/types/pharmacy.types"
import {
  useConsultations,
} from "@/features/consultations/providers/consultation-provider"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import {
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface PharmacyPrescriptionFormDialogProps {
  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitPrescription: (
    values:
      PharmacyPrescriptionFormValues
  ) => Promise<void>
}

const EMPTY_MEDICATION_ITEM:
  PharmacyPrescriptionFormValues["items"][number] =
  {
    medicationId: "",
    dose: "",
    route: "oral",
    frequency: "",
    durationDays: "",
    quantityPrescribed: "1",
    instructions: "",
    substitutionAllowed: true,
  }

const EMPTY_PRESCRIPTION_VALUES:
  PharmacyPrescriptionFormValues = {
  patientId: "",
  consultationId: "",

  branchId:
    GALENMED_BRANCHES[0]?.id ??
    "",

  prescriberName: "",

  source: "outpatient",
  priority: "routine",

  clinicalNotes: "",

  items: [
    {
      ...EMPTY_MEDICATION_ITEM,
    },
  ],
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

export function PharmacyPrescriptionFormDialog({
  open,
  onOpenChange,
  onSubmitPrescription,
}: PharmacyPrescriptionFormDialogProps) {
  const { patients } =
    usePatients()

  const { consultations } =
    useConsultations()

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
    useForm<PharmacyPrescriptionFormValues>(
      {
        resolver: zodResolver(
          pharmacyPrescriptionFormSchema
        ),

        defaultValues:
          EMPTY_PRESCRIPTION_VALUES,

        mode: "onTouched",
      }
    )

  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "items",
  })

  const patientId =
    useWatch({
      control,
      name: "patientId",
    })

  const source =
    useWatch({
      control,
      name: "source",
    })

  const watchedItems =
    useWatch({
      control,
      name: "items",
    }) ?? []

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_PRESCRIPTION_VALUES
      )
    }
  }, [open, reset])

  const activePatients =
    patients
      .filter(
        (patient) =>
          patient.status !==
          "archived"
      )
      .sort(
        (
          firstPatient,
          secondPatient
        ) =>
          getPatientFullName(
            firstPatient
          ).localeCompare(
            getPatientFullName(
              secondPatient
            ),
            "en-PH"
          )
      )

  const availableConsultations =
    consultations
      .filter(
        (consultation) =>
          consultation.patientId ===
            patientId &&
          consultation.status !==
            "cancelled" &&
          consultation.status !==
            "no-show"
      )
      .sort(
        (
          firstConsultation,
          secondConsultation
        ) =>
          new Date(
            secondConsultation.scheduledAt
          ).getTime() -
          new Date(
            firstConsultation.scheduledAt
          ).getTime()
      )

  const patientRegistration =
    register("patientId")

  const sourceRegistration =
    register("source")

  function handlePatientChange(
    event:
      ChangeEvent<HTMLSelectElement>
  ) {
    patientRegistration.onChange(
      event
    )

    setValue(
      "consultationId",
      "",
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  function handleSourceChange(
    event:
      ChangeEvent<HTMLSelectElement>
  ) {
    sourceRegistration.onChange(
      event
    )

    if (
      event.target.value !==
      "consultation"
    ) {
      setValue(
        "consultationId",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      )
    }
  }

  async function submitPrescription(
    values:
      PharmacyPrescriptionFormValues
  ) {
    try {
      await onSubmitPrescription(
        values
      )

      reset(
        EMPTY_PRESCRIPTION_VALUES
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The pharmacy prescription could not be created.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Pill
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Create pharmacy prescription
          </DialogTitle>

          <DialogDescription>
            Select a patient, source,
            prescriber, and one or more
            synthetic medication items.
          </DialogDescription>
        </DialogHeader>

        <form
          id="pharmacy-prescription-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitPrescription
          )}
        >
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Patient and prescription source
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pharmacy-patient">
                  Patient
                </Label>

                <select
                  id="pharmacy-patient"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...patientRegistration}
                  onChange={
                    handlePatientChange
                  }
                >
                  <option value="">
                    Select patient
                  </option>

                  {activePatients.map(
                    (patient) => (
                      <option
                        key={patient.id}
                        value={patient.id}
                      >
                        {getPatientFullName(
                          patient
                        )}
                        {" — "}
                        {
                          patient.medicalRecordNumber
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  message={
                    errors.patientId
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pharmacy-branch">
                  Pharmacy branch
                </Label>

                <select
                  id="pharmacy-branch"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "branchId"
                  )}
                >
                  {GALENMED_BRANCHES.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pharmacy-source">
                  Prescription source
                </Label>

                <select
                  id="pharmacy-source"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...sourceRegistration}
                  onChange={
                    handleSourceChange
                  }
                >
                  {PHARMACY_PRESCRIPTION_SOURCES.map(
                    (
                      prescriptionSource
                    ) => (
                      <option
                        key={
                          prescriptionSource
                        }
                        value={
                          prescriptionSource
                        }
                      >
                        {
                          PHARMACY_PRESCRIPTION_SOURCE_LABELS[
                            prescriptionSource
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {source ===
              "consultation" ? (
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-consultation">
                    Linked consultation
                  </Label>

                  <select
                    id="pharmacy-consultation"
                    disabled={!patientId}
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm disabled:opacity-50"
                    {...register(
                      "consultationId"
                    )}
                  >
                    <option value="">
                      Select consultation
                    </option>

                    {availableConsultations.map(
                      (consultation) => (
                        <option
                          key={
                            consultation.id
                          }
                          value={
                            consultation.id
                          }
                        >
                          {
                            consultation.consultationNumber
                          }
                          {" — "}
                          {
                            consultation.doctorName
                          }
                        </option>
                      )
                    )}
                  </select>

                  <FieldError
                    message={
                      errors
                        .consultationId
                        ?.message
                    }
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Prescriber and priority
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pharmacy-prescriber">
                  Prescriber or authorized requester
                </Label>

                <Input
                  id="pharmacy-prescriber"
                  placeholder="Example: Dr. Maria Santos"
                  {...register(
                    "prescriberName"
                  )}
                />

                <FieldError
                  message={
                    errors.prescriberName
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pharmacy-priority">
                  Priority
                </Label>

                <select
                  id="pharmacy-priority"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "priority"
                  )}
                >
                  {PHARMACY_PRESCRIPTION_PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {
                          PHARMACY_PRESCRIPTION_PRIORITY_LABELS[
                            priority
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacy-clinical-notes">
                Clinical notes
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="pharmacy-clinical-notes"
                rows={3}
                {...register(
                  "clinicalNotes"
                )}
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Medication items
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Synthetic catalog and
                  workflow data only.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  fields.length >= 20
                }
                onClick={() =>
                  append({
                    ...EMPTY_MEDICATION_ITEM,
                  })
                }
              >
                <Plus aria-hidden="true" />
                Add medication
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map(
                (field, index) => {
                  const selectedMedicationId =
                    watchedItems[index]
                      ?.medicationId ?? ""

                  const selectedMedication =
                    PHARMACY_MEDICATION_CATALOG.find(
                      (medication) =>
                        medication.id ===
                        selectedMedicationId
                    ) ?? null

                  const medicationRegistration =
                    register(
                      `items.${index}.medicationId` as const
                    )

                  return (
                    <article
                      key={field.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">
                          Medication{" "}
                          {index + 1}
                        </p>

                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          disabled={
                            fields.length ===
                            1
                          }
                          aria-label={`Remove medication ${index + 1}`}
                          onClick={() =>
                            remove(index)
                          }
                        >
                          <Trash2
                            aria-hidden="true"
                          />
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label>
                            Medication
                          </Label>

                          <select
                            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                            {...medicationRegistration}
                            onChange={(
                              event
                            ) => {
                              medicationRegistration.onChange(
                                event
                              )

                              const medication =
                                PHARMACY_MEDICATION_CATALOG.find(
                                  (
                                    candidateMedication
                                  ) =>
                                    candidateMedication.id ===
                                    event.target.value
                                )

                              if (
                                medication
                              ) {
                                setValue(
                                  `items.${index}.route` as const,
                                  medication.defaultRoute,
                                  {
                                    shouldDirty:
                                      true,

                                    shouldValidate:
                                      true,
                                  }
                                )
                              }
                            }}
                          >
                            <option value="">
                              Select medication
                            </option>

                            {PHARMACY_MEDICATION_CATALOG.map(
                              (
                                medication
                              ) => (
                                <option
                                  key={
                                    medication.id
                                  }
                                  value={
                                    medication.id
                                  }
                                >
                                  {
                                    medication.genericName
                                  }
                                  {" — "}
                                  {
                                    medication.strength
                                  }
                                  {" — "}
                                  {
                                    PHARMACY_DOSAGE_FORM_LABELS[
                                      medication.dosageForm
                                    ]
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <FieldError
                            message={
                              errors.items?.[
                                index
                              ]?.medicationId
                                ?.message
                            }
                          />
                        </div>

                        {selectedMedication ? (
                          <div className="rounded-lg border bg-slate-50 p-3 text-xs sm:col-span-2">
                            <strong>
                              {
                                selectedMedication.genericName
                              }{" "}
                              {
                                selectedMedication.strength
                              }
                            </strong>

                            <span className="ml-2 text-muted-foreground">
                              {
                                selectedMedication.sku
                              }
                              {" · "}
                              {
                                selectedMedication.unitOfMeasure
                              }
                            </span>
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <Label>
                            Dose
                          </Label>

                          <Input
                            placeholder="Synthetic recorded dose"
                            {...register(
                              `items.${index}.dose` as const
                            )}
                          />

                          <FieldError
                            message={
                              errors.items?.[
                                index
                              ]?.dose
                                ?.message
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Route
                          </Label>

                          <select
                            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                            {...register(
                              `items.${index}.route` as const
                            )}
                          >
                            {PHARMACY_MEDICATION_ROUTES.map(
                              (route) => (
                                <option
                                  key={route}
                                  value={route}
                                >
                                  {
                                    PHARMACY_MEDICATION_ROUTE_LABELS[
                                      route
                                    ]
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Frequency
                          </Label>

                          <Input
                            placeholder="Example: Once daily"
                            {...register(
                              `items.${index}.frequency` as const
                            )}
                          />

                          <FieldError
                            message={
                              errors.items?.[
                                index
                              ]?.frequency
                                ?.message
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Duration in days
                            <span className="ml-1 font-normal text-muted-foreground">
                              Optional
                            </span>
                          </Label>

                          <Input
                            type="number"
                            min={1}
                            max={365}
                            inputMode="numeric"
                            {...register(
                              `items.${index}.durationDays` as const
                            )}
                          />

                          <FieldError
                            message={
                              errors.items?.[
                                index
                              ]?.durationDays
                                ?.message
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Quantity prescribed
                          </Label>

                          <Input
                            type="number"
                            min={1}
                            max={10000}
                            inputMode="numeric"
                            {...register(
                              `items.${index}.quantityPrescribed` as const
                            )}
                          />

                          <FieldError
                            message={
                              errors.items?.[
                                index
                              ]?.quantityPrescribed
                                ?.message
                            }
                          />
                        </div>

                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-slate-50 p-3">
                          <input
                            type="checkbox"
                            className="mt-0.5 size-4 accent-teal-700"
                            {...register(
                              `items.${index}.substitutionAllowed` as const
                            )}
                          />

                          <span className="text-sm">
                            Substitution allowed
                          </span>
                        </label>

                        <div className="space-y-2 sm:col-span-2">
                          <Label>
                            Medication instructions
                          </Label>

                          <Textarea
                            rows={3}
                            {...register(
                              `items.${index}.instructions` as const
                            )}
                          />

                          <FieldError
                            message={
                              errors.items?.[
                                index
                              ]?.instructions
                                ?.message
                            }
                          />
                        </div>
                      </div>
                    </article>
                  )
                }
              )}
            </div>

            <FieldError
              message={
                errors.items?.root
                  ?.message
              }
            />
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              The medication catalog,
              doses, frequencies,
              instructions, and workflow
              records are synthetic
              development data. This is not
              prescribing guidance.
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
            form="pharmacy-prescription-form"
            disabled={isSubmitting}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Creating prescription
              </>
            ) : (
              <>
                <Pill aria-hidden="true" />
                Create prescription
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
