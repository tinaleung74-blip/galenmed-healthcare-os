"use client"

import {
  useEffect,
  useMemo,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  BadgePercent,
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
import {
  BILLING_ADJUSTMENT_TYPE_LABELS,
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import {
  BILLING_ADJUSTMENT_DIRECTIONS,
  billingAdjustmentFormSchema,
  type BillingAdjustmentDirection,
  type BillingAdjustmentFormValues,
} from "@/features/billing/schemas/billing-adjustment.schema"
import type {
  BillingStatement,
} from "@/features/billing/types/billing.types"
import {
  formatBillingAmount,
  parsePhilippinePesoToCentavos,
} from "@/features/billing/utils/billing.utils"

interface BillingAdjustmentDialogProps {
  statement:
    | BillingStatement
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitAdjustment: (
    values:
      BillingAdjustmentFormValues
  ) => Promise<void>
}

const adjustmentDirectionLabels: Record<
  BillingAdjustmentDirection,
  string
> = {
  decrease:
    "Decrease statement amount",

  increase:
    "Increase statement amount",
}

const EMPTY_ADJUSTMENT_VALUES:
  BillingAdjustmentFormValues = {
  adjustmentType: "discount",
  direction: "decrease",
  description: "",
  amountPhp: "",
  postedBy: "",
}

export function BillingAdjustmentDialog({
  statement,
  open,
  onOpenChange,
  onSubmitAdjustment,
}: BillingAdjustmentDialogProps) {
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
    useForm<BillingAdjustmentFormValues>(
      {
        resolver: zodResolver(
          billingAdjustmentFormSchema
        ),

        defaultValues:
          EMPTY_ADJUSTMENT_VALUES,

        mode: "onTouched",
      }
    )

  const adjustmentType =
    useWatch({
      control,
      name: "adjustmentType",
    })

  const direction =
    useWatch({
      control,
      name: "direction",
    })

  const amountPhp =
    useWatch({
      control,
      name: "amountPhp",
    })

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_ADJUSTMENT_VALUES
      )
    }
  }, [open, reset])

  useEffect(() => {
    if (
      adjustmentType ===
        "discount" ||
      adjustmentType ===
        "write-off"
    ) {
      setValue(
        "direction",
        "decrease",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      )
    }
  }, [
    adjustmentType,
    setValue,
  ])

  const signedAmountPreview =
    useMemo(() => {
      try {
        if (!amountPhp) {
          return null
        }

        const magnitude =
          parsePhilippinePesoToCentavos(
            amountPhp
          )

        return direction ===
          "decrease"
          ? -magnitude
          : magnitude
      } catch {
        return null
      }
    }, [
      amountPhp,
      direction,
    ])

  if (!statement) {
    return null
  }

  async function submitAdjustment(
    values:
      BillingAdjustmentFormValues
  ) {
    try {
      await onSubmitAdjustment(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The billing adjustment could not be posted.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <BadgePercent
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Add billing adjustment
          </DialogTitle>

          <DialogDescription>
            {statement.statementNumber}
            {" · "}
            Post a discount, write-off, or
            billing correction.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Current net charges
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.netChargeAmountCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Existing adjustments
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.adjustmentAmountCentavos
              )}
            </p>
          </div>
        </div>

        <form
          id="billing-adjustment-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitAdjustment
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billing-adjustment-type">
                Adjustment type
              </Label>

              <select
                id="billing-adjustment-type"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...register(
                  "adjustmentType"
                )}
              >
                {[
                  "discount",
                  "write-off",
                  "correction",
                ].map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {
                      BILLING_ADJUSTMENT_TYPE_LABELS[
                        type as
                          | "discount"
                          | "write-off"
                          | "correction"
                      ]
                    }
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-adjustment-direction">
                Direction
              </Label>

              <select
                id="billing-adjustment-direction"
                disabled={
                  adjustmentType ===
                    "discount" ||
                  adjustmentType ===
                    "write-off"
                }
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm disabled:opacity-60"
                {...register(
                  "direction"
                )}
              >
                {BILLING_ADJUSTMENT_DIRECTIONS.map(
                  (
                    adjustmentDirection
                  ) => (
                    <option
                      key={
                        adjustmentDirection
                      }
                      value={
                        adjustmentDirection
                      }
                    >
                      {
                        adjustmentDirectionLabels[
                          adjustmentDirection
                        ]
                      }
                    </option>
                  )
                )}
              </select>

              {errors.direction
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.direction
                      .message
                  }
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-adjustment-description">
              Description
            </Label>

            <Input
              id="billing-adjustment-description"
              placeholder="Example: Synthetic approved patient discount"
              {...register(
                "description"
              )}
            />

            {errors.description
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.description
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-adjustment-amount">
              Adjustment amount in PHP
            </Label>

            <Input
              id="billing-adjustment-amount"
              inputMode="decimal"
              placeholder="0.00"
              {...register(
                "amountPhp"
              )}
            />

            {errors.amountPhp
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.amountPhp
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Signed adjustment preview
            </p>

            <p className="mt-1 text-xl font-semibold">
              {signedAmountPreview ===
              null
                ? "Enter a valid amount"
                : formatBillingAmount(
                    signedAmountPreview
                  )}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Negative values reduce the
              statement amount. Positive
              values increase it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-adjustment-posted-by">
              Posted by
            </Label>

            <Input
              id="billing-adjustment-posted-by"
              placeholder="Synthetic Billing Officer"
              {...register(
                "postedBy"
              )}
            />

            {errors.postedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.postedBy
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {BILLING_SYNTHETIC_NOTICE}
              Posted adjustments remain in
              the statement history and must
              be reversed instead of deleted.
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
            form="billing-adjustment-form"
            disabled={isSubmitting}
            className="bg-amber-700 text-white hover:bg-amber-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Posting adjustment
              </>
            ) : (
              <>
                <BadgePercent
                  aria-hidden="true"
                />
                Post adjustment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
