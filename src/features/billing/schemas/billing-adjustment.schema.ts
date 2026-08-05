import { z } from "zod"

const BILLING_POSTABLE_ADJUSTMENT_TYPES = [
  "discount",
  "write-off",
  "correction",
] as const

export const BILLING_ADJUSTMENT_DIRECTIONS = [
  "decrease",
  "increase",
] as const

export type BillingAdjustmentDirection =
  (typeof BILLING_ADJUSTMENT_DIRECTIONS)[number]

const positivePesoAmountPattern =
  /^\d+(?:\.\d{1,2})?$/

export const billingAdjustmentFormSchema =
  z
    .object({
      adjustmentType: z.enum(
        BILLING_POSTABLE_ADJUSTMENT_TYPES
      ),

      direction: z.enum(
        BILLING_ADJUSTMENT_DIRECTIONS
      ),

      description: z
        .string()
        .trim()
        .min(
          3,
          "Adjustment description is required."
        )
        .max(
          500,
          "Description must not exceed 500 characters."
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
          "Adjustment amount must be greater than zero and not exceed PHP 10,000,000."
        ),

      postedBy: z
        .string()
        .trim()
        .min(
          2,
          "Billing staff member is required."
        )
        .max(
          200,
          "Billing staff name must not exceed 200 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          (
            values.adjustmentType ===
              "discount" ||
            values.adjustmentType ===
              "write-off"
          ) &&
          values.direction !==
            "decrease"
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: ["direction"],

            message:
              "Discounts and write-offs must decrease the statement amount.",
          })
        }
      }
    )

export type BillingAdjustmentFormValues =
  z.infer<
    typeof billingAdjustmentFormSchema
  >
