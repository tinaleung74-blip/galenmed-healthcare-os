import { z } from "zod"

import {
  BILLING_PAYMENT_METHODS,
} from "@/features/billing/types/billing.types"

const positivePesoAmountPattern =
  /^\d+(?:\.\d{1,2})?$/

const positivePesoAmountSchema =
  z
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
      "Amount must be greater than zero and not exceed PHP 10,000,000."
    )

export const billingPaymentFormSchema =
  z.object({
    method: z.enum(
      BILLING_PAYMENT_METHODS
    ),

    amountPhp:
      positivePesoAmountSchema,

    externalReference: z
      .string()
      .trim()
      .max(
        200,
        "Payment reference must not exceed 200 characters."
      ),

    notes: z
      .string()
      .trim()
      .max(
        2000,
        "Payment notes must not exceed 2,000 characters."
      ),

    postedBy: z
      .string()
      .trim()
      .min(
        2,
        "Payment-recording staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters."
      ),
  })

export type BillingPaymentFormValues =
  z.infer<
    typeof billingPaymentFormSchema
  >

export const billingRefundFormSchema =
  z.object({
    paymentId: z
      .string()
      .trim(),

    amountPhp:
      positivePesoAmountSchema,

    reason: z
      .string()
      .trim()
      .min(
        5,
        "Refund reason must contain at least five characters."
      )
      .max(
        2000,
        "Refund reason must not exceed 2,000 characters."
      ),

    postedBy: z
      .string()
      .trim()
      .min(
        2,
        "Refund-recording staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters."
      ),
  })

export type BillingRefundFormValues =
  z.infer<
    typeof billingRefundFormSchema
  >

export const billingReversalSchema =
  z.object({
    reason: z
      .string()
      .trim()
      .min(
        5,
        "Reversal or void reason must contain at least five characters."
      )
      .max(
        2000,
        "Reason must not exceed 2,000 characters."
      ),

    performedBy: z
      .string()
      .trim()
      .min(
        2,
        "Responsible staff member is required."
      )
      .max(
        200,
        "Staff name must not exceed 200 characters."
      ),
  })

export type BillingReversalValues =
  z.infer<
    typeof billingReversalSchema
  >
