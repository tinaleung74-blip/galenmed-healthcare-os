"use client"

import {
  useEffect,
  type ChangeEvent,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Controller,
  useForm,
  useWatch,
} from "react-hook-form"
import {
  FlaskConical,
  LoaderCircle,
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
  LABORATORY_ORDER_PRIORITY_LABELS,
  LABORATORY_ORDER_SOURCE_LABELS,
  LABORATORY_SPECIMEN_TYPE_LABELS,
  LABORATORY_TEST_CATALOG,
} from "@/features/laboratory/constants/laboratory.constants"
import {
  laboratoryOrderFormSchema,
  type LaboratoryOrderFormValues,
} from "@/features/laboratory/schemas/laboratory-order.schema"
import {
  LABORATORY_ORDER_PRIORITIES,
  LABORATORY_ORDER_SOURCES,
} from "@/features/laboratory/types/laboratory.types"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"
import {
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface LaboratoryOrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  onSubmitOrder: (
    values: LaboratoryOrderFormValues
  ) => Promise<void>
}

const EMPTY_ORDER_VALUES:
  LaboratoryOrderFormValues = {
  patientId: "",
  consultationId: "",
  branchId:
    GALENMED_BRANCHES[0]?.id ?? "",
  orderedByName: "",
  priority: "routine",
  source: "outpatient",
  selectedTestCodes: [],
  clinicalIndication: "",
  fastingRequired: false,
  patientInstructions: "",
  internalNotes: "",
}

interface FieldErrorProps {
  message?: string
}

