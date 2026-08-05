"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  useRouter,
} from "next/navigation"
import {
  CreditCard,
  Eye,
  FileCheck2,
  FilePlus2,
  FileText,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  WalletCards,
} from "lucide-react"
import { toast } from "sonner"

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
import { BillingAdjustmentDialog } from "@/features/billing/components/billing-adjustment-dialog"
import { BillingChargeFormDialog } from "@/features/billing/components/billing-charge-form-dialog"
import { BillingCoverageDialog } from "@/features/billing/components/billing-coverage-dialog"
import { BillingOfficialReceiptDialog } from "@/features/billing/components/billing-official-receipt-dialog"
import { BillingPaymentDialog } from "@/features/billing/components/billing-payment-dialog"
import { BillingRefundDialog } from "@/features/billing/components/billing-refund-dialog"
import { BillingReversalDialog } from "@/features/billing/components/billing-reversal-dialog"
import { BillingStatementDetailsSheet } from "@/features/billing/components/billing-statement-details-sheet"
import { BillingStatementFormDialog } from "@/features/billing/components/billing-statement-form-dialog"
import { BillingStatementIssueDialog } from "@/features/billing/components/billing-statement-issue-dialog"
import {
  BillingBalanceBadge,
  BillingChargeSourceBadge,
  BillingStatementStatusBadge,
} from "@/features/billing/components/billing-status-badges"
import {
  BILLING_BALANCE_STATE_LABELS,
  BILLING_DATE_VIEW_LABELS,
  BILLING_STATEMENT_STATUS_LABELS,
  DEFAULT_BILLING_STATEMENT_FILTERS,
} from "@/features/billing/constants/billing.constants"
import {
  useBilling,
} from "@/features/billing/providers/billing-provider"
import type {
  BillingAdjustmentFormValues,
} from "@/features/billing/schemas/billing-adjustment.schema"
import type {
  BillingChargeFormValues,
} from "@/features/billing/schemas/billing-charge.schema"
import type {
  BillingCoverageFormValues,
} from "@/features/billing/schemas/billing-coverage.schema"
import type {
  BillingPaymentFormValues,
  BillingRefundFormValues,
  BillingReversalValues,
} from "@/features/billing/schemas/billing-payment.schema"
import type {
  BillingStatementFormValues,
  BillingStatementIssueValues,
} from "@/features/billing/schemas/billing-statement.schema"
import {
  BILLING_BALANCE_STATES,
  BILLING_DATE_VIEWS,
  BILLING_STATEMENT_STATUSES,
  type BillingAdjustment,
  type BillingBalanceState,
  type BillingCoverageAllocation,
  type BillingDateView,
  type BillingPayment,
  type BillingRefund,
  type BillingStatement,
  type BillingStatementFilters,
  type BillingStatementStatus,
} from "@/features/billing/types/billing.types"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
  getPatientInitials,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"

type BillingReversalTarget =
  | {
      kind: "adjustment"
      id: string
      reference: string
    }
  | {
      kind: "coverage"
      id: string
      reference: string
    }
  | {
      kind: "payment"
      id: string
      reference: string
    }
  | {
      kind: "refund"
      id: string
      reference: string
    }
  | {
      kind: "statement"
      id: string
      reference: string
    }

interface BillingReversalConfiguration {
  title: string
  description: string
  actionLabel: string
  reference: string
}

function getLocalDateKey(
  value: string
): string {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return ""
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-")
}

function matchesDateView(
  statement: BillingStatement,
  dateView: BillingDateView,
  selectedDate: string
): boolean {
  if (dateView === "all") {
    return true
  }

  const statementTimestamp =
    statement.issuedAt ??
    statement.createdAt

  const statementDate =
    getLocalDateKey(
      statementTimestamp
    )

  if (dateView === "day") {
    return (
      statementDate ===
      selectedDate
    )
  }

  const endDate =
    new Date(
      `${selectedDate}T23:59:59`
    )

  const startDate =
    new Date(
      `${selectedDate}T00:00:00`
    )

  if (
    Number.isNaN(
      endDate.getTime()
    ) ||
    Number.isNaN(
      startDate.getTime()
    )
  ) {
    return false
  }

  startDate.setDate(
    startDate.getDate() - 6
  )

  const timestamp =
    new Date(
      statementTimestamp
    ).getTime()

  return (
    timestamp >=
      startDate.getTime() &&
    timestamp <=
      endDate.getTime()
  )
}

