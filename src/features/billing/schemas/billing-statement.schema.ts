import { z } from "zod"

export const billingStatementFormSchema =
  z.object({
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

    chargeIds: z
      .array(
        z
          .string()
          .trim()
          .min(
            1,
            "Charge identifier is required."
          )
      )
      .min(
        1,
        "Select at least one posted charge."
      )
      .refine(
        (chargeIds) =>
          new Set(chargeIds).size ===
          chargeIds.length,
        "Duplicate charges are not allowed."
      ),

    notes: z
      .string()
      .trim()
      .max(
        2000,
        "Statement notes must not exceed 2,000 characters."
      ),

    createdBy: z
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

export type BillingStatementFormValues =
  z.infer<
    typeof billingStatementFormSchema
  >

export const billingStatementIssueSchema =
  z.object({
    issuedBy: z
      .string()
      .trim()
      .min(
        2,
        "Issuing billing staff member is required."
      )
      .max(
        200,
        "Billing staff name must not exceed 200 characters."
      ),

    issueConfirmed: z
      .boolean()
      .refine(
        (confirmed) => confirmed,
        "Statement-issue confirmation is required."
      ),
  })

export type BillingStatementIssueValues =
  z.infer<
    typeof billingStatementIssueSchema
  >