function FieldError({
  message,
}: FieldErrorProps) {
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

export function LaboratoryOrderFormDialog({
  open,
  onOpenChange,
  onSubmitOrder,
}: LaboratoryOrderFormDialogProps) {
  const { patients } = usePatients()
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
  } = useForm<LaboratoryOrderFormValues>({
    resolver: zodResolver(
      laboratoryOrderFormSchema
    ),
    defaultValues: EMPTY_ORDER_VALUES,
    mode: "onTouched",
  })

  const patientId = useWatch({
    control,
    name: "patientId",
  })

  const source = useWatch({
    control,
    name: "source",
  })

  const selectedTestCodes =
    useWatch({
      control,
      name: "selectedTestCodes",
    }) ?? []

  useEffect(() => {
    if (open) {
      reset(EMPTY_ORDER_VALUES)
    }
  }, [open, reset])

  const activePatients =
    patients
      .filter(
        (patient) =>
          patient.status !== "archived"
      )
      .sort((first, second) =>
        getPatientFullName(first).localeCompare(
          getPatientFullName(second),
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
        (first, second) =>
          new Date(
            second.scheduledAt
          ).getTime() -
          new Date(
            first.scheduledAt
          ).getTime()
      )

  const selectedTests =
    LABORATORY_TEST_CATALOG.filter(
      (test) =>
        selectedTestCodes.includes(
          test.code
        )
    )

  const catalogRequiresFasting =
    selectedTests.some(
      (test) =>
        test.requiresFasting
    )

  const patientRegistration =
    register("patientId")

  const sourceRegistration =
    register("source")

  function handlePatientChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    patientRegistration.onChange(event)

    setValue("consultationId", "", {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleSourceChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    sourceRegistration.onChange(event)

    if (
      event.target.value !==
      "consultation"
    ) {
      setValue("consultationId", "", {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  async function submitOrder(
    values: LaboratoryOrderFormValues
  ) {
    try {
      await onSubmitOrder(values)

      reset(EMPTY_ORDER_VALUES)
      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "The laboratory order could not be created.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <FlaskConical
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Create laboratory order
          </DialogTitle>

          <DialogDescription>
            Select the patient, source,
            ordering clinician, laboratory
            tests, priority, and clinical
            indication.
          </DialogDescription>
        </DialogHeader>

        <form
          id="laboratory-order-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitOrder
          )}
        >
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Patient and order source
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="laboratory-patient">
                  Patient
                </Label>

                <select
                  id="laboratory-patient"
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
                    errors.patientId?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="laboratory-branch">
                  Laboratory branch
                </Label>

                <select
                  id="laboratory-branch"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register("branchId")}
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
                <Label htmlFor="laboratory-source">
                  Order source
                </Label>

                <select
                  id="laboratory-source"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...sourceRegistration}
                  onChange={
                    handleSourceChange
                  }
                >
                  {LABORATORY_ORDER_SOURCES.map(
                    (orderSource) => (
                      <option
                        key={orderSource}
                        value={orderSource}
                      >
                        {
                          LABORATORY_ORDER_SOURCE_LABELS[
                            orderSource
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {source === "consultation" ? (
                <div className="space-y-2">
                  <Label htmlFor="laboratory-consultation">
                    Linked consultation
                  </Label>

                  <select
                    id="laboratory-consultation"
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
                          key={consultation.id}
                          value={consultation.id}
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
                      errors.consultationId
                        ?.message
                    }
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Request information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="laboratory-ordered-by">
                  Ordering clinician or requester
                </Label>

                <Input
                  id="laboratory-ordered-by"
                  placeholder="Example: Dr. Rafael Cruz"
                  {...register(
                    "orderedByName"
                  )}
                />

                <FieldError
                  message={
                    errors.orderedByName
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="laboratory-priority">
                  Priority
                </Label>

                <select
                  id="laboratory-priority"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register("priority")}
                >
                  {LABORATORY_ORDER_PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {
                          LABORATORY_ORDER_PRIORITY_LABELS[
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
              <Label htmlFor="laboratory-indication">
                Clinical indication
              </Label>

              <Textarea
                id="laboratory-indication"
                rows={3}
                placeholder="Document the reason for the requested tests."
                {...register(
                  "clinicalIndication"
                )}
              />

              <FieldError
                message={
                  errors.clinicalIndication
                    ?.message
                }
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Laboratory test catalog
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Select one or more tests.
              </p>
            </div>

            <Controller
              control={control}
              name="selectedTestCodes"
              render={({ field }) => (
                <div className="grid gap-3 md:grid-cols-2">
                  {LABORATORY_TEST_CATALOG.map(
                    (test) => {
                      const checked =
                        field.value.includes(
                          test.code
                        )

                      return (
                        <label
                          key={test.code}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            className="mt-1 size-4 accent-teal-700"
                            onChange={(event) => {
                              const nextValue =
                                event.target.checked
                                  ? [
                                      ...field.value,
                                      test.code,
                                    ]
                                  : field.value.filter(
                                      (
                                        currentCode
                                      ) =>
                                        currentCode !==
                                        test.code
                                    )

                              field.onChange(
                                nextValue
                              )
                            }}
                          />

                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              {test.name}
                            </span>

                            <span className="mt-1 block font-mono text-xs text-teal-700">
                              {test.code}
                            </span>

                            <span className="mt-1 block text-xs text-muted-foreground">
                              {test.category}
                              {" · "}
                              {
                                LABORATORY_SPECIMEN_TYPE_LABELS[
                                  test.specimenType
                                ]
                              }
                              {" · "}
                              {
                                test.estimatedTurnaroundMinutes
                              }{" "}
                              minutes
                            </span>

                            {test.requiresFasting ? (
                              <span className="mt-1 block text-xs font-medium text-amber-700">
                                Fasting required
                              </span>
                            ) : null}
                          </span>
                        </label>
                      )
                    }
                  )}
                </div>
              )}
            />

            <FieldError
              message={
                errors.selectedTestCodes
                  ?.message
              }
            />
          </section>

          <section className="space-y-4 border-t pt-5">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-teal-700"
                {...register(
                  "fastingRequired"
                )}
              />

              <span>
                <span className="block text-sm font-medium">
                  Fasting preparation required
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  {catalogRequiresFasting
                    ? "At least one selected test requires fasting. The provider will preserve this requirement."
                    : "Enable when the ordering clinician requires fasting preparation."}
                </span>
              </span>
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="laboratory-patient-instructions">
                  Patient instructions
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Textarea
                  id="laboratory-patient-instructions"
                  rows={4}
                  {...register(
                    "patientInstructions"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="laboratory-internal-notes">
                  Internal notes
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Textarea
                  id="laboratory-internal-notes"
                  rows={4}
                  {...register(
                    "internalNotes"
                  )}
                />
              </div>
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This order remains synthetic
              development data. Test catalog,
              specimen rules, and turnaround
              times are not production laboratory
              master data.
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
            form="laboratory-order-form"
            disabled={isSubmitting}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Creating order
              </>
            ) : (
              <>
                <FlaskConical
                  aria-hidden="true"
                />
                Create laboratory order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
