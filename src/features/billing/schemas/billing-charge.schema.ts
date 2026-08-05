import { z } from "zod"

import {
  BILLING_CHARGE_SOURCES,
} from "@/features/billing/types/billing.types"

const pesoAmountPattern =
  /^\d+(?:\.\d{1,2})?$/

export const billingChargeFormSchema =
  z
    .object({
      patientId: z
        .string()
        .trim()
        .min(
          1,
          "Patient selection is required."
        ),

      branchId: z
        .string()
        .trim()
        .min(
          1,
          "Billing branch is required."
        ),

      source: z.enum(
        BILLING_CHARGE_SOURCES,
        {
          required_error:
            "Charge source is required.",
        }
      ),

      sourceRecordId: z
        .string()
        .trim()
        .max(
          200,
          "Source record identifier must not exceed 200 characters."
        ),

      sourceReference: z
        .string()
        .trim()
        .max(
          200,
          "Source reference must not exceed 200 characters."
        ),

      catalogCode: z
        .string()
        .trim()
        .min(
          1,
          "Charge-catalog item is required."
        ),

      description: z
        .string()
        .trim()
        .min(
          2,
          "Charge description is required."
        )
        .max(
          500,
          "Charge description must not exceed 500 characters."
        ),

      quantity: z
        .string()
        .trim()
        .refine(
          (value) => {
            const quantity =
              Number(value)

            return (
              Number.isInteger(
                quantity
              ) &&
              quantity >= 1 &&
              quantity <= 10000
            )
          },
          "Quantity must be a whole number from 1 to 10,000."
        ),

      unitAmountPhp: z
        .string()
        .trim()
        .regex(
          pesoAmountPattern,
          "Enter a valid PHP amount with up to two decimal places."
        )
        .refine(
          (value) => {
            const amount =
              Number(value)

            return (
              Number.isFinite(
                amount
              ) &&
              amount > 0 &&
              amount <= 10000000
            )
          },
          "Unit amount must be greater than zero and not exceed PHP 10,000,000."
        ),

      notes: z
        .string()
        .trim()
        .max(
          2000,
          "Charge notes must not exceed 2,000 characters."
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
          values.source !==
            "manual" &&
          values.sourceRecordId ===
            ""
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "sourceRecordId",
            ],

            message:
              "A linked source record is required for non-manual charges.",
          })
        }
      }
    )

export type BillingChargeFormValues =
  z.infer<
    typeof billingChargeFormSchema
  >