function matchesBalanceState(
  statement: BillingStatement,
  balanceState:
    BillingBalanceState
): boolean {
  if (balanceState === "all") {
    return true
  }

  if (balanceState === "open") {
    return (
      statement.balanceDueCentavos >
      0
    )
  }

  if (balanceState === "credit") {
    return (
      statement.creditBalanceCentavos >
      0
    )
  }

  return (
    statement.balanceDueCentavos ===
      0 &&
    statement.creditBalanceCentavos ===
      0 &&
    statement.status !== "draft" &&
    statement.status !== "voided"
  )
}

function findPatient(
  patients:
    readonly Patient[],
  patientId: string
): Patient | null {
  return (
    patients.find(
      (patient) =>
        patient.id === patientId
    ) ?? null
  )
}

function matchesStatementSearch(
  statement: BillingStatement,
  patient: Patient | null,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  return normalizePatientSearch(
    statement.statementNumber,
    statement.branchName,
    statement.notes,
    statement.issuedBy,
    statement.updatedBy,
    patient
      ? getPatientFullName(
          patient
        )
      : null,
    patient?.medicalRecordNumber
  ).includes(normalizedSearch)
}

function isStatementStatusFilter(
  value: string
): value is
  | BillingStatementStatus
  | "all" {
  return (
    value === "all" ||
    BILLING_STATEMENT_STATUSES.some(
      (status) =>
        status === value
    )
  )
}

function isBalanceState(
  value: string
): value is BillingBalanceState {
  return BILLING_BALANCE_STATES.some(
    (state) =>
      state === value
  )
}

function isDateView(
  value: string
): value is BillingDateView {
  return BILLING_DATE_VIEWS.some(
    (dateView) =>
      dateView === value
  )
}

function getReversalConfiguration(
  target:
    BillingReversalTarget | null
): BillingReversalConfiguration {
  if (!target) {
    return {
      title: "Billing reversal",
      description:
        "Reverse the selected synthetic billing record.",
      actionLabel: "Reverse record",
      reference: "",
    }
  }

  switch (target.kind) {
    case "adjustment":
      return {
        title:
          "Reverse billing adjustment",
        description:
          "Reverse the selected posted adjustment. The record will remain in history.",
        actionLabel:
          "Reverse adjustment",
        reference:
          target.reference,
      }

    case "coverage":
      return {
        title:
          "Reverse coverage allocation",
        description:
          "Reverse the selected insurance, company, or charity allocation.",
        actionLabel:
          "Reverse coverage",
        reference:
          target.reference,
      }

    case "payment":
      return {
        title:
          "Reverse billing payment",
        description:
          "Reverse the selected payment and recalculate the statement balance.",
        actionLabel:
          "Reverse payment",
        reference:
          target.reference,
      }

    case "refund":
      return {
        title:
          "Reverse billing refund",
        description:
          "Reverse the selected refund and recalculate the statement balance.",
        actionLabel:
          "Reverse refund",
        reference:
          target.reference,
      }

    case "statement":
      return {
        title:
          "Void billing statement",
        description:
          "Void the selected billing statement. Active payments and refunds must be reversed first.",
        actionLabel:
          "Void statement",
        reference:
          target.reference,
      }
  }
}

