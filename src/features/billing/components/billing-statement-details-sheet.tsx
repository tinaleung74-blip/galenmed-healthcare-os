"use client"

import type {
  ReactNode,
} from "react"
import {
  BadgePercent,
  CreditCard,
  FileCheck2,
  FileText,
  LockKeyhole,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Undo2,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { BillingAuditHistory } from "@/features/billing/components/billing-audit-history"
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
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import type {
  BillingAdjustment,
  BillingCharge,
  BillingCoverageAllocation,
  BillingPayment,
  BillingRefund,
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

interface BillingStatementDetailsSheetProps {
  statement:
    | BillingStatement
    | null

  patient:
    | Patient
    | null

  charges:
    readonly BillingCharge[]

  adjustments:
    readonly BillingAdjustment[]

  coverageAllocations:
    readonly BillingCoverageAllocation[]

  payments:
    readonly BillingPayment[]

  refunds:
    readonly BillingRefund[]

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onIssueStatement: (
    statement: BillingStatement
  ) => void

  onAddAdjustment: (
    statement: BillingStatement
  ) => void

  onAddCoverage: (
    statement: BillingStatement
  ) => void

  onRecordPayment: (
    statement: BillingStatement
  ) => void

  onRecordRefund: (
    statement: BillingStatement
  ) => void

  onReverseAdjustment: (
    adjustment: BillingAdjustment
  ) => void

  onReverseCoverage: (
    coverage:
      BillingCoverageAllocation
  ) => void

  onReversePayment: (
    payment: BillingPayment
  ) => void

  onReverseRefund: (
    refund: BillingRefund
  ) => void

  onVoidStatement: (
    statement: BillingStatement
  ) => void

  onViewReceipt: (
    payment: BillingPayment
  ) => void

  onOpenPatientProfile: (
    patient: Patient
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
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm">
        {value}
      </dd>
    </div>
  )
}

function RecordState({
  activeLabel,
  reversedLabel,
  active,
}: {
  activeLabel: string
  reversedLabel: string
  active: boolean
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
        : reversedLabel}
    </span>
  )
}

export function BillingStatementDetailsSheet({
  statement,
  patient,
  charges,
  adjustments,
  coverageAllocations,
  payments,
  refunds,
  open,
  onOpenChange,
  onIssueStatement,
  onAddAdjustment,
  onAddCoverage,
  onRecordPayment,
  onRecordRefund,
  onReverseAdjustment,
  onReverseCoverage,
  onReversePayment,
  onReverseRefund,
  onVoidStatement,
  onViewReceipt,
  onOpenPatientProfile,
}: BillingStatementDetailsSheetProps) {
  if (!statement || !patient) {
    return null
  }

  const statementCharges =
    charges.filter((charge) =>
      statement.chargeIds.includes(
        charge.id
      )
    )

  const statementAdjustments =
    adjustments
      .filter((adjustment) =>
        statement.adjustmentIds.includes(
          adjustment.id
        )
      )
      .sort(
        (first, second) =>
          new Date(
            second.postedAt
          ).getTime() -
          new Date(
            first.postedAt
          ).getTime()
      )

  const statementCoverage =
    coverageAllocations
      .filter((coverage) =>
        statement.coverageAllocationIds.includes(
          coverage.id
        )
      )
      .sort(
        (first, second) =>
          new Date(
            second.allocatedAt
          ).getTime() -
          new Date(
            first.allocatedAt
          ).getTime()
      )

  const statementPayments =
    payments
      .filter((payment) =>
        statement.paymentIds.includes(
          payment.id
        )
      )
      .sort(
        (first, second) =>
          new Date(
            second.postedAt
          ).getTime() -
          new Date(
            first.postedAt
          ).getTime()
      )

  const statementRefunds =
    refunds
      .filter((refund) =>
        statement.refundIds.includes(
          refund.id
        )
      )
      .sort(
        (first, second) =>
          new Date(
            second.postedAt
          ).getTime() -
          new Date(
            first.postedAt
          ).getTime()
      )

  const hasPostedPayments =
    statementPayments.some(
      (payment) =>
        payment.status === "posted"
    )

  const hasPostedRefunds =
    statementRefunds.some(
      (refund) =>
        refund.status === "posted"
    )

  const remainingCoverageCapacity =
    Math.max(
      0,
      statement.netChargeAmountCentavos -
        statement.coverageAmountCentavos
    )

  const refundableAmount =
    Math.max(
      0,
      statement.amountPaidCentavos -
        statement.refundAmountCentavos
    )

  const isVoided =
    statement.status === "voided"

  const canIssue =
    statement.status === "draft"

  const canAdjust = !isVoided

  const canAddCoverage =
    !isVoided &&
    remainingCoverageCapacity > 0

  const canRecordPayment =
    !isVoided &&
    Boolean(statement.issuedAt) &&
    statement.balanceDueCentavos > 0

  const canRecordRefund =
    !isVoided &&
    refundableAmount > 0

  const canVoid =
    !isVoided &&
    !hasPostedPayments &&
    !hasPostedRefunds

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
                Billing Statement
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {statement.statementNumber}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <BillingStatementStatusBadge
                  status={statement.status}
                />

                <BillingBalanceBadge
                  balanceDueCentavos={
                    statement.balanceDueCentavos
                  }
                  creditBalanceCentavos={
                    statement.creditBalanceCentavos
                  }
                />

                {isVoided ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    <LockKeyhole
                      className="size-3"
                      aria-hidden="true"
                    />
                    Voided / Read-only
                  </span>
                ) : null}
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
                Patient and statement
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Patient"
                value={getPatientFullName(
                  patient
                )}
              />

              <DetailItem
                label="Medical record number"
                value={
                  <span className="font-mono text-xs">
                    {
                      patient.medicalRecordNumber
                    }
                  </span>
                }
              />

              <DetailItem
                label="Billing branch"
                value={statement.branchName}
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
                  "Not issued"
                }
              />

              <DetailItem
                label="Statement notes"
                className="sm:col-span-2 lg:col-span-3"
                value={
                  statement.notes ??
                  "No notes recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Statement totals
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Gross charges
                </p>

                <p className="mt-1 max-w-full whitespace-normal break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.grossAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Adjustments
                </p>

                <p className="mt-1 max-w-full whitespace-normal break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.adjustmentAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Net charges
                </p>

                <p className="mt-1 max-w-full whitespace-normal break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.netChargeAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="text-xs text-violet-700">
                  Coverage
                </p>

                <p className="mt-1 max-w-full whitespace-normal break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg text-violet-800">
                  {formatBillingAmount(
                    statement.coverageAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Patient responsibility
                </p>

                <p className="mt-1 max-w-full whitespace-normal break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.patientResponsibilityCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <p className="text-xs text-emerald-700">
                  Payments
                </p>

                <p className="mt-1 max-w-full whitespace-normal break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg text-emerald-800">
                  {formatBillingAmount(
                    statement.amountPaidCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="text-xs text-violet-700">
                  Refunds
                </p>

                <p className="mt-1 max-w-full whitespace-normal break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg text-violet-800">
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

                <p className="mt-1 max-w-full whitespace-normal break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-lg">
                  {formatBillingAmount(
                    statement.balanceDueCentavos
                  )}
                </p>

                {statement.creditBalanceCentavos >
                0 ? (
                  <p className="mt-1 max-w-full whitespace-normal break-words text-xs font-medium leading-tight text-violet-700 [overflow-wrap:anywhere]">
                    Credit:{" "}
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
              Posted charges
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

                          {charge.notes ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {charge.notes}
                            </p>
                          ) : null}
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
                Adjustments and discounts
              </h3>
            </div>

            {statementAdjustments.length ===
            0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No billing adjustments
                recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[950px]">
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

                      <TableHead>
                        <span className="sr-only">
                          Adjustment action
                        </span>
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

                          <TableCell
                            className={
                              adjustment.amountCentavos <
                              0
                                ? "font-semibold text-emerald-700"
                                : "font-semibold text-amber-700"
                            }
                          >
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
                              activeLabel="Posted"
                              reversedLabel="Reversed"
                              active={
                                adjustment.status ===
                                "posted"
                              }
                            />
                          </TableCell>

                          <TableCell>
                            {adjustment.status ===
                              "posted" &&
                            !isVoided ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onReverseAdjustment(
                                    adjustment
                                  )
                                }
                              >
                                <Undo2
                                  aria-hidden="true"
                                />
                                Reverse
                              </Button>
                            ) : null}
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
                Coverage allocations
              </h3>
            </div>

            {statementCoverage.length ===
            0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No insurance, company, or
                charity allocation recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[1000px]">
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
                        Reference
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        <span className="sr-only">
                          Coverage action
                        </span>
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

                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatPatientDateTime(
                                coverage.allocatedAt
                              )}
                              {" · "}
                              {
                                coverage.allocatedBy
                              }
                            </p>
                          </TableCell>

                          <TableCell className="font-semibold text-violet-700">
                            {formatBillingAmount(
                              coverage.amountCentavos
                            )}
                          </TableCell>

                          <TableCell>
                            <span className="font-mono text-xs">
                              {coverage.referenceNumber ??
                                "Not recorded"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <RecordState
                              activeLabel="Active"
                              reversedLabel="Reversed"
                              active={
                                coverage.status ===
                                "active"
                              }
                            />
                          </TableCell>

                          <TableCell>
                            {coverage.status ===
                              "active" &&
                            !isVoided ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onReverseCoverage(
                                    coverage
                                  )
                                }
                              >
                                <Undo2
                                  aria-hidden="true"
                                />
                                Reverse
                              </Button>
                            ) : null}
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
                No billing payments
                recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[1150px]">
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

                      <TableHead>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {statementPayments.map(
                      (payment) => {
                        const hasActiveLinkedRefund =
                          statementRefunds.some(
                            (refund) =>
                              refund.paymentId ===
                                payment.id &&
                              refund.status ===
                                "posted"
                          )

                        return (
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
                              <span className="font-mono text-xs">
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
                                activeLabel="Posted"
                                reversedLabel="Reversed"
                                active={
                                  payment.status ===
                                  "posted"
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onViewReceipt(
                                      payment
                                    )
                                  }
                                >
                                  <ReceiptText
                                    aria-hidden="true"
                                  />
                                  Receipt
                                </Button>

                                {payment.status ===
                                  "posted" &&
                                !isVoided &&
                                !hasActiveLinkedRefund ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      onReversePayment(
                                        payment
                                      )
                                    }
                                  >
                                    <Undo2
                                      aria-hidden="true"
                                    />
                                    Reverse
                                  </Button>
                                ) : null}

                                {hasActiveLinkedRefund &&
                                payment.status ===
                                  "posted" ? (
                                  <span className="self-center text-xs text-muted-foreground">
                                    Reverse linked
                                    refund first
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      }
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
                <Table className="min-w-[1050px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Refund
                      </TableHead>

                      <TableHead>
                        Related receipt
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

                      <TableHead>
                        <span className="sr-only">
                          Refund action
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {statementRefunds.map(
                      (refund) => {
                        const linkedPayment =
                          refund.paymentId
                            ? statementPayments.find(
                                (payment) =>
                                  payment.id ===
                                  refund.paymentId
                              ) ?? null
                            : null

                        return (
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

                            <TableCell>
                              <span className="font-mono text-xs">
                                {linkedPayment
                                  ?.officialReceiptNumber ??
                                  "Statement-level"}
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
                                activeLabel="Posted"
                                reversedLabel="Reversed"
                                active={
                                  refund.status ===
                                  "posted"
                                }
                              />
                            </TableCell>

                            <TableCell>
                              {refund.status ===
                                "posted" &&
                              !isVoided ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onReverseRefund(
                                      refund
                                    )
                                  }
                                >
                                  <Undo2
                                    aria-hidden="true"
                                  />
                                  Reverse
                                </Button>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        )
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <BillingAuditHistory
            statement={statement}
            charges={statementCharges}
            adjustments={
              statementAdjustments
            }
            coverageAllocations={
              statementCoverage
            }
            payments={
              statementPayments
            }
            refunds={
              statementRefunds
            }
          />

          {statement.voidReason ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-semibold text-rose-800">
                Statement void reason
              </h3>

              <p className="mt-2 text-sm text-rose-700">
                {statement.voidReason}
              </p>

              <p className="mt-2 text-xs text-rose-700">
                Voided{" "}
                {formatPatientDateTime(
                  statement.voidedAt
                )}
                {" by "}
                {statement.voidedBy ??
                  "Not recorded"}.
              </p>
            </section>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {BILLING_SYNTHETIC_NOTICE}
              Production billing requires
              authenticated posting,
              accounting controls, and
              append-only audit records.
            </p>
          </div>
        </div>

        <SheetFooter className="gap-3 border-t bg-slate-50 p-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {canIssue ? (
              <Button
                type="button"
                className="bg-sky-700 text-white hover:bg-sky-800"
                onClick={() =>
                  onIssueStatement(
                    statement
                  )
                }
              >
                <FileCheck2
                  aria-hidden="true"
                />
                Issue statement
              </Button>
            ) : null}

            {canAdjust ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onAddAdjustment(
                    statement
                  )
                }
              >
                <BadgePercent
                  aria-hidden="true"
                />
                Add adjustment
              </Button>
            ) : null}

            {canAddCoverage ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onAddCoverage(
                    statement
                  )
                }
              >
                <ShieldCheck
                  aria-hidden="true"
                />
                Add coverage
              </Button>
            ) : null}

            {canRecordPayment ? (
              <Button
                type="button"
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={() =>
                  onRecordPayment(
                    statement
                  )
                }
              >
                <CreditCard
                  aria-hidden="true"
                />
                Record payment
              </Button>
            ) : null}

            {canRecordRefund ? (
              <Button
                type="button"
                className="bg-violet-700 text-white hover:bg-violet-800"
                onClick={() =>
                  onRecordRefund(
                    statement
                  )
                }
              >
                <RotateCcw
                  aria-hidden="true"
                />
                Record refund
              </Button>
            ) : null}

            {canVoid ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  onVoidStatement(
                    statement
                  )
                }
              >
                <Undo2
                  aria-hidden="true"
                />
                Void statement
              </Button>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
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
              variant="outline"
              onClick={() =>
                onOpenPatientProfile(
                  patient
                )
              }
            >
              <UserRound
                aria-hidden="true"
              />
              Patient profile
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
