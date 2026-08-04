"use client"

import {
  useEffect,
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
  LoaderCircle,
  PackageCheck,
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
import {
  PharmacyInventoryStatusBadge,
} from "@/features/pharmacy/components/pharmacy-status-badges"
import {
  pharmacyDispenseFormSchema,
  type PharmacyDispenseFormValues,
} from "@/features/pharmacy/schemas/pharmacy-dispense.schema"
import type {
  PharmacyInventoryItem,
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"
import {
  findAvailableInventoryForMedication,
  getPharmacyInventoryAvailableQuantity,
  getPrescriptionItemRemainingQuantity,
} from "@/features/pharmacy/utils/pharmacy.utils"

interface PharmacyDispenseDialogProps {
  prescription:
    | PharmacyPrescription
    | null

  inventoryItems:
    readonly PharmacyInventoryItem[]

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitDispense: (
    values:
      PharmacyDispenseFormValues
  ) => Promise<void>
}

function getEligibleItems(
  prescription:
    | PharmacyPrescription
    | null
) {
  return (
    prescription?.items.filter(
      (item) =>
        item.status !==
          "cancelled" &&
        getPrescriptionItemRemainingQuantity(
          item
        ) > 0
    ) ?? []
  )
}

function getDefaultValues(
  prescription:
    | PharmacyPrescription
    | null,

  inventoryItems:
    readonly PharmacyInventoryItem[]
): PharmacyDispenseFormValues {
  const firstItem =
    getEligibleItems(
      prescription
    )[0] ?? null

  const firstInventoryItem =
    firstItem && prescription
      ? findAvailableInventoryForMedication(
          inventoryItems,
          firstItem.medicationId,
          prescription.branchId
        )[0] ?? null
      : null

  return {
    prescriptionItemId:
      firstItem?.id ?? "",

    inventoryItemId:
      firstInventoryItem?.id ??
      "",

    quantityToDispense: "1",

    dispensedBy: "",

    labelReviewConfirmed: false,
  }
}

export function PharmacyDispenseDialog({
  prescription,
  inventoryItems,
  open,
  onOpenChange,
  onSubmitDispense,
}: PharmacyDispenseDialogProps) {
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
    useForm<PharmacyDispenseFormValues>(
      {
        resolver: zodResolver(
          pharmacyDispenseFormSchema
        ),

        defaultValues:
          getDefaultValues(
            prescription,
            inventoryItems
          ),

        mode: "onTouched",
      }
    )

  const prescriptionItemId =
    useWatch({
      control,
      name: "prescriptionItemId",
    })

  const inventoryItemId =
    useWatch({
      control,
      name: "inventoryItemId",
    })

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(
          prescription,
          inventoryItems
        )
      )
    }
  }, [
    inventoryItems,
    open,
    prescription,
    reset,
  ])

  if (!prescription) {
    return null
  }

  const prescriptionBranchId =
    prescription.branchId

  const eligibleItems =
    getEligibleItems(
      prescription
    )

  const selectedItem =
    eligibleItems.find(
      (item) =>
        item.id ===
        prescriptionItemId
    ) ?? null

  const availableInventory =
    selectedItem
      ? findAvailableInventoryForMedication(
          inventoryItems,
          selectedItem.medicationId,
          prescription.branchId
        )
      : []

  const selectedInventory =
    availableInventory.find(
      (inventoryItem) =>
        inventoryItem.id ===
        inventoryItemId
    ) ?? null

  const remainingQuantity =
    selectedItem
      ? getPrescriptionItemRemainingQuantity(
          selectedItem
        )
      : 0

  const availableQuantity =
    selectedInventory
      ? getPharmacyInventoryAvailableQuantity(
          selectedInventory
        )
      : 0

  const maximumQuantity =
    Math.min(
      remainingQuantity,
      availableQuantity
    )

  const prescriptionItemRegistration =
    register(
      "prescriptionItemId"
    )

  function handlePrescriptionItemChange(
    event:
      ChangeEvent<HTMLSelectElement>
  ) {
    prescriptionItemRegistration.onChange(
      event
    )

    const nextItem =
      eligibleItems.find(
        (item) =>
          item.id ===
          event.target.value
      ) ?? null

    const nextInventory =
      nextItem
        ? findAvailableInventoryForMedication(
            inventoryItems,
            nextItem.medicationId,
            prescriptionBranchId
          )[0] ?? null
        : null

    setValue(
      "inventoryItemId",
      nextInventory?.id ?? "",
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )

    setValue(
      "quantityToDispense",
      "1",
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  async function submitDispense(
    values:
      PharmacyDispenseFormValues
  ) {
    try {
      await onSubmitDispense(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The medication could not be dispensed.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <PackageCheck
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Dispense medication
          </DialogTitle>

          <DialogDescription>
            {prescription.prescriptionNumber}
            {" · "}
            Select an eligible medication
            item and inventory batch.
          </DialogDescription>
        </DialogHeader>

        <form
          id="pharmacy-dispense-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitDispense
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="pharmacy-prescription-item">
              Prescription medication
            </Label>

            <select
              id="pharmacy-prescription-item"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              {...prescriptionItemRegistration}
              onChange={
                handlePrescriptionItemChange
              }
            >
              <option value="">
                Select medication
              </option>

              {eligibleItems.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.genericName}
                    {" — "}
                    {item.strength}
                    {" — "}
                    Remaining{" "}
                    {getPrescriptionItemRemainingQuantity(
                      item
                    )}
                  </option>
                )
              )}
            </select>

            {errors.prescriptionItemId
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors
                    .prescriptionItemId
                    .message
                }
              </p>
            ) : null}
          </div>

          {selectedItem ? (
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-medium">
                {
                  selectedItem.genericName
                }{" "}
                {selectedItem.strength}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Prescribed:{" "}
                {
                  selectedItem.quantityPrescribed
                }
                {" · "}
                Previously dispensed:{" "}
                {
                  selectedItem.quantityDispensed
                }
                {" · "}
                Remaining:{" "}
                {remainingQuantity}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="pharmacy-inventory-batch">
              Inventory batch
            </Label>

            <select
              id="pharmacy-inventory-batch"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              {...register(
                "inventoryItemId"
              )}
            >
              <option value="">
                Select inventory batch
              </option>

              {availableInventory.map(
                (inventoryItem) => (
                  <option
                    key={
                      inventoryItem.id
                    }
                    value={
                      inventoryItem.id
                    }
                  >
                    {
                      inventoryItem.batchNumber
                    }
                    {" — "}
                    Available{" "}
                    {getPharmacyInventoryAvailableQuantity(
                      inventoryItem
                    )}
                    {" — "}
                    Expires{" "}
                    {
                      inventoryItem.expiresAt
                    }
                  </option>
                )
              )}
            </select>

            {errors.inventoryItemId
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.inventoryItemId
                    .message
                }
              </p>
            ) : null}
          </div>

          {selectedInventory ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <p className="font-mono text-sm font-medium">
                  {
                    selectedInventory.batchNumber
                  }
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Available quantity:{" "}
                  {availableQuantity}
                  {" · "}
                  Expires:{" "}
                  {
                    selectedInventory.expiresAt
                  }
                </p>
              </div>

              <PharmacyInventoryStatusBadge
                status={
                  selectedInventory.status
                }
              />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pharmacy-dispense-quantity">
                Quantity to dispense
              </Label>

              <Input
                id="pharmacy-dispense-quantity"
                type="number"
                min={1}
                max={
                  maximumQuantity > 0
                    ? maximumQuantity
                    : undefined
                }
                inputMode="numeric"
                {...register(
                  "quantityToDispense"
                )}
              />

              <p className="text-xs text-muted-foreground">
                Maximum currently allowed:{" "}
                {maximumQuantity}
              </p>

              {errors.quantityToDispense
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors
                      .quantityToDispense
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacy-dispensed-by">
                Dispensed by
              </Label>

              <Input
                id="pharmacy-dispensed-by"
                placeholder="Synthetic Pharmacy Professional"
                {...register(
                  "dispensedBy"
                )}
              />

              {errors.dispensedBy
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.dispensedBy
                      .message
                  }
                </p>
              ) : null}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-violet-700"
              {...register(
                "labelReviewConfirmed"
              )}
            />

            <span className="text-sm text-violet-900">
              I reviewed the synthetic
              medication label, item,
              quantity, and selected
              inventory batch.
            </span>
          </label>

          {errors.labelReviewConfirmed
            ?.message ? (
            <p className="text-xs font-medium text-destructive">
              {
                errors
                  .labelReviewConfirmed
                  .message
              }
            </p>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This dispensing workflow
              uses synthetic inventory and
              prescription data. It must not
              be used for real medication
              dispensing.
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
            form="pharmacy-dispense-form"
            disabled={
              isSubmitting ||
              maximumQuantity <= 0
            }
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Dispensing
              </>
            ) : (
              <>
                <PackageCheck
                  aria-hidden="true"
                />
                Record dispensing
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