export function BillingDashboardWorkspace() {
  const router = useRouter()

  const { patients } =
    usePatients()

  const {
    charges,
    statements,
    adjustments,
    coverageAllocations,
    payments,
    refunds,
    createBillingCharge,
    createBillingStatement,
    issueBillingStatement,
    addBillingAdjustment,
    addBillingCoverage,
    recordBillingPayment,
    recordBillingRefund,
    reverseBillingAdjustment,
    reverseBillingCoverage,
    reverseBillingPayment,
    reverseBillingRefund,
    voidBillingStatement,
  } = useBilling()

  const [
    filters,
    setFilters,
  ] =
    useState<BillingStatementFilters>(
      () => ({
        ...DEFAULT_BILLING_STATEMENT_FILTERS,
      })
    )

  const [
    isChargeDialogOpen,
    setIsChargeDialogOpen,
  ] = useState(false)

  const [
    isStatementDialogOpen,
    setIsStatementDialogOpen,
  ] = useState(false)

  const [
    viewingStatementId,
    setViewingStatementId,
  ] = useState<string | null>(
    null
  )

  const [
    issuingStatementId,
    setIssuingStatementId,
  ] = useState<string | null>(
    null
  )

  const [
    adjustmentStatementId,
    setAdjustmentStatementId,
  ] = useState<string | null>(
    null
  )

  const [
    coverageStatementId,
    setCoverageStatementId,
  ] = useState<string | null>(
    null
  )

  const [
    paymentStatementId,
    setPaymentStatementId,
  ] = useState<string | null>(
    null
  )

  const [
    refundStatementId,
    setRefundStatementId,
  ] = useState<string | null>(
    null
  )

  const [
    reversalTarget,
    setReversalTarget,
  ] =
    useState<BillingReversalTarget | null>(
      null
    )

  const [
    receiptPaymentId,
    setReceiptPaymentId,
  ] = useState<string | null>(
    null
  )

  const filteredStatements =
    useMemo(
      () =>
        statements
          .filter((statement) => {
            const patient =
              findPatient(
                patients,
                statement.patientId
              )

            return (
              matchesStatementSearch(
                statement,
                patient,
                filters.search
              ) &&
              (
                filters.status ===
                  "all" ||
                statement.status ===
                  filters.status
              ) &&
              (
                filters.branchId ===
                  "all" ||
                statement.branchId ===
                  filters.branchId
              ) &&
              matchesBalanceState(
                statement,
                filters.balanceState
              ) &&
              matchesDateView(
                statement,
                filters.dateView,
                filters.selectedDate
              )
            )
          })
          .sort(
            (
              firstStatement,
              secondStatement
            ) =>
              (
                secondStatement.balanceDueCentavos -
                firstStatement.balanceDueCentavos
              ) ||
              (
                new Date(
                  secondStatement.issuedAt ??
                    secondStatement.createdAt
                ).getTime() -
                new Date(
                  firstStatement.issuedAt ??
                    firstStatement.createdAt
                ).getTime()
              )
          ),
      [
        filters,
        patients,
        statements,
      ]
    )

  const selectedDateStatements =
    statements.filter(
      (statement) =>
        getLocalDateKey(
          statement.issuedAt ??
            statement.createdAt
        ) === filters.selectedDate
    )

  const draftCount =
    selectedDateStatements.filter(
      (statement) =>
        statement.status === "draft"
    ).length

  const openBalanceTotal =
    selectedDateStatements.reduce(
      (
        total,
        statement
      ) =>
        total +
        statement.balanceDueCentavos,
      0
    )

  const selectedDatePaymentTotal =
    payments
      .filter(
        (payment) =>
          payment.status ===
            "posted" &&
          getLocalDateKey(
            payment.postedAt
          ) === filters.selectedDate
      )
      .reduce(
        (
          total,
          payment
        ) =>
          total +
          payment.amountCentavos,
        0
      )

  const creditBalanceTotal =
    selectedDateStatements.reduce(
      (
        total,
        statement
      ) =>
        total +
        statement.creditBalanceCentavos,
      0
    )

  const assignedChargeIds =
    new Set(
      statements
        .filter(
          (statement) =>
            statement.status !==
            "voided"
        )
        .flatMap(
          (statement) =>
            statement.chargeIds
        )
    )

  const unassignedPostedChargeCount =
    charges.filter(
      (charge) =>
        charge.status ===
          "posted" &&
        !assignedChargeIds.has(
          charge.id
        )
    ).length

  const viewingStatement =
    statements.find(
      (statement) =>
        statement.id ===
        viewingStatementId
    ) ?? null

  const issuingStatement =
    statements.find(
      (statement) =>
        statement.id ===
        issuingStatementId
    ) ?? null

  const adjustmentStatement =
    statements.find(
      (statement) =>
        statement.id ===
        adjustmentStatementId
    ) ?? null

  const coverageStatement =
    statements.find(
      (statement) =>
        statement.id ===
        coverageStatementId
    ) ?? null

  const paymentStatement =
    statements.find(
      (statement) =>
        statement.id ===
        paymentStatementId
    ) ?? null

  const refundStatement =
    statements.find(
      (statement) =>
        statement.id ===
        refundStatementId
    ) ?? null

  const viewingPatient =
    viewingStatement
      ? findPatient(
          patients,
          viewingStatement.patientId
        )
      : null

  const receiptPayment =
    payments.find(
      (payment) =>
        payment.id ===
        receiptPaymentId
    ) ?? null

  const receiptStatement =
    receiptPayment
      ? statements.find(
          (statement) =>
            statement.id ===
            receiptPayment.statementId
        ) ?? null
      : null

  const receiptPatient =
    receiptPayment
      ? findPatient(
          patients,
          receiptPayment.patientId
        )
      : null

  const reversalConfiguration =
    getReversalConfiguration(
      reversalTarget
    )

  const hasActiveFilters =
    filters.search.trim().length >
      0 ||
    filters.status !== "all" ||
    filters.branchId !== "all" ||
    filters.balanceState !==
      "all" ||
    filters.dateView !== "day" ||
    filters.selectedDate !==
      "2026-08-04"

  function updateFilter<
    Key extends keyof BillingStatementFilters,
  >(
    key: Key,
    value:
      BillingStatementFilters[Key]
  ) {
    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        [key]: value,
      })
    )
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_BILLING_STATEMENT_FILTERS,
    })
  }

  async function handleCreateCharge(
    values:
      BillingChargeFormValues
  ) {
    const newCharge =
      createBillingCharge(values)

    toast.success(
      "Patient charge posted",
      {
        description: `${newCharge.chargeNumber} was posted for ${formatBillingAmount(
          newCharge.grossAmountCentavos
        )}.`,
      }
    )
  }

  async function handleCreateStatement(
    values:
      BillingStatementFormValues
  ) {
    const newStatement =
      createBillingStatement(
        values
      )

    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        search: "",
        status: "all",
        dateView: "all",
      })
    )

    setViewingStatementId(
      newStatement.id
    )

    toast.success(
      "Draft statement created",
      {
        description: `${newStatement.statementNumber} was created successfully.`,
      }
    )
  }

  async function handleIssueStatement(
    values:
      BillingStatementIssueValues
  ) {
    if (!issuingStatement) {
      throw new Error(
        "No billing statement was selected."
      )
    }

    const updatedStatement =
      issueBillingStatement(
        issuingStatement.id,
        values
      )

    toast.success(
      "Billing statement issued",
      {
        description: `${updatedStatement.statementNumber} can now receive payments.`,
      }
    )
  }

  async function handleAddAdjustment(
    values:
      BillingAdjustmentFormValues
  ) {
    if (!adjustmentStatement) {
      throw new Error(
        "No billing statement was selected."
      )
    }

    const updatedStatement =
      addBillingAdjustment(
        adjustmentStatement.id,
        values
      )

    toast.success(
      "Billing adjustment posted",
      {
        description: `${updatedStatement.statementNumber} totals were recalculated.`,
      }
    )
  }

  async function handleAddCoverage(
    values:
      BillingCoverageFormValues
  ) {
    if (!coverageStatement) {
      throw new Error(
        "No billing statement was selected."
      )
    }

    const updatedStatement =
      addBillingCoverage(
        coverageStatement.id,
        values
      )

    toast.success(
      "Coverage allocation posted",
      {
        description: `${updatedStatement.statementNumber} patient responsibility was recalculated.`,
      }
    )
  }

  async function handleRecordPayment(
    values:
      BillingPaymentFormValues
  ) {
    if (!paymentStatement) {
      throw new Error(
        "No billing statement was selected."
      )
    }

    const result =
      recordBillingPayment(
        paymentStatement.id,
        values
      )

    setPaymentStatementId(null)

    setReceiptPaymentId(
      result.payment.id
    )

    toast.success(
      "Billing payment recorded",
      {
        description: `${result.payment.officialReceiptNumber} was generated for ${formatBillingAmount(
          result.payment.amountCentavos
        )}.`,
      }
    )
  }

  async function handleRecordRefund(
    values:
      BillingRefundFormValues
  ) {
    if (!refundStatement) {
      throw new Error(
        "No billing statement was selected."
      )
    }

    const result =
      recordBillingRefund(
        refundStatement.id,
        values
      )

    toast.success(
      "Billing refund recorded",
      {
        description: `${result.refund.refundNumber} was posted for ${formatBillingAmount(
          result.refund.amountCentavos
        )}.`,
      }
    )
  }

  async function handleSubmitReversal(
    values:
      BillingReversalValues
  ) {
    if (!reversalTarget) {
      throw new Error(
        "No billing record was selected."
      )
    }

    let updatedStatement:
      BillingStatement

    switch (reversalTarget.kind) {
      case "adjustment":
        updatedStatement =
          reverseBillingAdjustment(
            reversalTarget.id,
            values
          )
        break

      case "coverage":
        updatedStatement =
          reverseBillingCoverage(
            reversalTarget.id,
            values
          )
        break

      case "payment":
        updatedStatement =
          reverseBillingPayment(
            reversalTarget.id,
            values
          )
        break

      case "refund":
        updatedStatement =
          reverseBillingRefund(
            reversalTarget.id,
            values
          )
        break

      case "statement":
        updatedStatement =
          voidBillingStatement(
            reversalTarget.id,
            values
          )
        break
    }

    setReversalTarget(null)

    toast.success(
      reversalTarget.kind ===
        "statement"
        ? "Billing statement voided"
        : "Billing record reversed",
      {
        description: `${updatedStatement.statementNumber} totals and status were updated.`,
      }
    )
  }

  function openStatementAction(
    statement: BillingStatement,
    setter: (
      statementId: string
    ) => void
  ) {
    setViewingStatementId(null)

    setter(statement.id)
  }

  function openPatientProfile(
    patient: Patient
  ) {
    setViewingStatementId(null)

    router.push(
      `/patients/${encodeURIComponent(
        patient.medicalRecordNumber
      )}`
    )
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
              <CreditCard
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Patient account and
                financial operations
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Billing Management
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage charges, statements,
                coverage, payments,
                receipts, refunds, and
                reversals.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setIsChargeDialogOpen(
                  true
                )
              }
            >
              <Plus aria-hidden="true" />
              Post charge
            </Button>

            <Button
              type="button"
              className="bg-sky-700 text-white hover:bg-sky-800"
              onClick={() =>
                setIsStatementDialogOpen(
                  true
                )
              }
            >
              <FilePlus2
                aria-hidden="true"
              />
              Create statement
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <FileText
                className="size-4 text-slate-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Draft statements
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {draftCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <WalletCards
                className="size-4 text-amber-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-amber-700">
                  Open balances
                </p>

                <p className="mt-1 text-lg font-semibold text-amber-800">
                  {formatBillingAmount(
                    openBalanceTotal
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <ReceiptText
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-emerald-700">
                  Payments posted
                </p>

                <p className="mt-1 text-lg font-semibold text-emerald-800">
                  {formatBillingAmount(
                    selectedDatePaymentTotal
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <RotateCcw
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-violet-700">
                  Credit balances
                </p>

                <p className="mt-1 text-lg font-semibold text-violet-800">
                  {formatBillingAmount(
                    creditBalanceTotal
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-900">
              Unassigned posted charges
            </p>

            <p className="mt-1 text-xs text-sky-700">
              Posted charges not yet included
              in an active billing statement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-sky-900">
              {
                unassignedPostedChargeCount
              }
            </span>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setIsStatementDialogOpen(
                  true
                )
              }
            >
              Create statement
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="space-y-4 border-b p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1 xl:max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  value={filters.search}
                  placeholder="Search patient, MRN, statement, branch, or staff"
                  className="pl-8"
                  onChange={(event) =>
                    updateFilter(
                      "search",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Input
                  type="date"
                  value={
                    filters.selectedDate
                  }
                  className="w-auto"
                  onChange={(event) =>
                    updateFilter(
                      "selectedDate",
                      event.target.value
                    )
                  }
                />

                <select
                  value={filters.dateView}
                  className={selectClassName}
                  onChange={(event) => {
                    const nextValue =
                      event.target.value

                    if (
                      isDateView(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "dateView",
                        nextValue
                      )
                    }
                  }}
                >
                  {BILLING_DATE_VIEWS.map(
                    (dateView) => (
                      <option
                        key={dateView}
                        value={dateView}
                      >
                        {
                          BILLING_DATE_VIEW_LABELS[
                            dateView
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.status}
                  className={selectClassName}
                  onChange={(event) => {
                    const nextValue =
                      event.target.value

                    if (
                      isStatementStatusFilter(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "status",
                        nextValue
                      )
                    }
                  }}
                >
                  <option value="all">
                    All statuses
                  </option>

                  {BILLING_STATEMENT_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          BILLING_STATEMENT_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    filters.balanceState
                  }
                  className={selectClassName}
                  onChange={(event) => {
                    const nextValue =
                      event.target.value

                    if (
                      isBalanceState(
                        nextValue
                      )
                    ) {
                      updateFilter(
                        "balanceState",
                        nextValue
                      )
                    }
                  }}
                >
                  {BILLING_BALANCE_STATES.map(
                    (balanceState) => (
                      <option
                        key={balanceState}
                        value={balanceState}
                      >
                        {
                          BILLING_BALANCE_STATE_LABELS[
                            balanceState
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.branchId}
                  className={selectClassName}
                  onChange={(event) =>
                    updateFilter(
                      "branchId",
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All branches
                  </option>

                  {GALENMED_BRANCHES.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
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
            </div>

            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {filteredStatements.length}
              {" of "}
              {statements.length} billing
              statements
            </p>
          </div>

          {filteredStatements.length ===
          0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <FileText
                className="size-8 text-sky-700"
                aria-hidden="true"
              />

              <h2 className="mt-4 font-semibold">
                No matching billing
                statements
              </h2>

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
            <Table className="min-w-[1450px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Statement
                  </TableHead>

                  <TableHead>
                    Patient
                  </TableHead>

                  <TableHead>
                    Charge sources
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
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStatements.map(
                  (statement) => {
                    const patient =
                      findPatient(
                        patients,
                        statement.patientId
                      )

                    const statementCharges =
                      charges.filter(
                        (charge) =>
                          statement.chargeIds.includes(
                            charge.id
                          )
                      )

                    const chargeSources =
                      Array.from(
                        new Set(
                          statementCharges.map(
                            (charge) =>
                              charge.source
                          )
                        )
                      )

                    return (
                      <TableRow
                        key={statement.id}
                      >
                        <TableCell>
                          <p className="font-mono text-xs font-medium">
                            {
                              statement.statementNumber
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {statement.issuedAt
                              ? `Issued ${formatPatientDateTime(
                                  statement.issuedAt
                                )}`
                              : `Created ${formatPatientDateTime(
                                  statement.createdAt
                                )}`}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-56 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700">
                              {patient
                                ? getPatientInitials(
                                    patient
                                  )
                                : "PT"}
                            </div>

                            <div>
                              <p className="font-medium">
                                {patient
                                  ? getPatientFullName(
                                      patient
                                    )
                                  : "Patient unavailable"}
                              </p>

                              <p className="font-mono text-xs text-muted-foreground">
                                {patient
                                  ?.medicalRecordNumber ??
                                  "MRN unavailable"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex max-w-xs flex-wrap gap-2">
                            {chargeSources.map(
                              (source) => (
                                <BillingChargeSourceBadge
                                  key={source}
                                  source={source}
                                />
                              )
                            )}
                          </div>

                          <p className="mt-2 text-xs text-muted-foreground">
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
                          <p className="text-sm">
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
                          <div className="flex min-w-48 flex-wrap gap-2">
                            {statement.status ===
                            "draft" ? (
                              <Button
                                type="button"
                                size="sm"
                                className="bg-sky-700 text-white hover:bg-sky-800"
                                onClick={() =>
                                  setIssuingStatementId(
                                    statement.id
                                  )
                                }
                              >
                                <FileCheck2
                                  aria-hidden="true"
                                />
                                Issue
                              </Button>
                            ) : statement.balanceDueCentavos >
                                0 &&
                              statement.status !==
                                "voided" ? (
                              <Button
                                type="button"
                                size="sm"
                                className="bg-emerald-700 text-white hover:bg-emerald-800"
                                onClick={() =>
                                  setPaymentStatementId(
                                    statement.id
                                  )
                                }
                              >
                                <CreditCard
                                  aria-hidden="true"
                                />
                                Payment
                              </Button>
                            ) : null}

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setViewingStatementId(
                                  statement.id
                                )
                              }
                            >
                              <Eye
                                aria-hidden="true"
                              />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <BillingChargeFormDialog
        open={isChargeDialogOpen}
        onOpenChange={
          setIsChargeDialogOpen
        }
        onSubmitCharge={
          handleCreateCharge
        }
      />

      <BillingStatementFormDialog
        open={isStatementDialogOpen}
        onOpenChange={
          setIsStatementDialogOpen
        }
        onSubmitStatement={
          handleCreateStatement
        }
      />

      <BillingStatementIssueDialog
        statement={issuingStatement}
        open={Boolean(
          issuingStatement
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIssuingStatementId(
              null
            )
          }
        }}
        onSubmitIssue={
          handleIssueStatement
        }
      />

      <BillingAdjustmentDialog
        statement={
          adjustmentStatement
        }
        open={Boolean(
          adjustmentStatement
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setAdjustmentStatementId(
              null
            )
          }
        }}
        onSubmitAdjustment={
          handleAddAdjustment
        }
      />

      <BillingCoverageDialog
        statement={
          coverageStatement
        }
        open={Boolean(
          coverageStatement
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCoverageStatementId(
              null
            )
          }
        }}
        onSubmitCoverage={
          handleAddCoverage
        }
      />

      <BillingPaymentDialog
        statement={
          paymentStatement
        }
        open={Boolean(
          paymentStatement
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPaymentStatementId(
              null
            )
          }
        }}
        onSubmitPayment={
          handleRecordPayment
        }
      />

      <BillingRefundDialog
        statement={
          refundStatement
        }
        payments={payments}
        refunds={refunds}
        open={Boolean(
          refundStatement
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRefundStatementId(
              null
            )
          }
        }}
        onSubmitRefund={
          handleRecordRefund
        }
      />

      <BillingStatementDetailsSheet
        statement={
          viewingStatement
        }
        patient={viewingPatient}
        charges={charges}
        adjustments={adjustments}
        coverageAllocations={
          coverageAllocations
        }
        payments={payments}
        refunds={refunds}
        open={Boolean(
          viewingStatement &&
            viewingPatient
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingStatementId(
              null
            )
          }
        }}
        onIssueStatement={(
          statement
        ) =>
          openStatementAction(
            statement,
            setIssuingStatementId
          )
        }
        onAddAdjustment={(
          statement
        ) =>
          openStatementAction(
            statement,
            setAdjustmentStatementId
          )
        }
        onAddCoverage={(
          statement
        ) =>
          openStatementAction(
            statement,
            setCoverageStatementId
          )
        }
        onRecordPayment={(
          statement
        ) =>
          openStatementAction(
            statement,
            setPaymentStatementId
          )
        }
        onRecordRefund={(
          statement
        ) =>
          openStatementAction(
            statement,
            setRefundStatementId
          )
        }
        onReverseAdjustment={(
          adjustment:
            BillingAdjustment
        ) => {
          setViewingStatementId(
            null
          )

          setReversalTarget({
            kind: "adjustment",
            id: adjustment.id,
            reference:
              adjustment.description,
          })
        }}
        onReverseCoverage={(
          coverage:
            BillingCoverageAllocation
        ) => {
          setViewingStatementId(
            null
          )

          setReversalTarget({
            kind: "coverage",
            id: coverage.id,
            reference:
              coverage.payerName,
          })
        }}
        onReversePayment={(
          payment:
            BillingPayment
        ) => {
          setViewingStatementId(
            null
          )

          setReversalTarget({
            kind: "payment",
            id: payment.id,
            reference:
              payment.officialReceiptNumber,
          })
        }}
        onReverseRefund={(
          refund:
            BillingRefund
        ) => {
          setViewingStatementId(
            null
          )

          setReversalTarget({
            kind: "refund",
            id: refund.id,
            reference:
              refund.refundNumber,
          })
        }}
        onVoidStatement={(
          statement
        ) => {
          setViewingStatementId(
            null
          )

          setReversalTarget({
            kind: "statement",
            id: statement.id,
            reference:
              statement.statementNumber,
          })
        }}
        onViewReceipt={(
          payment
        ) => {
          setViewingStatementId(
            null
          )

          setReceiptPaymentId(
            payment.id
          )
        }}
        onOpenPatientProfile={
          openPatientProfile
        }
      />

      <BillingReversalDialog
        title={
          reversalConfiguration.title
        }
        description={
          reversalConfiguration.description
        }
        reference={
          reversalTarget
            ? reversalConfiguration.reference
            : null
        }
        actionLabel={
          reversalConfiguration.actionLabel
        }
        open={Boolean(
          reversalTarget
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setReversalTarget(null)
          }
        }}
        onSubmitReversal={
          handleSubmitReversal
        }
      />

      <BillingOfficialReceiptDialog
        payment={receiptPayment}
        statement={receiptStatement}
        patient={receiptPatient}
        open={Boolean(
          receiptPayment &&
            receiptStatement &&
            receiptPatient
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setReceiptPaymentId(null)
          }
        }}
      />
    </>
  )
}
