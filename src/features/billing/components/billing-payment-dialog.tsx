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
  CreditCard,
  LoaderCircle,
  ReceiptText,
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
  BILLING_PAYMENT_METHOD_LABELS,
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import {
  billingPaymentFormSchema,
  type BillingPaymentFormValues,
} from "@/features/billing/schemas/billing-payment.schema"
import {
  BILLING_PAYMENT_METHODS,
  type BillingStatement,
} from "@/features/billing/types/billing.types"
import {
  formatBillingAmount,
  parsePhilippinePesoToCentavos,
} from "@/features/billing/utils/billing.utils"

interface BillingPaymentDialogProps {
  statement:
    | BillingStatement
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitPayment: (
    values:
      BillingPaymentFormValues
  ) => Promise<void>
}

function centavosToInputValue(
  amountCentavos: number
): string {
  return (
    amountCentavos / 100
  ).toFixed(2)
}

function getDefaultValues(
  statement:
    | BillingStatement
    | null
): BillingPaymentFormValues {
  return {
    method: "cash",

    amountPhp:
      statement &&
      statement.balanceDueCentavos >
        0
        ? centavosToInputValue(
            statement.balanceDueCentavos
          )
        : "",

    externalReference: "",
    notes: "",
    postedBy: "",
  }
}

export function BillingPaymentDialog({
  statement,
  open,
  onOpenChange,
  onSubmitPayment,
}: BillingPaymentDialogProps) {
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
    useForm<BillingPaymentFormValues>(
      {
        resolver: zodResolver(
          billingPaymentFormSchema
        ),

        defaultValues:
          getDefaultValues(
            statement
          ),

        mode: "onTouched",
      }
    )

  const amountPhp =
    useWatch({
      control,
      name: "amountPhp",
    })

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(
          statement
        )
      )
    }
  }, [
    open,
    reset,
    statement,
  ])

  const paymentPreview =
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

  const expectedBalanceAfterPayment =
    paymentPreview === null
      ? null
      : Math.max(
          0,
          statement.balanceDueCentavos -
            paymentPreview
        )

  const expectedCreditAfterPayment =
    paymentPreview === null
      ? null
      : Math.max(
          0,
          paymentPreview -
            statement.balanceDueCentavos +
            statement.creditBalanceCentavos
        )

  async function submitPayment(
    values:
      BillingPaymentFormValues
  ) {
    try {
      await onSubmitPayment(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The billing payment could not be recorded.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CreditCard
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Record billing payment
          </DialogTitle>

          <DialogDescription>
            {statement.statementNumber}
            {" · "}
            A synthetic official receipt
            number will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Patient responsibility
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.patientResponsibilityCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Previously paid
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.amountPaidCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Refunds
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.refundAmountCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Current balance due
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatBillingAmount(
                statement.balanceDueCentavos
              )}
            </p>
          </div>
        </div>

        <form
          id="billing-payment-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitPayment
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="billing-payment-method">
              Payment method
            </Label>

            <select
              id="billing-payment-method"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              {...register("method")}
            >
              {BILLING_PAYMENT_METHODS.map(
                (method) => (
                  <option
                    key={method}
                    value={method}
                  >
                    {
                      BILLING_PAYMENT_METHOD_LABELS[
                        method
                      ]
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-payment-amount">
              Payment amount in PHP
            </Label>

            <Input
              id="billing-payment-amount"
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

          <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Balance after payment
              </p>

              <p className="mt-1 font-semibold">
                {expectedBalanceAfterPayment ===
                null
                  ? "Enter a valid amount"
                  : formatBillingAmount(
                      expectedBalanceAfterPayment
                    )}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Expected credit balance
              </p>

              <p className="mt-1 font-semibold">
                {expectedCreditAfterPayment ===
                null
                  ? "Enter a valid amount"
                  : formatBillingAmount(
                      expectedCreditAfterPayment
                    )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-payment-reference">
              External payment reference
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Input
              id="billing-payment-reference"
              placeholder="Synthetic transaction or card reference"
              {...register(
                "externalReference"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-payment-notes">
              Payment notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="billing-payment-notes"
              rows={3}
              {...register("notes")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-payment-posted-by">
              Recorded by
            </Label>

            <Input
              id="billing-payment-posted-by"
              placeholder="Synthetic Cashier"
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

          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
            <ReceiptText
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              A unique synthetic payment
              number and official receipt
              number will be generated when
              this payment is posted.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {BILLING_SYNTHETIC_NOTICE}
              No real funds are collected.
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
            form="billing-payment-form"
            disabled={isSubmitting}
            className="bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Recording payment
              </>
            ) : (
              <>
                <CreditCard
                  aria-hidden="true"
                />
                Record payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
