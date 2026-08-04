"use client"

import {
  useEffect,
  type ChangeEvent,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
} from "react-hook-form"
import {
  TestTube2,
  LoaderCircle,
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
  LABORATORY_COLLECTION_METHOD_LABELS,
  LABORATORY_SPECIMEN_TYPE_LABELS,
} from "@/features/laboratory/constants/laboratory.constants"
import {
  laboratorySpecimenCollectionFormSchema,
  type LaboratorySpecimenCollectionFormValues,
} from "@/features/laboratory/schemas/laboratory-specimen.schema"
import {
  LABORATORY_COLLECTION_METHODS,
  type LaboratoryOrder,
  type LaboratorySpecimenType,
} from "@/features/laboratory/types/laboratory.types"

interface LaboratorySpecimenCollectionDialogProps {
  order: LaboratoryOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void

  onSubmitSpecimen: (
    values:
      LaboratorySpecimenCollectionFormValues
  ) => Promise<void>
}

function toLocalDateTimeInput(
  date: Date
): string {
  const offset =
    date.getTimezoneOffset() *
    60 *
    1000

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16)
}

function getAvailableSpecimenTypes(
  order: LaboratoryOrder | null
): LaboratorySpecimenType[] {
  if (!order) {
    return []
  }

  const requiredTypes =
    Array.from(
      new Set(
        order.items
          .filter(
            (item) =>
              item.status !==
              "cancelled"
          )
          .map(
            (item) =>
              item.specimenType
          )
      )
    )

  return requiredTypes.filter(
    (specimenType) =>
      !order.specimens.some(
        (specimen) =>
          specimen.specimenType ===
            specimenType &&
          specimen.status !==
            "rejected"
      )
  )
}

function getContainerForType(
  order: LaboratoryOrder | null,
  specimenType: LaboratorySpecimenType
): string {
  return (
    order?.items.find(
      (item) =>
        item.specimenType ===
        specimenType
    )?.containerType ?? ""
  )
}

function getDefaultValues(
  order: LaboratoryOrder | null
): LaboratorySpecimenCollectionFormValues {
  const firstType =
    getAvailableSpecimenTypes(order)[0] ??
    "whole-blood"

  return {
    specimenType: firstType,
    collectionMethod:
      firstType === "urine"
        ? "clean-catch-urine"
        : "venipuncture",
    containerType:
      getContainerForType(
        order,
        firstType
      ),
    collectedAt:
      toLocalDateTimeInput(
        new Date()
      ),
    collectedBy: "",
    notes: "",
  }
}

export function LaboratorySpecimenCollectionDialog({
  order,
  open,
  onOpenChange,
  onSubmitSpecimen,
}: LaboratorySpecimenCollectionDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<LaboratorySpecimenCollectionFormValues>(
      {
        resolver: zodResolver(
          laboratorySpecimenCollectionFormSchema
        ),
        defaultValues:
          getDefaultValues(order),
        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(order)
      )
    }
  }, [open, order, reset])

  const availableTypes =
    getAvailableSpecimenTypes(order)

  const specimenRegistration =
    register("specimenType")

  function handleSpecimenTypeChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    specimenRegistration.onChange(event)

    const specimenType =
      event.target
        .value as LaboratorySpecimenType

    setValue(
      "containerType",
      getContainerForType(
        order,
        specimenType
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )

    setValue(
      "collectionMethod",
      specimenType === "urine"
        ? "clean-catch-urine"
        : "venipuncture",
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  async function submitSpecimen(
    values:
      LaboratorySpecimenCollectionFormValues
  ) {
    try {
      await onSubmitSpecimen(values)
      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "The specimen could not be collected.",
      })
    }
  }

  if (!order) {
    return null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <TestTube2
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Collect laboratory specimen
          </DialogTitle>

          <DialogDescription>
            Order: {order.orderNumber}. A
            unique accession number will be
            generated after collection.
          </DialogDescription>
        </DialogHeader>

        <form
          id="laboratory-specimen-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitSpecimen
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="specimen-type">
                Specimen type
              </Label>

              <select
                id="specimen-type"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...specimenRegistration}
                onChange={
                  handleSpecimenTypeChange
                }
              >
                {availableTypes.map(
                  (specimenType) => (
                    <option
                      key={specimenType}
                      value={specimenType}
                    >
                      {
                        LABORATORY_SPECIMEN_TYPE_LABELS[
                          specimenType
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-method">
                Collection method
              </Label>

              <select
                id="collection-method"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...register(
                  "collectionMethod"
                )}
              >
                {LABORATORY_COLLECTION_METHODS.map(
                  (method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {
                        LABORATORY_COLLECTION_METHOD_LABELS[
                          method
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="specimen-container">
                Container
              </Label>

              <Input
                id="specimen-container"
                {...register(
                  "containerType"
                )}
              />

              {errors.containerType
                ?.message ? (
                <p className="text-xs text-destructive">
                  {
                    errors.containerType
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collected-at">
                Collected at
              </Label>

              <Input
                id="collected-at"
                type="datetime-local"
                {...register(
                  "collectedAt"
                )}
              />

              {errors.collectedAt
                ?.message ? (
                <p className="text-xs text-destructive">
                  {
                    errors.collectedAt
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collected-by">
                Collected by
              </Label>

              <Input
                id="collected-by"
                placeholder="Synthetic Phlebotomist"
                {...register(
                  "collectedBy"
                )}
              />

              {errors.collectedBy
                ?.message ? (
                <p className="text-xs text-destructive">
                  {
                    errors.collectedBy
                      .message
                  }
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specimen-notes">
              Specimen notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="specimen-notes"
              rows={3}
              {...register("notes")}
            />
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
            form="laboratory-specimen-form"
            disabled={
              isSubmitting ||
              availableTypes.length === 0
            }
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Collecting
              </>
            ) : (
              <>
                <TestTube2
                  aria-hidden="true"
                />
                Record collection
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
