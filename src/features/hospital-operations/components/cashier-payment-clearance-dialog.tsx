"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  BadgeCheck,
  LoaderCircle,
  ShieldAlert,
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
import { Textarea } from "@/components/ui/textarea"
import {
  setCashierPaymentClearanceAction,
} from "@/features/hospital-operations/actions/cashier-billing.actions"
import {
  cashierSetClearanceSchema,
  type CashierSetClearanceValues,
} from "@/features/hospital-operations/schemas/cashier-billing.schema"
import {
  CASHIER_PAYMENT_CLEARANCE_STATUSES,
  type CashierBillingAccount,
  type CashierPaymentClearance,
} from "@/features/hospital-operations/types/cashier-billing.types"
import {
  CASHIER_CLEARANCE_STATUS_LABELS,
  formatCashierAmount,
  formatCentavosAsPhpInput,
  getCashierPatientFullName,
} from "@/features/hospital-operations/utils/cashier-billing.utils"

interface CashierPaymentClearanceDialogProps {
  account:
    CashierBillingAccount | null
  clearance:
    CashierPaymentClearance | null
  canWaive: boolean
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

function getInitialValues(
  clearance:
    CashierPaymentClearance | null
): CashierSetClearanceValues {
  return {
    serviceRequestId:
      clearance?.serviceRequestId ??
      "",
    clearanceStatus:
      clearance?.clearanceStatus ??
      "pending",
    clearedAmountPhp:
      clearance
        ? formatCentavosAsPhpInput(
            clearance.clearedAmountCentavos
          )
        : "0.00",
    clearanceReason:
      clearance?.clearanceReason ??
      "",
  }
}

export function CashierPaymentClearanceDialog({
  account,
  clearance,
  canWaive,
  open,
  onOpenChange,
}: CashierPaymentClearanceDialogProps) {
  const router = useRouter()

  const [
    values,
    setValues,
  ] = useState<
    CashierSetClearanceValues
  >(() =>
    getInitialValues(clearance)
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

  if (
    !account ||
    !clearance
  ) {
    return null
  }

  const activeAccount =
    account

  const activeClearance =
    clearance

  function updateValue<
    Key extends keyof CashierSetClearanceValues,
  >(
    key: Key,
    value:
      CashierSetClearanceValues[Key]
  ) {
    setValues(
      (currentValues) => ({
        ...currentValues,
        [key]: value,
      })
    )
  }

  const availableStatuses =
    CASHIER_PAYMENT_CLEARANCE_STATUSES.filter(
      (status) =>
        status !== "waived" ||
        canWaive
    )

  function handleStatusChange(
    nextStatus:
      CashierSetClearanceValues["clearanceStatus"]
  ) {
    let nextAmount = "0.00"

    if (
      nextStatus ===
        "partially_cleared"
    ) {
      nextAmount =
        activeClearance.clearedAmountCentavos >
        0
          ? formatCentavosAsPhpInput(
              activeClearance.clearedAmountCentavos
            )
          : ""
    }

    if (
      nextStatus === "cleared"
    ) {
      nextAmount =
        formatCentavosAsPhpInput(
          activeClearance.requiredAmountCentavos
        )
    }

    setValues(
      (currentValues) => ({
        ...currentValues,
        clearanceStatus:
          nextStatus,
        clearedAmountPhp:
          nextAmount,
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
      cashierSetClearanceSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
        "The payment-clearance details are invalid."
      )

      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await setCashierPaymentClearanceAction(
            parsedValues.data
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        toast.success(
          result.message
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <BadgeCheck
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Manage payment clearance
          </DialogTitle>

          <DialogDescription>
            {getCashierPatientFullName(
              activeAccount
            )}
            {" · "}
            {activeClearance.requestNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">
              Service
            </p>

            <p className="mt-1 font-semibold">
              {activeClearance.serviceName}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {activeClearance.serviceType}
              {" · "}
              {activeClearance.requestStatus}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Required amount
            </p>

            <p className="mt-1 font-semibold text-amber-700 tabular-nums">
              {formatCashierAmount(
                activeClearance.requiredAmountCentavos
              )}
            </p>
          </div>
        </div>

        <form
          id="cashier-clearance-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cashier-clearance-status">
                Clearance status
              </Label>

              <select
                id="cashier-clearance-status"
                value={
                  values.clearanceStatus
                }
                disabled={isPending}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) =>
                  handleStatusChange(
                    event.target.value as
                      CashierSetClearanceValues["clearanceStatus"]
                  )
                }
              >
                {availableStatuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {
                        CASHIER_CLEARANCE_STATUS_LABELS[
                          status
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier-cleared-amount">
                Cleared amount in PHP
              </Label>

              <Input
                id="cashier-cleared-amount"
                inputMode="decimal"
                value={
                  values.clearedAmountPhp
                }
                disabled={
                  isPending ||
                  values.clearanceStatus !==
                    "partially_cleared"
                }
                onChange={(event) =>
                  updateValue(
                    "clearedAmountPhp",
                    event.target.value
                  )
                }
              />

              {values.clearanceStatus ===
              "cleared" ? (
                <p className="text-xs text-muted-foreground">
                  Full clearance uses the
                  required service amount.
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cashier-clearance-reason">
                Clearance reason
              </Label>

              <Textarea
                id="cashier-clearance-reason"
                rows={4}
                value={
                  values.clearanceReason
                }
                disabled={isPending}
                placeholder="Example: Full payment posted under the current visit."
                onChange={(event) =>
                  updateValue(
                    "clearanceReason",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              A cleared or waived service can
              unlock finalized clinical
              documents for Receptionist print
              and release. The Cashier cannot
              edit the clinical result itself.
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
            form="cashier-clearance-form"
            disabled={isPending}
            className="bg-sky-700 text-white hover:bg-sky-800"
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Updating clearance
              </>
            ) : (
              <>
                <BadgeCheck
                  aria-hidden="true"
                />
                Save clearance
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
