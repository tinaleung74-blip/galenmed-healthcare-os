import { z } from "zod"

import {
  BILLING_COVERAGE_TYPES,
} from "@/features/billing/types/billing.types"

const positivePesoAmountPattern =
  /^\d+(?:\.\d{1,2})?$/

export const billingCoverageFormSchema =
  z.object({
    coverageType: z.enum(
      BILLING_COVERAGE_TYPES
    ),

    payerName: z
      .string()
      .trim()
      .min(
        2,
        "Coverage payer name is required."
      )
      .max(
        300,
        "Payer name must not exceed 300 characters."
      ),

    amountPhp: z
      .string()
      .trim()
      .regex(
        positivePesoAmountPattern,
        "Enter a valid positive PHP amount with up to two decimal places."
      )
      .refine(
        (value) => {
          const amount = Number(value)

          return (
            Number.isFinite(amount) &&
            amount > 0 &&
            amount <= 10000000
          )
        },
        "Coverage amount must be greater than zero and not exceed PHP 10,000,000."
      ),

    referenceNumber: z
      .string()
      .trim()
      .max(
        200,
        "Coverage reference must not exceed 200 characters."
      ),

    notes: z
      .string()
      .trim()
      .max(
        2000,
        "Coverage notes must not exceed 2,000 characters."
      ),

    allocatedBy: z
      .string()
      .trim()
      .min(
        2,
        "Allocating billing staff member is required."
      )
      .max(
        200,
        "Billing staff name must not exceed 200 characters."
      ),
  })

export type BillingCoverageFormValues =
  z.infer<
    typeof billingCoverageFormSchema
  >
