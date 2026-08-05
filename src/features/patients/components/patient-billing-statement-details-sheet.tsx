"use client"

import type {
  ReactNode,
} from "react"
import {
  BadgePercent,
  CreditCard,
  FileText,
  LockKeyhole,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
  BillingBalanceBadge,
  BillingChargeSourceBadge,
  BillingChargeStatusBadge,
  BillingPaymentMethodBadge,
  BillingStatementStatusBadge,
} from "@/features/billing/components/billing-status-badges"
import {
  BILLING_ADJUSTMENT_TYPE_LABELS,
  BILLING_COVERAGE_TYPE_LABELS,
} from "@/features/billing/constants/billing.constants"
import {
  useBilling,
} from "@/features/billing/providers/billing-provider"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"
import type {
  PatientFinancialStatementRecord,
} from "@/features/patients/types/patient-billing-history.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface PatientBillingStatementDetailsSheetProps {
  record:
    | PatientFinancialStatementRecord
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void
}

interface DetailItemProps {
  label: string
  value: ReactNode
  className?: string
}

function DetailItem({
  label,
  value,
  className,
}: DetailItemProps) {
  return (
    <div
      className={
        className
      }
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  )
}

function RecordState({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
          : "inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
      }
    >
      {active
        ? activeLabel
        : inactiveLabel}
    </span>
  )
}

