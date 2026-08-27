"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Eye,
  KeyRound,
  LogOut,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react"
import Link from "next/link"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
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
  signOutStaff,
} from "@/features/auth/actions/staff-auth.actions"
import type {
  StaffContext,
} from "@/features/auth/types/staff-auth.types"
import {
  CashierBillingDetailsSheet,
} from "@/features/hospital-operations/components/cashier-billing-details-sheet"
import {
  CashierBillingStatusBadge,
  CashierClearanceStatusBadge,
} from "@/features/hospital-operations/components/cashier-billing-badges"
import {
  CashierPaymentClearanceDialog,
} from "@/features/hospital-operations/components/cashier-payment-clearance-dialog"
import {
  CashierRecordPaymentDialog,
} from "@/features/hospital-operations/components/cashier-record-payment-dialog"
import type {
  CashierBillingAccount,
  CashierBillingPageData,
  CashierPaymentClearance,
} from "@/features/hospital-operations/types/cashier-billing.types"
import {
  formatCashierAmount,
  formatCashierDateTime,
  getCashierPatientFullName,
  normalizeCashierSearch,
} from "@/features/hospital-operations/utils/cashier-billing.utils"
import { cn } from "@/lib/utils"

interface CashierBillingWorkspaceProps {
  context: StaffContext
  data: CashierBillingPageData
}

type CashierAccountFilter =
  | "all"
  | "pending"
  | "paid"
  | "other"

function matchesAccountFilter(
  account: CashierBillingAccount,
  filter: CashierAccountFilter
): boolean {
  if (filter === "all") {
    return true
  }

  if (filter === "pending") {
    return (
      account.status === "open" ||
      account.status ===
        "partially_paid"
    )
  }

  if (filter === "paid") {
    return (
      account.status === "paid" ||
      account.status === "waived"
    )
  }

  return (
    account.status === "refunded" ||
    account.status === "voided"
  )
}

