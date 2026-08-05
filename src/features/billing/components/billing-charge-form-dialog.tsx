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
  CreditCard,
  LoaderCircle,
  Plus,
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
  BILLING_CHARGE_CATALOG,
  BILLING_CHARGE_SOURCE_LABELS,
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import {
  billingChargeFormSchema,
  type BillingChargeFormValues,
} from "@/features/billing/schemas/billing-charge.schema"
import {
  BILLING_CHARGE_SOURCES,
} from "@/features/billing/types/billing.types"
import {
  calculateBillingChargeGrossAmount,
  formatBillingAmount,
  parsePhilippinePesoToCentavos,
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

interface BillingChargeFormDialogProps {
  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitCharge: (
    values:
      BillingChargeFormValues
  ) => Promise<void>
}

const EMPTY_CHARGE_VALUES:
  BillingChargeFormValues = {
  patientId: "",

  branchId:
    GALENMED_BRANCHES[0]?.id ??
    "",

  source: "manual",

  sourceRecordId: "",
  sourceReference: "",

  catalogCode:
    "BILL-MANUAL-MISC",

  description:
    "Synthetic Manual Miscellaneous Charge",

  quantity: "1",

  unitAmountPhp: "",

  notes: "",

  postedBy: "",
}

function centavosToInputValue(
  amountCentavos:
    number | null
): string {
  if (amountCentavos === null) {
    return ""
  }

  return (
    amountCentavos / 100
  ).toFixed(2)
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

export function BillingChargeFormDialog({
  open,
  onOpenChange,
  onSubmitCharge,
}: BillingChargeFormDialogProps) {
  const { patients } =
    usePatients()

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
    useForm<BillingChargeFormValues>(
      {
        resolver: zodResolver(
          billingChargeFormSchema
        ),

        defaultValues:
          EMPTY_CHARGE_VALUES,

        mode: "onTouched",
      }
    )

  const source =
    useWatch({
      control,
      name: "source",
    })

  const catalogCode =
    useWatch({
      control,
      name: "catalogCode",
    })

  const quantity =
    useWatch({
      control,
      name: "quantity",
    })

  const unitAmountPhp =
    useWatch({
      control,
      name: "unitAmountPhp",
    })

  useEffect(() => {
    if (open) {
      reset({
        ...EMPTY_CHARGE_VALUES,
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

  const availableCatalogItems =
    BILLING_CHARGE_CATALOG.filter(
      (item) =>
        item.active &&
        item.source === source
    )

  const selectedCatalogItem =
    BILLING_CHARGE_CATALOG.find(
      (item) =>
        item.code === catalogCode
    ) ?? null

  const grossAmountPreview =
    useMemo(() => {
      try {
        const parsedQuantity =
          Number(quantity)

        if (
          !Number.isInteger(
            parsedQuantity
          ) ||
          parsedQuantity < 1 ||
          !unitAmountPhp
        ) {
          return null
        }

        const unitAmountCentavos =
          parsePhilippinePesoToCentavos(
            unitAmountPhp
          )

        return calculateBillingChargeGrossAmount(
          parsedQuantity,
          unitAmountCentavos
        )
      } catch {
        return null
      }
    }, [
      quantity,
      unitAmountPhp,
    ])

  const sourceRegistration =
    register("source")

  const catalogRegistration =
    register("catalogCode")

  function applyCatalogItem(
    nextCatalogCode: string
  ) {
    const nextCatalogItem =
      BILLING_CHARGE_CATALOG.find(
        (item) =>
          item.code ===
          nextCatalogCode
      )

    if (!nextCatalogItem) {
      setValue(
        "description",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      )

      setValue(
        "unitAmountPhp",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      )

      return
    }

    setValue(
      "description",
      nextCatalogItem.description,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )

    setValue(
      "unitAmountPhp",
      centavosToInputValue(
        nextCatalogItem
          .defaultUnitAmountCentavos
      ),
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

    const nextSource =
      event.target.value

    const firstCatalogItem =
      BILLING_CHARGE_CATALOG.find(
        (item) =>
          item.active &&
          item.source === nextSource
      )

    const nextCatalogCode =
      firstCatalogItem?.code ??
      ""

    setValue(
      "catalogCode",
      nextCatalogCode,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )

    applyCatalogItem(
      nextCatalogCode
    )

    setValue(
      "sourceRecordId",
      "",
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )

    setValue(
      "sourceReference",
      "",
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  function handleCatalogChange(
    event:
      ChangeEvent<HTMLSelectElement>
  ) {
    catalogRegistration.onChange(
      event
    )

    applyCatalogItem(
      event.target.value
    )
  }

  async function submitCharge(
    values:
      BillingChargeFormValues
  ) {
    try {
      await onSubmitCharge(values)

      reset({
        ...EMPTY_CHARGE_VALUES,
      })

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The patient charge could not be created.",
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
            <CreditCard
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Create patient charge
          </DialogTitle>

          <DialogDescription>
            Post a synthetic charge from an
            appointment, consultation,
            laboratory, radiology, pharmacy,
            or manual billing source.
          </DialogDescription>
        </DialogHeader>

        <form
          id="billing-charge-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitCharge
          )}
        >
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Patient and branch
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billing-charge-patient">
                  Patient
                </Label>

                <select
                  id="billing-charge-patient"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...register(
                    "patientId"
                  )}
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
                <Label htmlFor="billing-charge-branch">
                  Billing branch
                </Label>

                <select
                  id="billing-charge-branch"
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
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Charge source
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billing-charge-source">
                  Source module
                </Label>

                <select
                  id="billing-charge-source"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...sourceRegistration}
                  onChange={
                    handleSourceChange
                  }
                >
                  {BILLING_CHARGE_SOURCES.map(
                    (chargeSource) => (
                      <option
                        key={chargeSource}
                        value={chargeSource}
                      >
                        {
                          BILLING_CHARGE_SOURCE_LABELS[
                            chargeSource
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing-charge-catalog">
                  Charge-catalog item
                </Label>

                <select
                  id="billing-charge-catalog"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  {...catalogRegistration}
                  onChange={
                    handleCatalogChange
                  }
                >
                  <option value="">
                    Select charge item
                  </option>

                  {availableCatalogItems.map(
                    (item) => (
                      <option
                        key={item.code}
                        value={item.code}
                      >
                        {item.description}
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  message={
                    errors.catalogCode
                      ?.message
                  }
                />
              </div>

              {source !== "manual" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="billing-source-record-id">
                      Linked source record ID
                    </Label>

                    <Input
                      id="billing-source-record-id"
                      placeholder="Synthetic linked record identifier"
                      {...register(
                        "sourceRecordId"
                      )}
                    />

                    <FieldError
                      message={
                        errors.sourceRecordId
                          ?.message
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing-source-reference">
                      Display reference
                      <span className="ml-1 font-normal text-muted-foreground">
                        Optional
                      </span>
                    </Label>

                    <Input
                      id="billing-source-reference"
                      placeholder="Example: GM-CON-2026-000010"
                      {...register(
                        "sourceReference"
                      )}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5">
            <h3 className="text-sm font-semibold">
              Charge details
            </h3>

            <div className="space-y-2">
              <Label htmlFor="billing-charge-description">
                Description
              </Label>

              <Input
                id="billing-charge-description"
                readOnly={
                  source !== "manual"
                }
                {...register(
                  "description"
                )}
              />

              <FieldError
                message={
                  errors.description
                    ?.message
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billing-charge-quantity">
                  Quantity
                </Label>

                <Input
                  id="billing-charge-quantity"
                  type="number"
                  min={1}
                  max={10000}
                  inputMode="numeric"
                  {...register(
                    "quantity"
                  )}
                />

                <FieldError
                  message={
                    errors.quantity
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing-charge-unit-amount">
                  Unit amount in PHP
                </Label>

                <Input
                  id="billing-charge-unit-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  readOnly={
                    selectedCatalogItem
                      ? !selectedCatalogItem
                          .allowCustomUnitAmount
                      : false
                  }
                  {...register(
                    "unitAmountPhp"
                  )}
                />

                <FieldError
                  message={
                    errors.unitAmountPhp
                      ?.message
                  }
                />
              </div>
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Gross charge preview
              </p>

              <p className="mt-1 text-xl font-semibold">
                {grossAmountPreview ===
                null
                  ? "Enter a valid quantity and amount"
                  : formatBillingAmount(
                      grossAmountPreview
                    )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-charge-notes">
                Charge notes
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="billing-charge-notes"
                rows={3}
                {...register("notes")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-charge-posted-by">
                Posted by
              </Label>

              <Input
                id="billing-charge-posted-by"
                placeholder="Synthetic Billing Officer"
                {...register(
                  "postedBy"
                )}
              />

              <FieldError
                message={
                  errors.postedBy
                    ?.message
                }
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
              Charges are stored as integer
              centavo values.
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
            form="billing-charge-form"
            disabled={isSubmitting}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Posting charge
              </>
            ) : (
              <>
                <Plus aria-hidden="true" />
                Post patient charge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
