export const BILLING_CHARGE_SOURCES = [
  "appointment",
  "consultation",
  "laboratory",
  "radiology",
  "pharmacy",
  "manual",
] as const

export type BillingChargeSource =
  (typeof BILLING_CHARGE_SOURCES)[number]

export const BILLING_CHARGE_STATUSES = [
  "draft",
  "posted",
  "voided",
] as const

export type BillingChargeStatus =
  (typeof BILLING_CHARGE_STATUSES)[number]

export const BILLING_STATEMENT_STATUSES = [
  "draft",
  "issued",
  "partially-paid",
  "paid",
  "voided",
  "refunded",
] as const

export type BillingStatementStatus =
  (typeof BILLING_STATEMENT_STATUSES)[number]

export const BILLING_ADJUSTMENT_TYPES = [
  "discount",
  "write-off",
  "correction",
  "reversal",
] as const

export type BillingAdjustmentType =
  (typeof BILLING_ADJUSTMENT_TYPES)[number]

export const BILLING_ADJUSTMENT_STATUSES = [
  "posted",
  "reversed",
] as const

export type BillingAdjustmentStatus =
  (typeof BILLING_ADJUSTMENT_STATUSES)[number]

export const BILLING_COVERAGE_TYPES = [
  "insurance",
  "company-account",
  "charity",
] as const

export type BillingCoverageType =
  (typeof BILLING_COVERAGE_TYPES)[number]

export const BILLING_COVERAGE_STATUSES = [
  "active",
  "reversed",
] as const

export type BillingCoverageStatus =
  (typeof BILLING_COVERAGE_STATUSES)[number]

export const BILLING_PAYMENT_METHODS = [
  "cash",
  "card",
  "bank-transfer",
  "e-wallet",
  "check",
  "other",
] as const

export type BillingPaymentMethod =
  (typeof BILLING_PAYMENT_METHODS)[number]

export const BILLING_PAYMENT_STATUSES = [
  "posted",
  "reversed",
] as const

export type BillingPaymentStatus =
  (typeof BILLING_PAYMENT_STATUSES)[number]

export const BILLING_REFUND_STATUSES = [
  "posted",
  "reversed",
] as const

export type BillingRefundStatus =
  (typeof BILLING_REFUND_STATUSES)[number]

export const BILLING_DATE_VIEWS = [
  "day",
  "last-7-days",
  "all",
] as const

export type BillingDateView =
  (typeof BILLING_DATE_VIEWS)[number]

export const BILLING_BALANCE_STATES = [
  "all",
  "open",
  "paid",
  "credit",
] as const

export type BillingBalanceState =
  (typeof BILLING_BALANCE_STATES)[number]

export interface BillingChargeCatalogItem {
  code: string
  description: string

  source: BillingChargeSource

  defaultUnitAmountCentavos:
    number | null

  allowCustomUnitAmount: boolean

  taxable: boolean
  active: boolean
}

export interface BillingCharge {
  id: string
  chargeNumber: string

  patientId: string

  branchId: string
  branchName: string

  source: BillingChargeSource

  sourceRecordId: string | null
  sourceReference: string | null

  catalogCode: string

  description: string

  quantity: number

  unitAmountCentavos: number
  grossAmountCentavos: number

  taxable: boolean

  notes: string | null

  status: BillingChargeStatus

  postedAt: string | null
  postedBy: string | null

  voidedAt: string | null
  voidedBy: string | null
  voidReason: string | null

  createdAt: string
  updatedAt: string
  updatedBy: string
}

/**
 * Adjustment amount is signed:
 *
 * Negative amount:
 * Reduces the statement balance.
 *
 * Positive amount:
 * Increases the statement balance.
 */
export interface BillingAdjustment {
  id: string

  statementId: string

  type: BillingAdjustmentType

  description: string

  amountCentavos: number

  status: BillingAdjustmentStatus

  postedAt: string
  postedBy: string

  reversedAt: string | null
  reversedBy: string | null
  reversalReason: string | null
}

export interface BillingCoverageAllocation {
  id: string

  statementId: string

  type: BillingCoverageType

  payerName: string

  amountCentavos: number

  referenceNumber: string | null

  notes: string | null

  status: BillingCoverageStatus

  allocatedAt: string
  allocatedBy: string

  reversedAt: string | null
  reversedBy: string | null
  reversalReason: string | null
}

export interface BillingPayment {
  id: string

  paymentNumber: string
  officialReceiptNumber: string

  statementId: string
  patientId: string

  method: BillingPaymentMethod

  amountCentavos: number

  externalReference: string | null
  notes: string | null

  status: BillingPaymentStatus

  postedAt: string
  postedBy: string

  reversedAt: string | null
  reversedBy: string | null
  reversalReason: string | null
}

export interface BillingRefund {
  id: string
  refundNumber: string

  statementId: string
  patientId: string

  paymentId: string | null

  amountCentavos: number

  reason: string

  status: BillingRefundStatus

  postedAt: string
  postedBy: string

  reversedAt: string | null
  reversedBy: string | null
  reversalReason: string | null
}

export interface BillingStatement {
  id: string
  statementNumber: string

  patientId: string

  branchId: string
  branchName: string

  chargeIds: string[]
  adjustmentIds: string[]

  coverageAllocationIds: string[]

  paymentIds: string[]
  refundIds: string[]

  status: BillingStatementStatus

  grossAmountCentavos: number
  adjustmentAmountCentavos: number

  netChargeAmountCentavos: number

  coverageAmountCentavos: number

  patientResponsibilityCentavos:
    number

  amountPaidCentavos: number
  refundAmountCentavos: number

  balanceDueCentavos: number
  creditBalanceCentavos: number

  notes: string | null

  issuedAt: string | null
  issuedBy: string | null

  closedAt: string | null
  closedBy: string | null

  voidedAt: string | null
  voidedBy: string | null
  voidReason: string | null

  createdAt: string
  updatedAt: string
  updatedBy: string
}

export interface BillingStatementFilters {
  search: string

  status:
    | BillingStatementStatus
    | "all"

  branchId: string | "all"

  balanceState:
    BillingBalanceState

  dateView: BillingDateView

  selectedDate: string
}
