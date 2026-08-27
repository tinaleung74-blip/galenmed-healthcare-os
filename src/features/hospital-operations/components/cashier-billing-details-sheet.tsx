"use client"

import {
  BadgeCheck,
  CreditCard,
  FileText,
  ReceiptText,
  UserRound,
} from "lucide-react"
import Link from "next/link"

import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CashierBillingStatusBadge,
  CashierClearanceStatusBadge,
  CashierPaymentStatusBadge,
} from "@/features/hospital-operations/components/cashier-billing-badges"
import type {
  CashierBillingAccount,
  CashierPaymentClearance,
} from "@/features/hospital-operations/types/cashier-billing.types"
import {
  CASHIER_PAYMENT_METHOD_LABELS,
  formatCashierAmount,
  formatCashierDateTime,
  getCashierPatientFullName,
} from "@/features/hospital-operations/utils/cashier-billing.utils"
import { cn } from "@/lib/utils"

interface CashierBillingDetailsSheetProps {
  account:
    CashierBillingAccount | null
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
  onRecordPayment: (
    account: CashierBillingAccount
  ) => void
  onManageClearance: (
    account: CashierBillingAccount,
    clearance:
      CashierPaymentClearance
  ) => void
}

export function CashierBillingDetailsSheet({
  account,
  open,
  onOpenChange,
  onRecordPayment,
  onManageClearance,
}: CashierBillingDetailsSheetProps) {
  if (!account) {
    return null
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-6xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <CreditCard
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle>
                Billing account details
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {account.billingNumber}
              </SheetDescription>

              <div className="mt-3">
                <CashierBillingStatusBadge
                  status={account.status}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-7 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-4 text-sky-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Patient and visit
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Patient
                </dt>

                <dd className="mt-1 font-medium">
                  {getCashierPatientFullName(
                    account
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Medical record number
                </dt>

                <dd className="mt-1 font-mono text-xs">
                  {
                    account.patient
                      .medicalRecordNumber
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Visit number
                </dt>

                <dd className="mt-1 font-mono text-xs">
                  {account.visit.visitNumber}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Hospital branch
                </dt>

                <dd className="mt-1">
                  {account.branchName}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Visit status
                </dt>

                <dd className="mt-1">
                  {account.visit.status}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Arrival mode
                </dt>

                <dd className="mt-1">
                  {account.visit.arrivalMode}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Registered
                </dt>

                <dd className="mt-1">
                  {formatCashierDateTime(
                    account.visit
                      .registeredAt
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Mobile number
                </dt>

                <dd className="mt-1">
                  {account.patient.mobileNumber ??
                    "Not recorded"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Billing totals
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Gross charges
                </p>

                <p className="mt-1 break-words text-lg font-semibold tabular-nums [overflow-wrap:anywhere]">
                  {formatCashierAmount(
                    account.grossAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="text-xs text-violet-700">
                  Discounts / coverage
                </p>

                <p className="mt-1 break-words text-lg font-semibold text-violet-800 tabular-nums [overflow-wrap:anywhere]">
                  {formatCashierAmount(
                    account.discountAmountCentavos +
                      account.coverageAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <p className="text-xs text-emerald-700">
                  Paid
                </p>

                <p className="mt-1 break-words text-lg font-semibold text-emerald-800 tabular-nums [overflow-wrap:anywhere]">
                  {formatCashierAmount(
                    account.paidAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <p className="text-xs text-amber-700">
                  Remaining balance
                </p>

                <p className="mt-1 break-words text-lg font-semibold text-amber-800 tabular-nums [overflow-wrap:anywhere]">
                  {formatCashierAmount(
                    account.balanceAmountCentavos
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText
                className="size-4 text-slate-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Charge items
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Description
                    </TableHead>
                    <TableHead>
                      Source
                    </TableHead>
                    <TableHead>
                      Quantity
                    </TableHead>
                    <TableHead>
                      Unit amount
                    </TableHead>
                    <TableHead>
                      Total
                    </TableHead>
                    <TableHead>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {account.chargeItems.length >
                  0 ? (
                    account.chargeItems.map(
                      (charge) => (
                        <TableRow
                          key={charge.id}
                        >
                          <TableCell>
                            <p className="font-medium">
                              {charge.description}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatCashierDateTime(
                                charge.postedAt
                              )}
                            </p>
                          </TableCell>
                          <TableCell>
                            {charge.sourceModule}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {charge.quantity}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatCashierAmount(
                              charge.unitAmountCentavos
                            )}
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums">
                            {formatCashierAmount(
                              charge.totalAmountCentavos
                            )}
                          </TableCell>
                          <TableCell>
                            {charge.status}
                          </TableCell>
                        </TableRow>
                      )
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No billing charge items.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ReceiptText
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Payment transactions
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Payment
                    </TableHead>
                    <TableHead>
                      Receipt
                    </TableHead>
                    <TableHead>
                      Method
                    </TableHead>
                    <TableHead>
                      Amount
                    </TableHead>
                    <TableHead>
                      Status
                    </TableHead>
                    <TableHead>
                      Posted
                    </TableHead>
                    <TableHead>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {account.paymentTransactions.length >
                  0 ? (
                    account.paymentTransactions.map(
                      (payment) => (
                        <TableRow
                          key={payment.id}
                        >
                          <TableCell className="font-mono text-xs">
                            {payment.paymentNumber}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.officialReceiptNumber ??
                              "Not issued"}
                          </TableCell>
                          <TableCell>
                            {
                              CASHIER_PAYMENT_METHOD_LABELS[
                                payment.paymentMethod
                              ]
                            }
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-700 tabular-nums">
                            {formatCashierAmount(
                              payment.amountCentavos
                            )}
                          </TableCell>
                          <TableCell>
                            <CashierPaymentStatusBadge
                              status={payment.status}
                            />
                          </TableCell>
                          <TableCell>
                            {formatCashierDateTime(
                              payment.postedAt
                            )}
                          </TableCell>
                          <TableCell>
                            {payment.status ===
                              "posted" &&
                            payment.officialReceiptNumber ? (
                              <Link
                                href={`/cashier/receipts/${payment.id}/print`}
                                className={cn(
                                  buttonVariants({
                                    size: "sm",
                                    variant:
                                      "outline",
                                  })
                                )}
                              >
                                <ReceiptText
                                  aria-hidden="true"
                                />
                                Receipt
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Unavailable
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No payment transactions.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BadgeCheck
                className="size-4 text-sky-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Service payment clearance
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <Table className="min-w-[1150px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Service request
                    </TableHead>
                    <TableHead>
                      Service
                    </TableHead>
                    <TableHead>
                      Required
                    </TableHead>
                    <TableHead>
                      Cleared
                    </TableHead>
                    <TableHead>
                      Status
                    </TableHead>
                    <TableHead>
                      Release impact
                    </TableHead>
                    <TableHead>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {account.paymentClearances.length >
                  0 ? (
                    account.paymentClearances.map(
                      (clearance) => (
                        <TableRow
                          key={clearance.id}
                        >
                          <TableCell>
                            <p className="font-mono text-xs font-medium">
                              {clearance.requestNumber}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {clearance.requestStatus}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {clearance.serviceName}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {clearance.serviceType}
                            </p>
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums">
                            {formatCashierAmount(
                              clearance.requiredAmountCentavos
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatCashierAmount(
                              clearance.clearedAmountCentavos
                            )}
                          </TableCell>
                          <TableCell>
                            <CashierClearanceStatusBadge
                              status={
                                clearance.clearanceStatus
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs">
                              <p>
                                Ready: {clearance.releaseReadyCount}
                              </p>
                              <p>
                                Pending: {clearance.releasePendingCount}
                              </p>
                              <p>
                                Released: {clearance.releaseReleasedCount}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                onManageClearance(
                                  account,
                                  clearance
                                )
                              }
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No service clearances.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>

        <SheetFooter className="gap-2 border-t bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>

          <Button
            type="button"
            disabled={
              account.balanceAmountCentavos <=
              0
            }
            className="bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={() =>
              onRecordPayment(account)
            }
          >
            <CreditCard
              aria-hidden="true"
            />
            Record payment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
