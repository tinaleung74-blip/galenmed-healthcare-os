"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  CreditCard,
  Eye,
  FileText,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  BillingStatementStatusBadge,
} from "@/features/billing/components/billing-status-badges"
import {
  useBilling,
} from "@/features/billing/providers/billing-provider"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"
import { PatientBillingStatementDetailsSheet } from "@/features/patients/components/patient-billing-statement-details-sheet"
import {
  PATIENT_BILLING_HISTORY_FILTERS,
  type PatientBillingHistoryFilter,
  type PatientFinancialStatementRecord,
} from "@/features/patients/types/patient-billing-history.types"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface PatientFinancialHistoryProps {
  patientId: string
}

const historyFilterLabels: Record<
  PatientBillingHistoryFilter,
  string
> = {
  all: "All financial statements",
  open: "Open balances",
  paid: "Fully paid",
  credit: "Credit balances",
  refunded: "With refunds",
  voided: "Voided statements",
}

const selectClassName =
  "h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"

function isHistoryFilter(
  value: string
): value is PatientBillingHistoryFilter {
  return PATIENT_BILLING_HISTORY_FILTERS.some(
    (filter) =>
      filter === value
  )
}

function matchesHistoryFilter(
  record:
    PatientFinancialStatementRecord,

  filter:
    PatientBillingHistoryFilter
): boolean {
  const {
    statement,
  } = record

  switch (filter) {
    case "all":
      return true

    case "open":
      return (
        statement.status !==
          "voided" &&
        statement.balanceDueCentavos >
          0
      )

    case "paid":
      return (
        statement.status !==
          "voided" &&
        statement.balanceDueCentavos ===
          0 &&
        statement.creditBalanceCentavos ===
          0 &&
        statement.status ===
          "paid"
      )

    case "credit":
      return (
        statement.status !==
          "voided" &&
        statement.creditBalanceCentavos >
          0
      )

    case "refunded":
      return (
        statement.status ===
          "refunded" ||
        statement.refundAmountCentavos >
          0
      )

    case "voided":
      return (
        statement.status ===
        "voided"
      )
  }
}

function matchesHistorySearch(
  record:
    PatientFinancialStatementRecord,

  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const {
    statement,
  } = record

  return normalizePatientSearch(
    statement.statementNumber,
    statement.branchName,
    statement.notes,
    statement.issuedBy,
    statement.closedBy,
    statement.voidedBy
  ).includes(normalizedSearch)
}

