"use client"

import {
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
import {
  BillingPaymentMethodBadge,
} from "@/features/billing/components/billing-status-badges"
import {
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import type {
  BillingPayment,
  BillingStatement,
} from "@/features/billing/types/billing.types"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface BillingOfficialReceiptDialogProps {
  payment:
    | BillingPayment
    | null

  statement:
    | BillingStatement
    | null

  patient:
    | Patient
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void
}

export function BillingOfficialReceiptDialog({
  payment,
  statement,
  patient,
  open,
  onOpenChange,
}: BillingOfficialReceiptDialogProps) {
  if (
    !payment ||
    !statement ||
    !patient
  ) {
    return null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ReceiptText
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Synthetic Official Receipt
          </DialogTitle>

          <DialogDescription>
            Generated after posting the
            development billing payment.
          </DialogDescription>
        </DialogHeader>

        <article className="overflow-hidden rounded-xl border">
          <div className="border-b bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Official receipt number
            </p>

            <p className="mt-1 font-mono text-xl font-semibold">
              {
                payment.officialReceiptNumber
              }
            </p>

            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {payment.paymentNumber}
            </p>
          </div>

          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">
                Patient
              </dt>

              <dd className="mt-1 font-medium">
                {getPatientFullName(
                  patient
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">
                Medical record number
              </dt>

              <dd className="mt-1 font-mono text-sm">
                {
                  patient.medicalRecordNumber
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">
                Billing statement
              </dt>

              <dd className="mt-1 font-mono text-sm">
                {
                  statement.statementNumber
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">
                Payment method
              </dt>

              <dd className="mt-1">
                <BillingPaymentMethodBadge
                  method={
                    payment.method
                  }
                />
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">
                Amount received
              </dt>

              <dd className="mt-1 text-xl font-semibold">
                {formatBillingAmount(
                  payment.amountCentavos
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">
                Posted
              </dt>

              <dd className="mt-1 text-sm">
                {formatPatientDateTime(
                  payment.postedAt
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">
                Recorded by
              </dt>

              <dd className="mt-1 text-sm">
                {payment.postedBy}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted-foreground">
                External reference
              </dt>

              <dd className="mt-1 break-words text-sm">
                {payment.externalReference ??
                  "Not recorded"}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">
                Payment notes
              </dt>

              <dd className="mt-1 whitespace-pre-wrap text-sm">
                {payment.notes ??
                  "No notes recorded"}
              </dd>
            </div>
          </dl>
        </article>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            {BILLING_SYNTHETIC_NOTICE}
            This is not a valid tax,
            accounting, or payment receipt.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
