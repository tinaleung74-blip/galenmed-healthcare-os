export const CASHIER_BILLING_ACCOUNT_STATUSES = [
  "open",
  "partially_paid",
  "paid",
  "waived",
  "refunded",
  "voided",
] as const

export type CashierBillingAccountStatus =
  (typeof CASHIER_BILLING_ACCOUNT_STATUSES)[number]

export const CASHIER_PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "e_wallet",
  "insurance",
  "philhealth",
  "other",
] as const

export type CashierPaymentMethod =
  (typeof CASHIER_PAYMENT_METHODS)[number]

export const CASHIER_PAYMENT_TRANSACTION_STATUSES = [
  "posted",
  "voided",
  "refunded",
] as const

export type CashierPaymentTransactionStatus =
  (typeof CASHIER_PAYMENT_TRANSACTION_STATUSES)[number]

export const CASHIER_PAYMENT_CLEARANCE_STATUSES = [
  "pending",
  "partially_cleared",
  "cleared",
  "waived",
  "blocked",
  "revoked",
] as const

export type CashierPaymentClearanceStatus =
  (typeof CASHIER_PAYMENT_CLEARANCE_STATUSES)[number]

export const CASHIER_RECEIPT_PRINT_TYPES = [
  "original",
  "reprint",
] as const

export type CashierReceiptPrintType =
  (typeof CASHIER_RECEIPT_PRINT_TYPES)[number]

export interface CashierPatientSummary {
  id: string
  medicalRecordNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex: string
  mobileNumber: string | null
  emailAddress: string | null
}

export interface CashierVisitSummary {
  id: string
  visitNumber: string
  arrivalMode: string
  initialServiceType: string
  status: string
  registeredAt: string
  checkedInAt: string | null
}

export interface CashierChargeItem {
  id: string
  serviceRequestId: string | null
  sourceModule: string
  sourceRecordId: string | null
  description: string
  quantity: number
  unitAmountCentavos: number
  totalAmountCentavos: number
  status: string
  postedAt: string
}

export interface CashierPaymentTransaction {
  id: string
  paymentNumber: string
  amountCentavos: number
  paymentMethod: CashierPaymentMethod
  status: CashierPaymentTransactionStatus
  externalReference: string | null
  officialReceiptNumber: string | null
  postedAt: string
}

export interface CashierPaymentClearance {
  id: string
  serviceRequestId: string
  requestNumber: string
  serviceType: string
  serviceName: string
  requestStatus: string
  clearanceStatus:
    CashierPaymentClearanceStatus
  requiredAmountCentavos: number
  clearedAmountCentavos: number
  clearanceReason: string | null
  clearedAt: string | null
  releaseReadyCount: number
  releasePendingCount: number
  releaseReleasedCount: number
}

export interface CashierBillingAccount {
  id: string
  billingNumber: string
  branchId: string
  branchName: string
  currencyCode: string
  status: CashierBillingAccountStatus
  grossAmountCentavos: number
  discountAmountCentavos: number
  coverageAmountCentavos: number
  paidAmountCentavos: number
  refundedAmountCentavos: number
  balanceAmountCentavos: number
  createdAt: string
  updatedAt: string
  patient: CashierPatientSummary
  visit: CashierVisitSummary
  chargeItems: CashierChargeItem[]
  paymentTransactions:
    CashierPaymentTransaction[]
  paymentClearances:
    CashierPaymentClearance[]
}

export interface CashierBillingPageData {
  accounts: CashierBillingAccount[]
}

export interface CashierPaymentMutationResponse {
  paymentId: string
  paymentNumber: string
  officialReceiptNumber: string
  amountCentavos: number
  status: string
  idempotentReplay: boolean
}

export interface CashierClearanceMutationResponse {
  paymentClearanceId: string
  serviceRequestId: string
  clearanceStatus:
    CashierPaymentClearanceStatus
  requiredAmountCentavos: number
  clearedAmountCentavos: number
  clearedAt: string | null
}

export interface CashierReceiptPrintLog {
  id: number
  printType: CashierReceiptPrintType
  copyNumber: number
  printReason: string | null
  printedAt: string
}

export interface CashierReceiptPrintResponse {
  printLogId: number
  paymentTransactionId: string
  officialReceiptNumber: string
  printType: CashierReceiptPrintType
  copyNumber: number
  printedAt: string
  idempotentReplay: boolean
}

export interface CashierReceiptPageData {
  payment: CashierPaymentTransaction
  account: CashierBillingAccount
  printLogs: CashierReceiptPrintLog[]
}

export interface CashierActionResult<
  Data = undefined,
> {
  success: boolean
  message: string
  data?: Data
}
