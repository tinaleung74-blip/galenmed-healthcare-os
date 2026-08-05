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
  BILLING_COVERAGE_TYPE_LABELS,
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import {
  billingCoverageFormSchema,
  type BillingCoverageFormValues,
} from "@/features/billing/schemas/billing-coverage.schema"
import {
  BILLING_COVERAGE_TYPES,
  type BillingStatement,
} from "@/features/billing/types/billing.types"
import {
  formatBillingAmount,
  parsePhilippinePesoToCentavos,
} from "@/features/billing/utils/billing.utils"

interface BillingCoverageDialogProps {
  statement:
    | BillingStatement
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitCoverage: (
    values:
      BillingCoverageFormValues
  ) => Promise<void>
}

const EMPTY_COVERAGE_VALUES:
  BillingCoverageFormValues = {
  coverageType: "insurance",
  payerName: "",
  amountPhp: "",
  referenceNumber: "",
  notes: "",
  allocatedBy: "",
}

export function BillingCoverageDialog({
  statement,
  open,
  onOpenChange,
  onSubmitCoverage,
}: BillingCoverageDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<BillingCoverageFormValues>(
      {
        resolver: zodResolver(
          billingCoverageFormSchema
        ),

        defaultValues:
          EMPTY_COVERAGE_VALUES,

        mode: "onTouched",
      }
    )

  const amountPhp =
    useWatch({
      control,
      name: "amountPhp",
    })

  const remainingCapacity =
    statement
      ? Math.max(
          0,
          statement.netChargeAmountCentavos -
            statement.coverageAmountCentavos
        )
      : 0

  useEffect(() => {
    if (open) {
      reset({
        ...EMPTY_COVERAGE_VALUES,

        amountPhp:
          remainingCapacity > 0
            ? (
                remainingCapacity /
                100
              ).toFixed(2)
            : "",
      })
    }
  }, [
    open,
    remainingCapacity,
    reset,
  ])

  const allocationPreview =
    useMemo(() => {
      try {
        if (!amountPhp) {
          return null
        }

        return parsePhilippinePesoToCentavos(
          amountPhp
        )
      } catch {
        return null
      }
    }, [amountPhp])

  if (!statement) {
    return null
  }

  async function submitCoverage(
    values:
      BillingCoverageFormValues
  ) {
    try {
      await onSubmitCoverage(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The billing coverage allocation could not be posted.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <ShieldCheck
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Add coverage allocation
          </DialogTitle>

          <DialogDescription>
            {statement.statementNumber}
            {" · "}
            Allocate synthetic insurance,
            company-account, or charity
            coverage.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Net charges
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.netChargeAmountCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Existing coverage
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.coverageAmountCentavos
              )}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">
              Remaining coverage capacity
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatBillingAmount(
                remainingCapacity
              )}
            </p>
          </div>
        </div>

        <form
          id="billing-coverage-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitCoverage
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="billing-coverage-type">
              Coverage type
            </Label>

            <select
              id="billing-coverage-type"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              {...register(
                "coverageType"
              )}
            >
              {BILLING_COVERAGE_TYPES.map(
                (coverageType) => (
                  <option
                    key={coverageType}
                    value={coverageType}
                  >
                    {
                      BILLING_COVERAGE_TYPE_LABELS[
                        coverageType
                      ]
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-coverage-payer">
              Payer name
            </Label>

            <Input
              id="billing-coverage-payer"
              placeholder="Synthetic Health Coverage Plan"
              {...register(
                "payerName"
              )}
            />

            {errors.payerName
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.payerName
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-coverage-amount">
              Coverage amount in PHP
            </Label>

            <Input
              id="billing-coverage-amount"
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
              Allocation preview
            </p>

            <p className="mt-1 text-xl font-semibold">
              {allocationPreview ===
              null
                ? "Enter a valid amount"
                : formatBillingAmount(
                    allocationPreview
                  )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-coverage-reference">
              Coverage reference
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Input
              id="billing-coverage-reference"
              placeholder="SYN-COV-0001"
              {...register(
                "referenceNumber"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-coverage-notes">
              Coverage notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="billing-coverage-notes"
              rows={3}
              {...register("notes")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-coverage-allocated-by">
              Allocated by
            </Label>

            <Input
              id="billing-coverage-allocated-by"
              placeholder="Synthetic Billing Officer"
              {...register(
                "allocatedBy"
              )}
            />

            {errors.allocatedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.allocatedBy
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
              This does not confirm real
              insurance eligibility or payer
              approval.
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
            form="billing-coverage-form"
            disabled={
              isSubmitting ||
              remainingCapacity <= 0
            }
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Posting coverage
              </>
            ) : (
              <>
                <ShieldCheck
                  aria-hidden="true"
                />
                Post coverage
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
