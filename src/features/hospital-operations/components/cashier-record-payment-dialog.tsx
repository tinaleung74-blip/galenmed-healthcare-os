"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  CreditCard,
  LoaderCircle,
  ReceiptText,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"
import { toast } from "sonner"

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
  recordCashierPaymentAction,
} from "@/features/hospital-operations/actions/cashier-billing.actions"
import {
  cashierRecordPaymentSchema,
  type CashierRecordPaymentValues,
} from "@/features/hospital-operations/schemas/cashier-billing.schema"
import {
  CASHIER_PAYMENT_METHODS,
  type CashierBillingAccount,
} from "@/features/hospital-operations/types/cashier-billing.types"
import {
  CASHIER_PAYMENT_METHOD_LABELS,
  createCashierIdempotencyKey,
  formatCashierAmount,
  formatCentavosAsPhpInput,
  getCashierPatientFullName,
  parsePhpToCentavos,
} from "@/features/hospital-operations/utils/cashier-billing.utils"

interface CashierRecordPaymentDialogProps {
  account:
    CashierBillingAccount | null
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

function getInitialValues(
  account:
    CashierBillingAccount | null
): CashierRecordPaymentValues {
  return {
    billingAccountId:
      account?.id ?? "",
    amountPhp:
      account
        ? formatCentavosAsPhpInput(
            account.balanceAmountCentavos
          )
        : "",
    paymentMethod: "cash",
    externalReference: "",
    idempotencyKey:
      createCashierIdempotencyKey(
        "cashier-payment"
      ),
  }
}

export function CashierRecordPaymentDialog({
  account,
  open,
  onOpenChange,
}: CashierRecordPaymentDialogProps) {
  const router = useRouter()

  const [
    values,
    setValues,
  ] = useState<
    CashierRecordPaymentValues
  >(() =>
    getInitialValues(account)
  )

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  if (!account) {
    return null
  }

  const activeAccount =
    account

  function updateValue<
    Key extends keyof CashierRecordPaymentValues,
  >(
    key: Key,
    value:
      CashierRecordPaymentValues[Key]
  ) {
    setValues(
      (currentValues) => ({
        ...currentValues,
        [key]: value,
      })
    )
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)

    const parsedValues =
      cashierRecordPaymentSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
        "The payment details are invalid."
      )

      return
    }

    let amountCentavos = 0

    try {
      amountCentavos =
        parsePhpToCentavos(
          parsedValues.data
            .amountPhp
        )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The payment amount is invalid."
      )

      return
    }

    if (
      amountCentavos >
      activeAccount.balanceAmountCentavos
    ) {
      setErrorMessage(
        "Payment amount exceeds the current patient balance."
      )

      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await recordCashierPaymentAction(
            parsedValues.data
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        toast.success(
          result.message,
          {
            description:
              result.data
                ?.officialReceiptNumber ??
              undefined,
          }
        )

        onOpenChange(false)
        router.refresh()
      })()
    })
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
            Record patient payment
          </DialogTitle>

          <DialogDescription>
            {getCashierPatientFullName(
              activeAccount
            )}
            {" · "}
            {activeAccount.billingNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Gross charges
            </p>

            <p className="mt-1 font-semibold tabular-nums">
              {formatCashierAmount(
                activeAccount.grossAmountCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Paid
            </p>

            <p className="mt-1 font-semibold text-emerald-700 tabular-nums">
              {formatCashierAmount(
                activeAccount.paidAmountCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Current balance
            </p>

            <p className="mt-1 font-semibold text-amber-700 tabular-nums">
              {formatCashierAmount(
                activeAccount.balanceAmountCentavos
              )}
            </p>
          </div>
        </div>

        <form
          id="cashier-payment-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cashier-payment-amount">
                Payment amount in PHP
              </Label>

              <Input
                id="cashier-payment-amount"
                inputMode="decimal"
                value={values.amountPhp}
                disabled={isPending}
                placeholder="0.00"
                onChange={(event) =>
                  updateValue(
                    "amountPhp",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier-payment-method">
                Payment method
              </Label>

              <select
                id="cashier-payment-method"
                value={values.paymentMethod}
                disabled={isPending}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) =>
                  updateValue(
                    "paymentMethod",
                    event.target.value as
                      CashierRecordPaymentValues["paymentMethod"]
                  )
                }
              >
                {CASHIER_PAYMENT_METHODS.map(
                  (method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {
                        CASHIER_PAYMENT_METHOD_LABELS[
                          method
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cashier-payment-reference">
                External reference
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional for cash
                </span>
              </Label>

              <Input
                id="cashier-payment-reference"
                value={
                  values.externalReference
                }
                disabled={isPending}
                placeholder="Card approval, bank transfer, or e-wallet reference"
                onChange={(event) =>
                  updateValue(
                    "externalReference",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
            <ReceiptText
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Posting the payment creates an
              immutable transaction and a
              hospital receipt reference.
              Service-request clearance remains
              an explicit Cashier action.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {errorMessage}
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="cashier-payment-form"
            disabled={
              isPending ||
              activeAccount.balanceAmountCentavos <=
                0
            }
            className="bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {isPending ? (
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
