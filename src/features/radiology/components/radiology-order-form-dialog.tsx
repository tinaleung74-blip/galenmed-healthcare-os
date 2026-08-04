"use client"

import {
  useEffect,
  type ChangeEvent,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  LoaderCircle,
  ScanLine,
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
  RADIOLOGY_CONTRAST_PROTOCOL_LABELS,
  RADIOLOGY_MODALITY_LABELS,
  RADIOLOGY_ORDER_PRIORITY_LABELS,
  RADIOLOGY_ORDER_SOURCE_LABELS,
  RADIOLOGY_PROCEDURE_CATALOG,
} from "@/features/radiology/constants/radiology.constants"
import {
  radiologyOrderFormSchema,
  type RadiologyOrderFormValues,
} from "@/features/radiology/schemas/radiology-order.schema"
import {
  RADIOLOGY_ORDER_PRIORITIES,
  RADIOLOGY_ORDER_SOURCES,
} from "@/features/radiology/types/radiology.types"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"
import {
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface RadiologyOrderFormDialogProps {
  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitOrder: (
    values: RadiologyOrderFormValues
  ) => Promise<void>
}

const EMPTY_ORDER_VALUES:
  RadiologyOrderFormValues = {
  patientId: "",

  consultationId: "",

  branchId:
    GALENMED_BRANCHES[0]?.id ??
    "",

  orderedByName: "",

  priority: "routine",

  source: "outpatient",

  procedureCode: "",

  clinicalIndication: "",

  specialInstructions: "",
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

export function RadiologyOrderFormDialog({
  open,
  onOpenChange,
  onSubmitOrder,
}: RadiologyOrderFormDialogProps) {
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
    useForm<RadiologyOrderFormValues>(
      {
        resolver: zodResolver(
          radiologyOrderFormSchema
        ),

        defaultValues:
          EMPTY_ORDER_VALUES,

        mode: "onTouched",
      }
    )

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

  const procedureCode =
    useWatch({
      control,
      name: "procedureCode",
    })

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_ORDER_VALUES
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
        (firstPatient, secondPatient) =>
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

  const selectedProcedure =
    RADIOLOGY_PROCEDURE_CATALOG.find(
      (procedure) =>
        procedure.code ===
        procedureCode
    ) ?? null

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

  async function submitOrder(
    values:
      RadiologyOrderFormValues
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
            : "The radiology order could not be created.",
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
            <ScanLine
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Create radiology order
          </DialogTitle>

          <DialogDescription>
            Select the patient,
            procedure, priority, source,
            and clinical indication.
          </DialogDescription>
        </DialogHeader>

        <form
          id="radiology-order-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitOrder
          )}
        >
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Patient and source
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="radiology-patient">
                  Patient
                </Label>

                <select
                  id="radiology-patient"
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
                <Label htmlFor="radiology-branch">
                  Radiology branch
                </Label>

                <select
                  id="radiology-branch"
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
                <Label htmlFor="radiology-source">
                  Order source
                </Label>

                <select
                  id="radiology-source"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...sourceRegistration}
                  onChange={
                    handleSourceChange
                  }
                >
                  {RADIOLOGY_ORDER_SOURCES.map(
                    (orderSource) => (
                      <option
                        key={orderSource}
                        value={orderSource}
                      >
                        {
                          RADIOLOGY_ORDER_SOURCE_LABELS[
                            orderSource
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
                  <Label htmlFor="radiology-consultation">
                    Linked consultation
                  </Label>

                  <select
                    id="radiology-consultation"
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
              Imaging request
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="radiology-ordered-by">
                  Ordering clinician or requester
                </Label>

                <Input
                  id="radiology-ordered-by"
                  placeholder="Example: Dr. Rafael Cruz"
                  {...register(
                    "orderedByName"
                  )}
                />

                <FieldError
                  message={
                    errors
                      .orderedByName
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radiology-priority">
                  Priority
                </Label>

                <select
                  id="radiology-priority"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "priority"
                  )}
                >
                  {RADIOLOGY_ORDER_PRIORITIES.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {
                          RADIOLOGY_ORDER_PRIORITY_LABELS[
                            priority
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="radiology-procedure">
                  Imaging procedure
                </Label>

                <select
                  id="radiology-procedure"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "procedureCode"
                  )}
                >
                  <option value="">
                    Select procedure
                  </option>

                  {RADIOLOGY_PROCEDURE_CATALOG.map(
                    (procedure) => (
                      <option
                        key={procedure.code}
                        value={procedure.code}
                      >
                        {procedure.name}
                        {" — "}
                        {
                          RADIOLOGY_MODALITY_LABELS[
                            procedure.modality
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  message={
                    errors.procedureCode
                      ?.message
                  }
                />
              </div>
            </div>

            {selectedProcedure ? (
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Modality
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        RADIOLOGY_MODALITY_LABELS[
                          selectedProcedure.modality
                        ]
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Body region
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedProcedure.bodyRegion
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Default duration
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedProcedure.defaultDurationMinutes
                      }{" "}
                      minutes
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Contrast
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        RADIOLOGY_CONTRAST_PROTOCOL_LABELS[
                          selectedProcedure.contrastProtocol
                        ]
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Preparation checklist
                  </p>

                  <ul className="mt-2 space-y-1 text-sm">
                    {selectedProcedure.preparationItems.map(
                      (item) => (
                        <li
                          key={item.code}
                        >
                          • {item.label}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="radiology-indication">
                Clinical indication
              </Label>

              <Textarea
                id="radiology-indication"
                rows={4}
                placeholder="Document the clinical reason for the imaging request."
                {...register(
                  "clinicalIndication"
                )}
              />

              <FieldError
                message={
                  errors
                    .clinicalIndication
                    ?.message
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radiology-special-instructions">
                Special instructions
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="radiology-special-instructions"
                rows={3}
                {...register(
                  "specialInstructions"
                )}
              />
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Procedure rules,
              preparation requirements,
              contrast protocols, and
              durations are synthetic
              development configuration.
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
            form="radiology-order-form"
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
                <ScanLine
                  aria-hidden="true"
                />
                Create radiology order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
