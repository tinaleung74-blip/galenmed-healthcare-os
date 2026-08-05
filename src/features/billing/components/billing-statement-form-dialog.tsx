"use client"

import {
  useEffect,
  useMemo,
  type ChangeEvent,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  FileText,
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
  BillingChargeSourceBadge,
  BillingChargeStatusBadge,
} from "@/features/billing/components/billing-status-badges"
import {
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import {
  useBilling,
} from "@/features/billing/providers/billing-provider"
import {
  billingStatementFormSchema,
  type BillingStatementFormValues,
} from "@/features/billing/schemas/billing-statement.schema"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import {
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface BillingStatementFormDialogProps {
  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitStatement: (
    values:
      BillingStatementFormValues
  ) => Promise<void>
}

const EMPTY_STATEMENT_VALUES:
  BillingStatementFormValues = {
  patientId: "",

  branchId:
    GALENMED_BRANCHES[0]?.id ??
    "",

  chargeIds: [],

  notes: "",

  createdBy: "",
}

export function BillingStatementFormDialog({
  open,
  onOpenChange,
  onSubmitStatement,
}: BillingStatementFormDialogProps) {
  const { patients } =
    usePatients()

  const {
    charges,
    statements,
  } = useBilling()

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
    useForm<BillingStatementFormValues>(
      {
        resolver: zodResolver(
          billingStatementFormSchema
        ),

        defaultValues:
          EMPTY_STATEMENT_VALUES,

        mode: "onTouched",
      }
    )

  const patientId =
    useWatch({
      control,
      name: "patientId",
    })

  const branchId =
    useWatch({
      control,
      name: "branchId",
    })

  const selectedChargeIds =
    useWatch({
      control,
      name: "chargeIds",
    }) ?? []

  useEffect(() => {
    if (open) {
      reset({
        ...EMPTY_STATEMENT_VALUES,
        chargeIds: [],
      })
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

  const usedChargeIds =
    useMemo(
      () =>
        new Set(
          statements
            .filter(
              (statement) =>
                statement.status !==
                "voided"
            )
            .flatMap(
              (statement) =>
                statement.chargeIds
            )
        ),
      [statements]
    )

  const availableCharges =
    useMemo(
      () =>
        charges
          .filter(
            (charge) =>
              charge.status ===
                "posted" &&
              charge.patientId ===
                patientId &&
              charge.branchId ===
                branchId &&
              !usedChargeIds.has(
                charge.id
              )
          )
          .sort(
            (
              firstCharge,
              secondCharge
            ) =>
              new Date(
                firstCharge.postedAt ??
                  firstCharge.createdAt
              ).getTime() -
              new Date(
                secondCharge.postedAt ??
                  secondCharge.createdAt
              ).getTime()
          ),
      [
        branchId,
        charges,
        patientId,
        usedChargeIds,
      ]
    )

  const selectedCharges =
    availableCharges.filter(
      (charge) =>
        selectedChargeIds.includes(
          charge.id
        )
    )

  const selectedGrossAmount =
    selectedCharges.reduce(
      (
        total,
        charge
      ) =>
        total +
        charge.grossAmountCentavos,
      0
    )

  const patientRegistration =
    register("patientId")

  const branchRegistration =
    register("branchId")

  function clearSelectedCharges() {
    setValue(
      "chargeIds",
      [],
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  function handlePatientChange(
    event:
      ChangeEvent<HTMLSelectElement>
  ) {
    patientRegistration.onChange(
      event
    )

    clearSelectedCharges()
  }

  function handleBranchChange(
    event:
      ChangeEvent<HTMLSelectElement>
  ) {
    branchRegistration.onChange(
      event
    )

    clearSelectedCharges()
  }

  function toggleCharge(
    chargeId: string,
    selected: boolean
  ) {
    const nextChargeIds =
      selected
        ? Array.from(
            new Set([
              ...selectedChargeIds,
              chargeId,
            ])
          )
        : selectedChargeIds.filter(
            (selectedChargeId) =>
              selectedChargeId !==
              chargeId
          )

    setValue(
      "chargeIds",
      nextChargeIds,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  function selectAllCharges() {
    setValue(
      "chargeIds",
      availableCharges.map(
        (charge) => charge.id
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  async function submitStatement(
    values:
      BillingStatementFormValues
  ) {
    try {
      await onSubmitStatement(
        values
      )

      reset({
        ...EMPTY_STATEMENT_VALUES,
        chargeIds: [],
      })

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The draft billing statement could not be created.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <FileText
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Create draft billing statement
          </DialogTitle>

          <DialogDescription>
            Select one patient and one or
            more posted charges that are not
            assigned to another active
            statement.
          </DialogDescription>
        </DialogHeader>

        <form
          id="billing-statement-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitStatement
          )}
        >
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billing-statement-patient">
                Patient
              </Label>

              <select
                id="billing-statement-patient"
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

              {errors.patientId
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.patientId
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-statement-branch">
                Billing branch
              </Label>

              <select
                id="billing-statement-branch"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...branchRegistration}
                onChange={
                  handleBranchChange
                }
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
          </section>

          <section className="space-y-4 border-t pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Available posted charges
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Only unassigned posted
                  charges for the selected
                  patient and branch appear.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    availableCharges.length ===
                    0
                  }
                  onClick={
                    selectAllCharges
                  }
                >
                  Select all
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={
                    selectedChargeIds.length ===
                    0
                  }
                  onClick={
                    clearSelectedCharges
                  }
                >
                  Clear
                </Button>
              </div>
            </div>

            {!patientId ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Select a patient to view
                available charges.
              </div>
            ) : availableCharges.length ===
              0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No unassigned posted charges
                are available for the
                selected patient and branch.
              </div>
            ) : (
              <div className="space-y-3">
                {availableCharges.map(
                  (charge) => {
                    const selected =
                      selectedChargeIds.includes(
                        charge.id
                      )

                    return (
                      <label
                        key={charge.id}
                        className={
                          selected
                            ? "flex cursor-pointer items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/50 p-4"
                            : "flex cursor-pointer items-start gap-3 rounded-xl border p-4"
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          className="mt-1 size-4 accent-sky-700"
                          onChange={(
                            event
                          ) =>
                            toggleCharge(
                              charge.id,
                              event.target
                                .checked
                            )
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-xs font-medium">
                              {
                                charge.chargeNumber
                              }
                            </p>

                            <BillingChargeSourceBadge
                              source={
                                charge.source
                              }
                            />

                            <BillingChargeStatusBadge
                              status={
                                charge.status
                              }
                            />
                          </div>

                          <p className="mt-2 text-sm font-medium">
                            {
                              charge.description
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Quantity{" "}
                            {charge.quantity}
                            {" · "}
                            Unit amount{" "}
                            {formatBillingAmount(
                              charge.unitAmountCentavos
                            )}
                            {charge.sourceReference
                              ? ` · ${charge.sourceReference}`
                              : ""}
                          </p>
                        </div>

                        <p className="shrink-0 font-semibold">
                          {formatBillingAmount(
                            charge.grossAmountCentavos
                          )}
                        </p>
                      </label>
                    )
                  }
                )}
              </div>
            )}

            {errors.chargeIds
              ?.message ? (
              <p
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {
                  errors.chargeIds
                    .message
                }
              </p>
            ) : null}
          </section>

          <section className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billing-statement-created-by">
                Created by
              </Label>

              <Input
                id="billing-statement-created-by"
                placeholder="Synthetic Billing Officer"
                {...register(
                  "createdBy"
                )}
              />

              {errors.createdBy
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.createdBy
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Selected gross amount
              </p>

              <p className="mt-1 text-xl font-semibold">
                {formatBillingAmount(
                  selectedGrossAmount
                )}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {selectedCharges.length}
                {" charge"}
                {selectedCharges.length ===
                1
                  ? ""
                  : "s"}{" "}
                selected
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="billing-statement-notes">
                Statement notes
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="billing-statement-notes"
                rows={3}
                {...register("notes")}
              />
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {BILLING_SYNTHETIC_NOTICE}
              The statement remains draft
              until explicitly issued.
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
            form="billing-statement-form"
            disabled={isSubmitting}
            className="bg-sky-700 text-white hover:bg-sky-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Creating statement
              </>
            ) : (
              <>
                <FileText
                  aria-hidden="true"
                />
                Create draft statement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