export function PatientFinancialHistory({
  patientId,
}: PatientFinancialHistoryProps) {
  const {
    statements,
  } = useBilling()

  const [search, setSearch] =
    useState("")

  const [
    historyFilter,
    setHistoryFilter,
  ] =
    useState<PatientBillingHistoryFilter>(
      "all"
    )

  const [
    viewingRecordId,
    setViewingRecordId,
  ] = useState<string | null>(
    null
  )

  const financialRecords =
    useMemo(() => {
      const records:
        PatientFinancialStatementRecord[] =
        statements
          .filter(
            (statement) =>
              statement.patientId ===
                patientId &&
              statement.status !==
                "draft"
          )
          .map(
            (statement) => ({
              id: statement.id,
              statement,
            })
          )

      return records.sort(
        (
          firstRecord,
          secondRecord
        ) =>
          new Date(
            secondRecord.statement
              .issuedAt ??
              secondRecord.statement
                .updatedAt
          ).getTime() -
          new Date(
            firstRecord.statement
              .issuedAt ??
              firstRecord.statement
                .updatedAt
          ).getTime()
      )
    }, [
      patientId,
      statements,
    ])

  const filteredRecords =
    useMemo(
      () =>
        financialRecords.filter(
          (record) =>
            matchesHistorySearch(
              record,
              search
            ) &&
            matchesHistoryFilter(
              record,
              historyFilter
            )
        ),
      [
        financialRecords,
        historyFilter,
        search,
      ]
    )

  const viewingRecord =
    financialRecords.find(
      (record) =>
        record.id ===
        viewingRecordId
    ) ?? null

  const openBalanceTotal =
    financialRecords.reduce(
      (
        total,
        record
      ) =>
        record.statement.status ===
        "voided"
          ? total
          : total +
            record.statement
              .balanceDueCentavos,
      0
    )

  const postedPaymentTotal =
    financialRecords.reduce(
      (
        total,
        record
      ) =>
        total +
        record.statement
          .amountPaidCentavos,
      0
    )

  const creditBalanceTotal =
    financialRecords.reduce(
      (
        total,
        record
      ) =>
        total +
        record.statement
          .creditBalanceCentavos,
      0
    )

  const latestStatementAt =
    financialRecords[0]
      ?.statement.issuedAt ??
    financialRecords[0]
      ?.statement.updatedAt ??
    null

  const hasActiveFilters =
    search.trim().length > 0 ||
    historyFilter !== "all"

  function resetFilters() {
    setSearch("")
    setHistoryFilter("all")
  }

  return (
    <>
      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
            <CreditCard
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Patient Financial History
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Read-only issued billing
              statements, charges, coverage,
              payments, official receipts,
              refunds, and balances.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Financial statements
              </p>

              <p className="mt-1 text-xl font-semibold">
                {financialRecords.length}
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              openBalanceTotal > 0
                ? "border-amber-200 bg-amber-50/40 shadow-none"
                : "shadow-none"
            }
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Open balance
              </p>

              <p className="mt-1 break-words text-lg font-semibold tabular-nums [overflow-wrap:anywhere]">
                {formatBillingAmount(
                  openBalanceTotal
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">
                Posted payments
              </p>

              <p className="mt-1 break-words text-lg font-semibold text-emerald-800 tabular-nums [overflow-wrap:anywhere]">
                {formatBillingAmount(
                  postedPaymentTotal
                )}
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              creditBalanceTotal > 0
                ? "border-violet-200 bg-violet-50/40 shadow-none"
                : "shadow-none"
            }
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Credit balance
              </p>

              <p className="mt-1 break-words text-lg font-semibold tabular-nums [overflow-wrap:anywhere]">
                {formatBillingAmount(
                  creditBalanceTotal
                )}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Latest:{" "}
                {formatPatientDateTime(
                  latestStatementAt,
                  "No issued statement"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="space-y-3 border-b p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  value={search}
                  placeholder="Search statement, branch, or billing staff"
                  className="pl-8"
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={historyFilter}
                className={selectClassName}
                onChange={(event) => {
                  const nextFilter =
                    event.target.value

                  if (
                    isHistoryFilter(
                      nextFilter
                    )
                  ) {
                    setHistoryFilter(
                      nextFilter
                    )
                  }
                }}
              >
                {PATIENT_BILLING_HISTORY_FILTERS.map(
                  (filter) => (
                    <option
                      key={filter}
                      value={filter}
                    >
                      {
                        historyFilterLabels[
                          filter
                        ]
                      }
                    </option>
                  )
                )}
              </select>

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                >
                  <RotateCcw
                    aria-hidden="true"
                  />
                  Reset
                </Button>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {filteredRecords.length} of{" "}
              {financialRecords.length} patient
              financial statements
            </p>
          </div>

          {financialRecords.length ===
          0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <FileText
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold">
                No issued financial
                statements
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Draft statements remain in
                Billing Management and do
                not appear in Patient
                Financial History.
              </p>
            </div>
          ) : filteredRecords.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold">
                No matching financial
                statements
              </h3>

              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <Table className="min-w-[1250px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Statement
                  </TableHead>

                  <TableHead>
                    Issued
                  </TableHead>

                  <TableHead>
                    Patient responsibility
                  </TableHead>

                  <TableHead>
                    Payments / Refunds
                  </TableHead>

                  <TableHead>
                    Balance
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    <span className="sr-only">
                      Financial statement
                      action
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map(
                  (record) => {
                    const {
                      statement,
                    } = record

                    return (
                      <TableRow
                        key={record.id}
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {
                              statement.statementNumber
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              statement.branchName
                            }
                            {" · "}
                            {
                              statement.chargeIds.length
                            }{" "}
                            charge
                            {statement.chargeIds.length ===
                            1
                              ? ""
                              : "s"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            {formatPatientDateTime(
                              statement.issuedAt,
                              statement.status ===
                                "voided"
                                ? "Voided before issue"
                                : "Not recorded"
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {statement.issuedBy ??
                              "Staff not recorded"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-semibold">
                            {formatBillingAmount(
                              statement.patientResponsibilityCentavos
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Coverage:{" "}
                            {formatBillingAmount(
                              statement.coverageAmountCentavos
                            )}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p>
                            Paid:{" "}
                            {formatBillingAmount(
                              statement.amountPaidCentavos
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Refunded:{" "}
                            {formatBillingAmount(
                              statement.refundAmountCentavos
                            )}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-semibold">
                            {formatBillingAmount(
                              statement.balanceDueCentavos
                            )}
                          </p>

                          {statement.creditBalanceCentavos >
                          0 ? (
                            <p className="mt-1 text-xs font-medium text-violet-700">
                              Credit:{" "}
                              {formatBillingAmount(
                                statement.creditBalanceCentavos
                              )}
                            </p>
                          ) : null}

                          <div className="mt-2">
                            <BillingBalanceBadge
                              balanceDueCentavos={
                                statement.balanceDueCentavos
                              }
                              creditBalanceCentavos={
                                statement.creditBalanceCentavos
                              }
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <BillingStatementStatusBadge
                            status={
                              statement.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setViewingRecordId(
                                record.id
                              )
                            }
                          >
                            <Eye
                              aria-hidden="true"
                            />
                            View statement
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            Charges, prices, discounts,
            coverage allocations, payments,
            official receipts, refunds, and
            staff records are synthetic
            development data.
          </p>
        </div>
      </section>

      <PatientBillingStatementDetailsSheet
        record={viewingRecord}
        open={Boolean(
          viewingRecord
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingRecordId(null)
          }
        }}
      />
    </>
  )
}
