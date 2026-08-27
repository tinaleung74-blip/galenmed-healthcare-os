"use client"

import {
  useState,
  useTransition,
} from "react"
import {
  ArrowLeft,
  LoaderCircle,
  Printer,
  ReceiptText,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"
import { toast } from "sonner"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  recordCashierReceiptPrintAction,
} from "@/features/hospital-operations/actions/cashier-billing.actions"
import type {
  CashierReceiptPageData,
} from "@/features/hospital-operations/types/cashier-billing.types"
import {
  CASHIER_PAYMENT_METHOD_LABELS,
  CASHIER_RECEIPT_PRINT_TYPE_LABELS,
  createCashierIdempotencyKey,
  formatCashierAmount,
  formatCashierDateTime,
  getCashierPatientFullName,
} from "@/features/hospital-operations/utils/cashier-billing.utils"
import { cn } from "@/lib/utils"

interface CashierReceiptDocumentProps {
  data: CashierReceiptPageData
}

export function CashierReceiptDocument({
  data,
}: CashierReceiptDocumentProps) {
  const router = useRouter()

  const [
    reprintReason,
    setReprintReason,
  ] = useState("")

  const [
    idempotencyKey,
    setIdempotencyKey,
  ] = useState(() =>
    createCashierIdempotencyKey(
      "receipt-print"
    )
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

  const isReprint =
    data.printLogs.length > 0

  const printType =
    isReprint
      ? "reprint"
      : "original"

  const nextCopyNumber =
    data.printLogs.length + 1

  function handlePrint() {
    setErrorMessage(null)

    if (
      isReprint &&
      reprintReason.trim().length < 3
    ) {
      setErrorMessage(
        "Enter a reason before reprinting the receipt."
      )
      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await recordCashierReceiptPrintAction(
            {
              paymentTransactionId:
                data.payment.id,
              printType,
              printReason:
                reprintReason,
              idempotencyKey,
            }
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
              `Copy ${result.data?.copyNumber ?? nextCopyNumber}`,
          }
        )

        setIdempotencyKey(
          createCashierIdempotencyKey(
            "receipt-print"
          )
        )

        window.setTimeout(() => {
          window.print()
          router.refresh()
        }, 150)
      })()
    })
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm print:hidden sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/cashier/billing"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <ArrowLeft
                aria-hidden="true"
              />
              Back to billing
            </Link>

            <p className="mt-4 text-sm font-semibold">
              {isReprint
                ? "Receipt reprint"
                : "Original receipt print"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              This action is recorded in the
              Cashier receipt print audit.
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
            {isReprint ? (
              <>
                <Label htmlFor="receipt-reprint-reason">
                  Reprint reason
                </Label>

                <Input
                  id="receipt-reprint-reason"
                  value={reprintReason}
                  disabled={isPending}
                  placeholder="Example: Patient requested a replacement copy"
                  onChange={(event) =>
                    setReprintReason(
                      event.target.value
                    )
                  }
                />
              </>
            ) : null}

            {errorMessage ? (
              <p
                role="alert"
                className="text-sm text-rose-700"
              >
                {errorMessage}
              </p>
            ) : null}

            <Button
              type="button"
              disabled={isPending}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={handlePrint}
            >
              {isPending ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Recording print
                </>
              ) : (
                <>
                  <Printer
                    aria-hidden="true"
                  />
                  {isReprint
                    ? "Record and reprint"
                    : "Record and print"}
                </>
              )}
            </Button>
          </div>
        </div>

        <article className="rounded-2xl border bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-8 print:shadow-none sm:p-12">
          <header className="flex items-start justify-between gap-6 border-b pb-6">
            <div className="flex items-center gap-4">
              <GalenMedLogo
                size="lg"
                priority
                className="rounded-2xl bg-white p-1 ring-1 ring-slate-200"
              />

              <div>
                <p className="text-xl font-semibold tracking-tight">
                  GalenMed Healthcare OS
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.account.branchName}
                </p>
              </div>
            </div>

            <div className="text-right">
              <ReceiptText
                className="ml-auto size-6 text-emerald-700"
                aria-hidden="true"
              />
              <h1 className="mt-2 text-xl font-semibold">
                Hospital Payment Receipt
              </h1>
              <p className="mt-1 font-mono text-sm">
                {
                  data.payment
                    .officialReceiptNumber
                }
              </p>
            </div>
          </header>

          <section className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Patient
              </p>
              <p className="mt-1 font-semibold">
                {getCashierPatientFullName(
                  data.account
                )}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {
                  data.account.patient
                    .medicalRecordNumber
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Payment date
              </p>
              <p className="mt-1 font-semibold">
                {formatCashierDateTime(
                  data.payment.postedAt
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Billing account
              </p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {data.account.billingNumber}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Visit number
              </p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {data.account.visit.visitNumber}
              </p>
            </div>
          </section>

          <section className="mt-8 overflow-hidden rounded-xl border">
            <dl className="divide-y">
              <div className="flex items-center justify-between gap-4 p-4">
                <dt className="text-sm text-muted-foreground">
                  Payment number
                </dt>
                <dd className="font-mono text-sm font-semibold">
                  {data.payment.paymentNumber}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 p-4">
                <dt className="text-sm text-muted-foreground">
                  Payment method
                </dt>
                <dd className="text-sm font-semibold">
                  {
                    CASHIER_PAYMENT_METHOD_LABELS[
                      data.payment.paymentMethod
                    ]
                  }
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 p-4">
                <dt className="text-sm text-muted-foreground">
                  External reference
                </dt>
                <dd className="max-w-sm break-words text-right text-sm font-semibold">
                  {data.payment.externalReference ??
                    "Not applicable"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 bg-emerald-50 p-5">
                <dt className="font-semibold text-emerald-800">
                  Amount received
                </dt>
                <dd className="text-2xl font-bold text-emerald-800 tabular-nums">
                  {formatCashierAmount(
                    data.payment.amountCentavos
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-8 grid gap-4 border-t pt-6 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <p>
                Print type: {CASHIER_RECEIPT_PRINT_TYPE_LABELS[printType]}
              </p>
              <p className="mt-1">
                Copy number: {nextCopyNumber}
              </p>
            </div>

            <div className="sm:text-right">
              <p>
                System-generated payment receipt
              </p>
              <p className="mt-1">
                Verify against the GalenMed billing record.
              </p>
            </div>
          </section>
        </article>

        {data.printLogs.length > 0 ? (
          <section className="rounded-xl border bg-white p-4 print:hidden">
            <h2 className="text-sm font-semibold">
              Previous print records
            </h2>

            <div className="mt-3 space-y-2">
              {data.printLogs.map(
                (log) => (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs"
                  >
                    <span>
                      Copy {log.copyNumber}
                      {" · "}
                      {
                        CASHIER_RECEIPT_PRINT_TYPE_LABELS[
                          log.printType
                        ]
                      }
                    </span>
                    <span className="text-muted-foreground">
                      {formatCashierDateTime(
                        log.printedAt
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
