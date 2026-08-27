import { z } from "zod"

import {
  CASHIER_PAYMENT_CLEARANCE_STATUSES,
  CASHIER_PAYMENT_METHODS,
  CASHIER_RECEIPT_PRINT_TYPES,
} from "@/features/hospital-operations/types/cashier-billing.types"

function isValidPhpAmount(
  value: string
): boolean {
  return /^\d+(?:\.\d{1,2})?$/.test(
    value.trim()
  )
}

function phpAmountIsPositive(
  value: string
): boolean {
  if (!isValidPhpAmount(value)) {
    return false
  }

  const amount = Number(value)

  return (
    Number.isFinite(amount) &&
    amount > 0
  )
}

export const cashierRecordPaymentSchema =
  z.object({
    billingAccountId: z
      .string()
      .uuid(
        "A valid billing account is required."
      ),

    amountPhp: z
      .string()
      .trim()
      .min(1, "Payment amount is required.")
      .refine(
        phpAmountIsPositive,
        "Enter a valid amount greater than zero with no more than two decimal places."
      ),

    paymentMethod: z.enum(
      CASHIER_PAYMENT_METHODS
    ),

    externalReference: z
      .string()
      .trim()
      .max(
        200,
        "External reference must not exceed 200 characters."
      ),

    idempotencyKey: z
      .string()
      .trim()
      .min(
        12,
        "Payment request key is invalid."
      )
      .max(200),
  })

export type CashierRecordPaymentValues =
  z.infer<
    typeof cashierRecordPaymentSchema
  >

export const cashierSetClearanceSchema =
  z
    .object({
      serviceRequestId: z
        .string()
        .uuid(
          "A valid service request is required."
        ),

      clearanceStatus: z.enum(
        CASHIER_PAYMENT_CLEARANCE_STATUSES
      ),

      clearedAmountPhp: z
        .string()
        .trim()
        .max(30),

      clearanceReason: z
        .string()
        .trim()
        .min(
          3,
          "A payment-clearance reason is required."
        )
        .max(
          500,
          "Clearance reason must not exceed 500 characters."
        ),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        if (
          values.clearanceStatus ===
          "partially_cleared"
        ) {
          if (
            !phpAmountIsPositive(
              values.clearedAmountPhp
            )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: [
                "clearedAmountPhp",
              ],
              message:
                "Enter a valid partial-clearance amount greater than zero.",
            })
          }
        }
      }
    )

export type CashierSetClearanceValues =
  z.infer<
    typeof cashierSetClearanceSchema
  >

export const cashierReceiptPrintSchema =
  z
    .object({
      paymentTransactionId: z
        .string()
        .uuid(
          "A valid payment transaction is required."
        ),

      printType: z.enum(
        CASHIER_RECEIPT_PRINT_TYPES
      ),

      printReason: z
        .string()
        .trim()
        .max(
          500,
          "Print reason must not exceed 500 characters."
        ),

      idempotencyKey: z
        .string()
        .trim()
        .min(
          12,
          "Receipt print request key is invalid."
        )
        .max(200),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        if (
          values.printType ===
            "reprint" &&
          values.printReason.length < 3
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["printReason"],
            message:
              "A receipt reprint reason is required.",
          })
        }
      }
    )

export type CashierReceiptPrintValues =
  z.infer<
    typeof cashierReceiptPrintSchema
  >
