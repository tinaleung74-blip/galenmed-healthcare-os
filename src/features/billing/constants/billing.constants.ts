import type {
  BillingAdjustmentType,
  BillingBalanceState,
  BillingChargeCatalogItem,
  BillingChargeSource,
  BillingChargeStatus,
  BillingCoverageType,
  BillingDateView,
  BillingPaymentMethod,
  BillingStatementFilters,
  BillingStatementStatus,
} from "@/features/billing/types/billing.types"

export const BILLING_CHARGE_SOURCE_LABELS: Record<
  BillingChargeSource,
  string
> = {
  appointment:
    "Appointment",

  consultation:
    "Consultation",

  laboratory:
    "Laboratory",

  radiology:
    "Radiology",

  pharmacy:
    "Pharmacy",

  manual:
    "Manual Charge",
}

export const BILLING_CHARGE_STATUS_LABELS: Record<
  BillingChargeStatus,
  string
> = {
  draft: "Draft",
  posted: "Posted",
  voided: "Voided",
}

export const BILLING_STATEMENT_STATUS_LABELS: Record<
  BillingStatementStatus,
  string
> = {
  draft: "Draft Statement",
  issued: "Issued",
  "partially-paid":
    "Partially Paid",
  paid: "Paid",
  voided: "Voided",
  refunded: "Refunded",
}

export const BILLING_ADJUSTMENT_TYPE_LABELS: Record<
  BillingAdjustmentType,
  string
> = {
  discount: "Discount",
  "write-off": "Write-off",
  correction: "Correction",
  reversal: "Reversal",
}

export const BILLING_COVERAGE_TYPE_LABELS: Record<
  BillingCoverageType,
  string
> = {
  insurance: "Insurance",
  "company-account":
    "Company Account",
  charity: "Charity Assistance",
}

export const BILLING_PAYMENT_METHOD_LABELS: Record<
  BillingPaymentMethod,
  string
> = {
  cash: "Cash",
  card: "Card",
  "bank-transfer":
    "Bank Transfer",
  "e-wallet": "E-wallet",
  check: "Check",
  other: "Other",
}

export const BILLING_DATE_VIEW_LABELS: Record<
  BillingDateView,
  string
> = {
  day: "Selected Date",
  "last-7-days":
    "Last Seven Days",
  all: "All Statements",
}

export const BILLING_BALANCE_STATE_LABELS: Record<
  BillingBalanceState,
  string
> = {
  all: "All Balances",
  open: "Open Balance",
  paid: "Fully Paid",
  credit: "Credit Balance",
}

export const BILLING_OPERATIONS_ACTOR =
  "GalenMed Billing Desk"

export const BILLING_SYNTHETIC_NOTICE =
  "Amounts, prices, discounts, insurance allocations, payments, receipts, and staff records are synthetic development data."

export const DEFAULT_BILLING_STATEMENT_FILTERS: BillingStatementFilters =
  {
    search: "",
    status: "all",
    branchId: "all",
    balanceState: "all",
    dateView: "day",
    selectedDate: "2026-08-04",
  }

/**
 * Synthetic development charge catalog.
 *
 * Amounts are stored in Philippine
 * centavos:
 *
 * 100 centavos = PHP 1.00
 *
 * These values are not approved
 * production prices.
 */
export const BILLING_CHARGE_CATALOG = [
  {
    code:
      "BILL-APPT-FACILITY",

    description:
      "Synthetic Appointment Facility Service",

    source: "appointment",

    defaultUnitAmountCentavos:
      25000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-CONSULT-GENERAL",

    description:
      "Synthetic General Outpatient Consultation",

    source: "consultation",

    defaultUnitAmountCentavos:
      150000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-LAB-CBC",

    description:
      "Synthetic Complete Blood Count",

    source: "laboratory",

    defaultUnitAmountCentavos:
      45000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-LAB-FBS",

    description:
      "Synthetic Fasting Blood Sugar",

    source: "laboratory",

    defaultUnitAmountCentavos:
      25000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-LAB-CRP",

    description:
      "Synthetic C-Reactive Protein",

    source: "laboratory",

    defaultUnitAmountCentavos:
      70000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-RAD-XR-CHEST-2V",

    description:
      "Synthetic Chest Radiograph — PA and Lateral",

    source: "radiology",

    defaultUnitAmountCentavos:
      90000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-RAD-CT-BRAIN-NC",

    description:
      "Synthetic CT Brain Without Contrast",

    source: "radiology",

    defaultUnitAmountCentavos:
      450000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-RAD-US-ABD-COMPLETE",

    description:
      "Synthetic Complete Abdominal Ultrasound",

    source: "radiology",

    defaultUnitAmountCentavos:
      180000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-PHARM-DISPENSING",

    description:
      "Synthetic Pharmacy Dispensing Service",

    source: "pharmacy",

    defaultUnitAmountCentavos:
      5000,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-PHARM-AMOX-500-CAP",

    description:
      "Synthetic Amoxicillin 500 mg Capsule",

    source: "pharmacy",

    defaultUnitAmountCentavos:
      1200,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-PHARM-PARA-500-TAB",

    description:
      "Synthetic Paracetamol 500 mg Tablet",

    source: "pharmacy",

    defaultUnitAmountCentavos:
      300,

    allowCustomUnitAmount:
      false,

    taxable: false,
    active: true,
  },
  {
    code:
      "BILL-MANUAL-MISC",

    description:
      "Synthetic Manual Miscellaneous Charge",

    source: "manual",

    defaultUnitAmountCentavos:
      null,

    allowCustomUnitAmount:
      true,

    taxable: false,
    active: true,
  },
] as const satisfies readonly BillingChargeCatalogItem[]