export function CashierBillingWorkspace({
  context,
  data,
}: CashierBillingWorkspaceProps) {
  const [search, setSearch] =
    useState("")

  const [
    accountFilter,
    setAccountFilter,
  ] = useState<CashierAccountFilter>(
    "all"
  )

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("all")

  const [
    selectedAccountId,
    setSelectedAccountId,
  ] = useState<string | null>(
    null
  )

  const [
    paymentAccountId,
    setPaymentAccountId,
  ] = useState<string | null>(
    null
  )

  const [
    paymentDialogSession,
    setPaymentDialogSession,
  ] = useState(0)

  const [
    clearanceSelection,
    setClearanceSelection,
  ] = useState<{
    accountId: string
    clearanceId: string
  } | null>(null)

  const [
    clearanceDialogSession,
    setClearanceDialogSession,
  ] = useState(0)

  const filteredAccounts =
    useMemo(
      () =>
        data.accounts.filter(
          (account) => {
            const matchesSearch =
              normalizeCashierSearch(
                account.billingNumber,
                account.visit.visitNumber,
                account.patient
                  .medicalRecordNumber,
                getCashierPatientFullName(
                  account
                ),
                account.patient.mobileNumber,
                account.branchName,
                ...account.paymentClearances.map(
                  (clearance) =>
                    clearance.requestNumber
                ),
                ...account.paymentClearances.map(
                  (clearance) =>
                    clearance.serviceName
                )
              ).includes(
                normalizeCashierSearch(
                  search
                )
              )

            const matchesStatus =
              matchesAccountFilter(
                account,
                accountFilter
              )

            const matchesBranch =
              branchFilter === "all" ||
              account.branchId ===
                branchFilter

            return (
              matchesSearch &&
              matchesStatus &&
              matchesBranch
            )
          }
        ),
      [
        accountFilter,
        branchFilter,
        data.accounts,
        search,
      ]
    )

  const selectedAccount =
    selectedAccountId
      ? data.accounts.find(
          (account) =>
            account.id ===
            selectedAccountId
        ) ?? null
      : null

  const paymentAccount =
    paymentAccountId
      ? data.accounts.find(
          (account) =>
            account.id ===
            paymentAccountId
        ) ?? null
      : null

  const clearanceAccount =
    clearanceSelection
      ? data.accounts.find(
          (account) =>
            account.id ===
            clearanceSelection.accountId
        ) ?? null
      : null

  const selectedClearance =
    clearanceAccount &&
    clearanceSelection
      ? clearanceAccount.paymentClearances.find(
          (clearance) =>
            clearance.id ===
            clearanceSelection.clearanceId
        ) ?? null
      : null

  const pendingAccountCount =
    data.accounts.filter(
      (account) =>
        account.status === "open" ||
        account.status ===
          "partially_paid"
    ).length

  const paidAccountCount =
    data.accounts.filter(
      (account) =>
        account.status === "paid" ||
        account.status === "waived"
    ).length

  const totalOutstanding =
    data.accounts.reduce(
      (
        total,
        account
      ) =>
        total +
        account.balanceAmountCentavos,
      0
    )

  const today =
    new Date().toDateString()

  const paidToday =
    data.accounts.reduce(
      (
        accountTotal,
        account
      ) =>
        accountTotal +
        account.paymentTransactions
          .filter(
            (payment) =>
              payment.status ===
                "posted" &&
              new Date(
                payment.postedAt
              ).toDateString() ===
                today
          )
          .reduce(
            (
              paymentTotal,
              payment
            ) =>
              paymentTotal +
              payment.amountCentavos,
            0
          ),
      0
    )

  const availableBranches =
    Array.from(
      new Map(
        data.accounts.map(
          (account) => [
            account.branchId,
            account.branchName,
          ]
        )
      ).entries()
    )

  const canWaive =
    context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )

  function openPaymentDialog(
    account: CashierBillingAccount
  ) {
    setPaymentAccountId(
      account.id
    )
    setPaymentDialogSession(
      (currentSession) =>
        currentSession + 1
    )
  }

  function openClearanceDialog(
    account: CashierBillingAccount,
    clearance:
      CashierPaymentClearance
  ) {
    setClearanceSelection({
      accountId: account.id,
      clearanceId:
        clearance.id,
    })
    setClearanceDialogSession(
      (currentSession) =>
        currentSession + 1
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <GalenMedLogo
              size="md"
              priority
              className="rounded-xl bg-white p-1 ring-1 ring-slate-200"
            />

            <div>
              <p className="font-semibold tracking-tight">
                GalenMed
              </p>
              <p className="text-xs text-muted-foreground">
                Cashier and Billing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/cashier/dashboard"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <ArrowLeft
                aria-hidden="true"
              />
              Dashboard
            </Link>

            <Link
              href="/staff/account/change-password"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <KeyRound
                aria-hidden="true"
              />
              Change password
            </Link>

            <form action={signOutStaff}>
              <Button
                type="submit"
                variant="outline"
              >
                <LogOut
                  aria-hidden="true"
                />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
            <WalletCards
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm text-emerald-700">
              Search-first Cashier workspace
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Patient Billing and Payment Clearance
            </h1>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              Search a patient, visit, billing
              number, or service request;
              review consolidated charges,
              record full or partial payments,
              issue receipt references, and
              explicitly clear services before
              Receptionist document release.
            </p>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Pending accounts
              </p>
              <p className="mt-1 text-xl font-semibold">
                {pendingAccountCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">
                Paid / waived accounts
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">
                {paidAccountCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-amber-700">
                Total outstanding
              </p>
              <p className="mt-1 break-words text-xl font-semibold text-amber-800 tabular-nums [overflow-wrap:anywhere]">
                {formatCashierAmount(
                  totalOutstanding
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-sky-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-sky-700">
                Payments posted today
              </p>
              <p className="mt-1 break-words text-xl font-semibold text-sky-800 tabular-nums [overflow-wrap:anywhere]">
                {formatCashierAmount(
                  paidToday
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1 xl:max-w-xl">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                placeholder="Search patient name, MRN, billing number, visit, request, or service"
                className="pl-8"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={accountFilter}
              className="h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setAccountFilter(
                  event.target.value as
                    CashierAccountFilter
                )
              }
            >
              <option value="all">
                All account statuses
              </option>
              <option value="pending">
                Pending / partially paid
              </option>
              <option value="paid">
                Paid / waived
              </option>
              <option value="other">
                Refunded / voided
              </option>
            </select>

            <select
              value={branchFilter}
              className="h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setBranchFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All assigned branches
              </option>

              {availableBranches.map(
                ([branchId, branchName]) => (
                  <option
                    key={branchId}
                    value={branchId}
                  >
                    {branchName}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border bg-white">
          <Table className="min-w-[1450px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Billing account
                </TableHead>
                <TableHead>
                  Patient
                </TableHead>
                <TableHead>
                  Visit / Branch
                </TableHead>
                <TableHead>
                  Status
                </TableHead>
                <TableHead>
                  Gross
                </TableHead>
                <TableHead>
                  Paid
                </TableHead>
                <TableHead>
                  Balance
                </TableHead>
                <TableHead>
                  Service clearance
                </TableHead>
                <TableHead>
                  Updated
                </TableHead>
                <TableHead>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAccounts.length >
              0 ? (
                filteredAccounts.map(
                  (account) => {
                    const unclearedCount =
                      account.paymentClearances.filter(
                        (clearance) =>
                          ![
                            "cleared",
                            "waived",
                          ].includes(
                            clearance.clearanceStatus
                          )
                      ).length

                    return (
                      <TableRow
                        key={account.id}
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-semibold">
                            {account.billingNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {account.paymentTransactions.length} payment(s)
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {getCashierPatientFullName(
                              account
                            )}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {
                              account.patient
                                .medicalRecordNumber
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-mono text-xs">
                            {account.visit.visitNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {account.branchName}
                          </p>
                        </TableCell>

                        <TableCell>
                          <CashierBillingStatusBadge
                            status={account.status}
                          />
                        </TableCell>

                        <TableCell className="font-semibold tabular-nums">
                          {formatCashierAmount(
                            account.grossAmountCentavos
                          )}
                        </TableCell>

                        <TableCell className="font-semibold text-emerald-700 tabular-nums">
                          {formatCashierAmount(
                            account.paidAmountCentavos
                          )}
                        </TableCell>

                        <TableCell className="font-semibold text-amber-700 tabular-nums">
                          {formatCashierAmount(
                            account.balanceAmountCentavos
                          )}
                        </TableCell>

                        <TableCell>
                          {account.paymentClearances.length ===
                          0 ? (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          ) : unclearedCount ===
                            0 ? (
                            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                              <BadgeCheck
                                className="size-4"
                                aria-hidden="true"
                              />
                              All cleared
                            </div>
                          ) : (
                            <div>
                              <CashierClearanceStatusBadge
                                status={
                                  account.paymentClearances[0]
                                    ?.clearanceStatus ??
                                  "pending"
                                }
                              />
                              <p className="mt-1 text-xs text-muted-foreground">
                                {unclearedCount} pending action(s)
                              </p>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {formatCashierDateTime(
                            account.updatedAt
                          )}
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedAccountId(
                                account.id
                              )
                            }
                          >
                            <Eye
                              aria-hidden="true"
                            />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-16 text-center"
                  >
                    <ReceiptText
                      className="mx-auto size-8 text-slate-300"
                      aria-hidden="true"
                    />
                    <p className="mt-3 font-medium">
                      No billing accounts match the current filters.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reception-created visits and service charges will appear here automatically.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
          <CreditCard
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            Cashier actions update financial
            clearance only. Doctors and
            Laboratory staff remain responsible
            for clinical content and result
            finalization; Receptionists remain
            responsible for physical or digital
            document release.
          </p>
        </div>
      </div>

      <CashierBillingDetailsSheet
        account={selectedAccount}
        open={Boolean(
          selectedAccount
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedAccountId(null)
          }
        }}
        onRecordPayment={
          openPaymentDialog
        }
        onManageClearance={
          openClearanceDialog
        }
      />

      <CashierRecordPaymentDialog
        key={`cashier-payment-${paymentDialogSession}`}
        account={paymentAccount}
        open={Boolean(
          paymentAccount
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPaymentAccountId(null)
          }
        }}
      />

      <CashierPaymentClearanceDialog
        key={`cashier-clearance-${clearanceDialogSession}`}
        account={clearanceAccount}
        clearance={selectedClearance}
        canWaive={canWaive}
        open={Boolean(
          clearanceAccount &&
            selectedClearance
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setClearanceSelection(null)
          }
        }}
      />
    </main>
  )
}