export function PatientBillingStatementDetailsSheet({
  record,
  open,
  onOpenChange,
}: PatientBillingStatementDetailsSheetProps) {
  const {
    charges,
    adjustments,
    coverageAllocations,
    payments,
    refunds,
  } = useBilling()

  if (!record) {
    return null
  }

  const {
    statement,
  } = record

  const statementCharges =
    charges.filter(
      (charge) =>
        statement.chargeIds.includes(
          charge.id
        )
    )

  const statementAdjustments =
    adjustments
      .filter(
        (adjustment) =>
          statement.adjustmentIds.includes(
            adjustment.id
          )
      )
      .sort(
        (
          firstAdjustment,
          secondAdjustment
        ) =>
          new Date(
            secondAdjustment.postedAt
          ).getTime() -
          new Date(
            firstAdjustment.postedAt
          ).getTime()
      )

  const statementCoverage =
    coverageAllocations
      .filter(
        (coverage) =>
          statement.coverageAllocationIds.includes(
            coverage.id
          )
      )
      .sort(
        (
          firstCoverage,
          secondCoverage
        ) =>
          new Date(
            secondCoverage.allocatedAt
          ).getTime() -
          new Date(
            firstCoverage.allocatedAt
          ).getTime()
      )

  const statementPayments =
    payments
      .filter(
        (payment) =>
          statement.paymentIds.includes(
            payment.id
          )
      )
      .sort(
        (
          firstPayment,
          secondPayment
        ) =>
          new Date(
            secondPayment.postedAt
          ).getTime() -
          new Date(
            firstPayment.postedAt
          ).getTime()
      )

  const statementRefunds =
    refunds
      .filter(
        (refund) =>
          statement.refundIds.includes(
            refund.id
          )
      )
      .sort(
        (
          firstRefund,
          secondRefund
        ) =>
          new Date(
            secondRefund.postedAt
          ).getTime() -
          new Date(
            firstRefund.postedAt
          ).getTime()
      )

  const isVoided =
    statement.status ===
    "voided"

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-5xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-700">
              <FileText
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle>
                Patient Financial Statement
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {
                  statement.statementNumber
                }
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <BillingStatementStatusBadge
                  status={
                    statement.status
                  }
                />

                <BillingBalanceBadge
                  balanceDueCentavos={
                    statement.balanceDueCentavos
                  }
                  creditBalanceCentavos={
                    statement.creditBalanceCentavos
                  }
                />

                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                  <LockKeyhole
                    className="size-3"
                    aria-hidden="true"
                  />
                  Read-only
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-7 px-6 pb-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Statement information
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Statement reference"
                value={
                  <span className="font-mono text-xs">
                    {
                      statement.statementNumber
                    }
                  </span>
                }
              />

              <DetailItem
                label="Billing branch"
                value={
                  statement.branchName
                }
              />

              <DetailItem
                label="Current status"
                value={
                  <BillingStatementStatusBadge
                    status={
                      statement.status
                    }
                  />
                }
              />

              <DetailItem
                label="Created"
                value={formatPatientDateTime(
                  statement.createdAt
                )}
              />

              <DetailItem
                label="Issued"
                value={formatPatientDateTime(
                  statement.issuedAt
                )}
              />

              <DetailItem
                label="Issued by"
                value={
                  statement.issuedBy ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Statement notes"
                className="sm:col-span-2 lg:col-span-3"
                value={
                  statement.notes ??
                  "No statement notes recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Financial summary
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Gross charges
                </p>

                <p className="mt-1 max-w-full break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.grossAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Adjustments
                </p>

                <p className="mt-1 max-w-full break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.adjustmentAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Net charges
                </p>

                <p className="mt-1 max-w-full break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.netChargeAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="text-xs text-violet-700">
                  Coverage allocation
                </p>

                <p className="mt-1 max-w-full break-words text-base font-semibold leading-tight text-violet-800 tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.coverageAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Patient responsibility
                </p>

                <p className="mt-1 max-w-full break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.patientResponsibilityCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <p className="text-xs text-emerald-700">
                  Posted payments
                </p>

                <p className="mt-1 max-w-full break-words text-base font-semibold leading-tight text-emerald-800 tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.amountPaidCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="text-xs text-violet-700">
                  Posted refunds
                </p>

                <p className="mt-1 max-w-full break-words text-base font-semibold leading-tight text-violet-800 tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.refundAmountCentavos
                  )}
                </p>
              </div>

              <div
                className={
                  statement.creditBalanceCentavos >
                  0
                    ? "min-w-0 overflow-hidden rounded-xl border border-violet-200 bg-violet-50 p-4"
                    : statement.balanceDueCentavos >
                        0
                      ? "min-w-0 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-4"
                      : "min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                }
              >
                <p className="text-xs text-muted-foreground">
                  Balance due
                </p>

                <p className="mt-1 max-w-full break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.balanceDueCentavos
                  )}
                </p>

                {statement.creditBalanceCentavos >
                0 ? (
                  <p className="mt-1 max-w-full break-words text-xs font-medium leading-tight text-violet-700 [overflow-wrap:anywhere]">
                    Credit balance:{" "}
                    {formatBillingAmount(
                      statement.creditBalanceCentavos
                    )}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Patient charges
            </h3>

            <div className="overflow-hidden rounded-xl border">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Charge
                    </TableHead>

                    <TableHead>
                      Source
                    </TableHead>

                    <TableHead>
                      Description
                    </TableHead>

                    <TableHead>
                      Quantity
                    </TableHead>

                    <TableHead>
                      Unit amount
                    </TableHead>

                    <TableHead>
                      Gross amount
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {statementCharges.map(
                    (charge) => (
                      <TableRow
                        key={charge.id}
                      >
                        <TableCell>
                          <p className="font-mono text-xs">
                            {
                              charge.chargeNumber
                            }
                          </p>

                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {charge.sourceReference ??
                              "No source reference"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <BillingChargeSourceBadge
                            source={
                              charge.source
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <p className="max-w-sm whitespace-normal font-medium">
                            {
                              charge.description
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          {charge.quantity}
                        </TableCell>

                        <TableCell>
                          {formatBillingAmount(
                            charge.unitAmountCentavos
                          )}
                        </TableCell>

                        <TableCell className="font-semibold">
                          {formatBillingAmount(
                            charge.grossAmountCentavos
                          )}
                        </TableCell>

                        <TableCell>
                          <BillingChargeStatusBadge
                            status={
                              charge.status
                            }
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BadgePercent
                className="size-4 text-amber-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Discounts and adjustments
              </h3>
            </div>

            {statementAdjustments.length ===
            0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No discounts or billing
                adjustments recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[850px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Type
                      </TableHead>

                      <TableHead>
                        Description
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>

                      <TableHead>
                        Posted
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {statementAdjustments.map(
                      (adjustment) => (
                        <TableRow
                          key={adjustment.id}
                        >
                          <TableCell>
                            {
                              BILLING_ADJUSTMENT_TYPE_LABELS[
                                adjustment.type
                              ]
                            }
                          </TableCell>

                          <TableCell>
                            {
                              adjustment.description
                            }
                          </TableCell>

                          <TableCell className="font-semibold">
                            {formatBillingAmount(
                              adjustment.amountCentavos
                            )}
                          </TableCell>

                          <TableCell>
                            <p>
                              {formatPatientDateTime(
                                adjustment.postedAt
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                adjustment.postedBy
                              }
                            </p>
                          </TableCell>

                          <TableCell>
                            <RecordState
                              active={
                                adjustment.status ===
                                "posted"
                              }
                              activeLabel="Posted"
                              inactiveLabel="Reversed"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Insurance and other coverage
              </h3>
            </div>

            {statementCoverage.length ===
            0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No insurance, company, or
                charity coverage allocation
                recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Type
                      </TableHead>

                      <TableHead>
                        Payer
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>

                      <TableHead>
                        Allocated
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {statementCoverage.map(
                      (coverage) => (
                        <TableRow
                          key={coverage.id}
                        >
                          <TableCell>
                            {
                              BILLING_COVERAGE_TYPE_LABELS[
                                coverage.type
                              ]
                            }
                          </TableCell>

                          <TableCell>
                            <p className="font-medium">
                              {
                                coverage.payerName
                              }
                            </p>

                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              {coverage.referenceNumber ??
                                "No reference recorded"}
                            </p>
                          </TableCell>

                          <TableCell className="font-semibold text-violet-700">
                            {formatBillingAmount(
                              coverage.amountCentavos
                            )}
                          </TableCell>

                          <TableCell>
                            <p>
                              {formatPatientDateTime(
                                coverage.allocatedAt
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                coverage.allocatedBy
                              }
                            </p>
                          </TableCell>

                          <TableCell>
                            <RecordState
                              active={
                                coverage.status ===
                                "active"
                              }
                              activeLabel="Active"
                              inactiveLabel="Reversed"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Payments and official receipts
              </h3>
            </div>

            {statementPayments.length ===
            0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No billing payments or
                official receipts recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[1050px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Payment
                      </TableHead>

                      <TableHead>
                        Official receipt
                      </TableHead>

                      <TableHead>
                        Method
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>

                      <TableHead>
                        Posted
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {statementPayments.map(
                      (payment) => (
                        <TableRow
                          key={payment.id}
                        >
                          <TableCell>
                            <span className="font-mono text-xs">
                              {
                                payment.paymentNumber
                              }
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex items-center gap-2 font-mono text-xs">
                              <ReceiptText
                                className="size-3.5 text-emerald-700"
                                aria-hidden="true"
                              />

                              {
                                payment.officialReceiptNumber
                              }
                            </span>
                          </TableCell>

                          <TableCell>
                            <BillingPaymentMethodBadge
                              method={
                                payment.method
                              }
                            />
                          </TableCell>

                          <TableCell className="font-semibold text-emerald-700">
                            {formatBillingAmount(
                              payment.amountCentavos
                            )}
                          </TableCell>

                          <TableCell>
                            <p>
                              {formatPatientDateTime(
                                payment.postedAt
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                payment.postedBy
                              }
                            </p>
                          </TableCell>

                          <TableCell>
                            <RecordState
                              active={
                                payment.status ===
                                "posted"
                              }
                              activeLabel="Posted"
                              inactiveLabel="Reversed"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <RotateCcw
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Refunds
              </h3>
            </div>

            {statementRefunds.length ===
            0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No billing refunds recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[950px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Refund
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>

                      <TableHead>
                        Reason
                      </TableHead>

                      <TableHead>
                        Posted
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {statementRefunds.map(
                      (refund) => (
                        <TableRow
                          key={refund.id}
                        >
                          <TableCell>
                            <span className="font-mono text-xs">
                              {
                                refund.refundNumber
                              }
                            </span>
                          </TableCell>

                          <TableCell className="font-semibold text-violet-700">
                            {formatBillingAmount(
                              refund.amountCentavos
                            )}
                          </TableCell>

                          <TableCell>
                            <p className="max-w-sm whitespace-normal">
                              {refund.reason}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p>
                              {formatPatientDateTime(
                                refund.postedAt
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                refund.postedBy
                              }
                            </p>
                          </TableCell>

                          <TableCell>
                            <RecordState
                              active={
                                refund.status ===
                                "posted"
                              }
                              activeLabel="Posted"
                              inactiveLabel="Reversed"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {isVoided ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-semibold text-rose-800">
                Statement voided
              </h3>

              <p className="mt-2 text-sm text-rose-700">
                {statement.voidReason ??
                  "No void reason recorded."}
              </p>

              <p className="mt-2 text-xs text-rose-700">
                {formatPatientDateTime(
                  statement.voidedAt
                )}
                {" · "}
                {statement.voidedBy ??
                  "Staff not recorded"}
              </p>
            </section>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <LockKeyhole
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This patient financial record
              is read-only. Amounts, charges,
              coverage, payments, official
              receipts, refunds, and staff
              records remain synthetic
              development data.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
