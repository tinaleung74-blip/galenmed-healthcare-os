import type {
  BillingStatement,
} from "@/features/billing/types/billing.types"

export const PATIENT_BILLING_HISTORY_FILTERS = [
  "all",
  "open",
  "paid",
  "credit",
  "refunded",
  "voided",
] as const

export type PatientBillingHistoryFilter =
  (typeof PATIENT_BILLING_HISTORY_FILTERS)[number]

export interface PatientFinancialStatementRecord {
  id: string

  statement:
    BillingStatement
}
