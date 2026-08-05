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
  RotateCcw,
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
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import {
  billingRefundFormSchema,
  type BillingRefundFormValues,
} from "@/features/billing/schemas/billing-payment.schema"
import type {
  BillingPayment,
  BillingRefund,
  BillingStatement,
} from "@/features/billing/types/billing.types"
import {
  formatBillingAmount,
  parsePhilippinePesoToCentavos,
} from "@/features/billing/utils/billing.utils"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface BillingRefundDialogProps {
  statement:
    | BillingStatement
    | null

  payments:
    readonly BillingPayment[]

  refunds:
    readonly BillingRefund[]

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitRefund: (
    values:
      BillingRefundFormValues
  ) => Promise<void>
}

function getPostedPayments(
  statement:
    | BillingStatement
    | null,

  payments:
    readonly BillingPayment[]
): BillingPayment[] {
  if (!statement) {
    return []
  }

  return payments.filter(
    (payment) =>
      payment.statementId ===
        statement.id &&
      payment.status === "posted"
  )
}

function getDefaultValues(
  statement:
    | BillingStatement
    | null,

  payments:
    readonly BillingPayment[]
): BillingRefundFormValues {
  const postedPayments =
    getPostedPayments(
      statement,
      payments
    )

  return {
    paymentId:
      postedPayments[0]?.id ??
      "",

    amountPhp:
      statement &&
      statement.creditBalanceCentavos >
        0
        ? (
            statement.creditBalanceCentavos /
            100
          ).toFixed(2)
        : "",

    reason: "",
    postedBy: "",
  }
}

export function BillingRefundDialog({
  statement,
  payments,
  refunds,
  open,
  onOpenChange,
  onSubmitRefund,
}: BillingRefundDialogProps) {
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
    useForm<BillingRefundFormValues>(
      {
        resolver: zodResolver(
          billingRefundFormSchema
        ),

        defaultValues:
          getDefaultValues(
            statement,
            payments
          ),

        mode: "onTouched",
      }
    )

  const paymentId =
    useWatch({
      control,
      name: "paymentId",
    })

  const amountPhp =
    useWatch({
      control,
      name: "amountPhp",
    })

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(
          statement,
          payments
        )
      )
    }
  }, [
    open,
    payments,
    reset,
    statement,
  ])

  const postedPayments =
    useMemo(
      () =>
        getPostedPayments(
          statement,
          payments
        ),
      [
        payments,
        statement,
      ]
    )

  const selectedPayment =
    postedPayments.find(
      (payment) =>
        payment.id === paymentId
    ) ?? null

  const selectedPaymentRefundedAmount =
    selectedPayment
      ? refunds
          .filter(
            (refund) =>
              refund.paymentId ===
                selectedPayment.id &&
              refund.status ===
                "posted"
          )
          .reduce(
            (
              total,
              refund
            ) =>
              total +
              refund.amountCentavos,
            0
          )
      : 0

  const selectedPaymentRemaining =
    selectedPayment
      ? Math.max(
          0,
          selectedPayment.amountCentavos -
            selectedPaymentRefundedAmount
        )
      : null

  const refundPreview =
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

  const refundableStatementAmount =
    Math.max(
      0,
      statement.amountPaidCentavos -
        statement.refundAmountCentavos
    )

  async function submitRefund(
    values:
      BillingRefundFormValues
  ) {
    try {
      await onSubmitRefund(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The billing refund could not be recorded.",
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
            <RotateCcw
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Record billing refund
          </DialogTitle>

          <DialogDescription>
            {statement.statementNumber}
            {" · "}
            Post a synthetic refund against
            the statement or a specific
            payment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Total posted payments
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.amountPaidCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Existing refunds
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.refundAmountCentavos
              )}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">
              Remaining refundable statement amount
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatBillingAmount(
                refundableStatementAmount
              )}
            </p>
          </div>
        </div>

        <form
          id="billing-refund-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitRefund
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="billing-refund-payment">
              Related payment
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <select
              id="billing-refund-payment"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              {...register(
                "paymentId"
              )}
            >
              <option value="">
                Statement-level refund
              </option>

              {postedPayments.map(
                (payment) => (
                  <option
                    key={payment.id}
                    value={payment.id}
                  >
                    {
                      payment.officialReceiptNumber
                    }
                    {" — "}
                    {formatBillingAmount(
                      payment.amountCentavos
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          {selectedPayment ? (
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-mono text-sm font-medium">
                {
                  selectedPayment.officialReceiptNumber
                }
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Posted{" "}
                {formatPatientDateTime(
                  selectedPayment.postedAt
                )}
                {" · "}
                Remaining refundable:{" "}
                {formatBillingAmount(
                  selectedPaymentRemaining ??
                    0
                )}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="billing-refund-amount">
              Refund amount in PHP
            </Label>

            <Input
              id="billing-refund-amount"
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
              Refund preview
            </p>

            <p className="mt-1 text-xl font-semibold">
              {refundPreview === null
                ? "Enter a valid amount"
                : formatBillingAmount(
                    refundPreview
                  )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-refund-reason">
              Refund reason
            </Label>

            <Textarea
              id="billing-refund-reason"
              rows={4}
              placeholder="Synthetic refund reason"
              {...register("reason")}
            />

            {errors.reason
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.reason
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-refund-posted-by">
              Recorded by
            </Label>

            <Input
              id="billing-refund-posted-by"
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
              This action does not transfer
              real funds.
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
            form="billing-refund-form"
            disabled={
              isSubmitting ||
              refundableStatementAmount <=
                0
            }
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Recording refund
              </>
            ) : (
              <>
                <RotateCcw
                  aria-hidden="true"
                />
                Record refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
