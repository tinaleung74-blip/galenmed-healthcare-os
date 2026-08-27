import type {
  CashierBillingAccount,
  CashierBillingAccountStatus,
  CashierPaymentClearanceStatus,
  CashierPaymentMethod,
  CashierPaymentTransactionStatus,
  CashierReceiptPrintType,
} from "@/features/hospital-operations/types/cashier-billing.types"

export const CASHIER_BILLING_STATUS_LABELS: Record<
  CashierBillingAccountStatus,
  string
> = {
  open: "Pending",
  partially_paid: "Partially Paid",
  paid: "Paid",
  waived: "Waived",
  refunded: "Refunded",
  voided: "Voided",
}

export const CASHIER_PAYMENT_METHOD_LABELS: Record<
  CashierPaymentMethod,
  string
> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  e_wallet: "E-Wallet",
  insurance: "Insurance",
  philhealth: "PhilHealth",
  other: "Other",
}

export const CASHIER_PAYMENT_STATUS_LABELS: Record<
  CashierPaymentTransactionStatus,
  string
> = {
  posted: "Posted",
  voided: "Voided",
  refunded: "Refunded",
}

export const CASHIER_CLEARANCE_STATUS_LABELS: Record<
  CashierPaymentClearanceStatus,
  string
> = {
  pending: "Payment Pending",
  partially_cleared:
    "Partially Cleared",
  cleared: "Cleared",
  waived: "Waived",
  blocked: "Blocked",
  revoked: "Revoked",
}

export const CASHIER_RECEIPT_PRINT_TYPE_LABELS: Record<
  CashierReceiptPrintType,
  string
> = {
  original: "Original",
  reprint: "Reprint",
}

const phpCurrencyFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )

const cashierDateTimeFormatter =
  new Intl.DateTimeFormat(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  )

export function formatCashierAmount(
  centavos: number
): string {
  return phpCurrencyFormatter.format(
    centavos / 100
  )
}

export function formatCentavosAsPhpInput(
  centavos: number
): string {
  return (centavos / 100).toFixed(2)
}

export function parsePhpToCentavos(
  value: string
): number {
  const normalizedValue =
    value.trim()

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalizedValue
    )
  ) {
    throw new Error(
      "Enter a valid PHP amount with no more than two decimal places."
    )
  }

  const [
    wholePart,
    decimalPart = "",
  ] = normalizedValue.split(".")

  const centavos =
    Number(wholePart) * 100 +
    Number(
      decimalPart.padEnd(2, "0")
    )

  if (
    !Number.isSafeInteger(
      centavos
    ) ||
    centavos < 0
  ) {
    throw new Error(
      "The PHP amount is outside the supported range."
    )
  }

  return centavos
}

export function formatCashierDateTime(
  value: string | null,
  fallback = "Not recorded"
): string {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return cashierDateTimeFormatter.format(
    date
  )
}

export function getCashierPatientFullName(
  account: CashierBillingAccount
): string {
  const patient = account.patient

  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(
      (
        value
      ): value is string =>
        typeof value === "string" &&
        value.trim().length > 0
    )
    .join(" ")
}

export function normalizeCashierSearch(
  ...values: Array<
    string | null | undefined
  >
): string {
  return values
    .filter(
      (
        value
      ): value is string =>
        typeof value === "string"
    )
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-PH")
}

export function createCashierIdempotencyKey(
  prefix: string
): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in
      globalThis.crypto
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}
