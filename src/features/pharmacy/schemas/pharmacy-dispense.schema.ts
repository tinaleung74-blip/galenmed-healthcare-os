import { z } from "zod"

export const pharmacyDispenseFormSchema =
  z.object({
    prescriptionItemId: z
      .string()
      .trim()
      .min(
        1,
        "Prescription item is required."
      ),

    inventoryItemId: z
      .string()
      .trim()
      .min(
        1,
        "Inventory batch is required."
      ),

    quantityToDispense: z
      .string()
      .trim()
      .refine(
        (value) => {
          const quantity = Number(value)

          return (
            Number.isInteger(quantity) &&
            quantity >= 1 &&
            quantity <= 10000
          )
        },
        "Dispensing quantity must be a whole number from 1 to 10,000."
      ),

    dispensedBy: z
      .string()
      .trim()
      .min(
        2,
        "Dispensing pharmacy professional is required."
      )
      .max(
        200,
        "Dispenser name must not exceed 200 characters."
      ),

    labelReviewConfirmed:
      z.boolean()
        .refine(
          (confirmed) => confirmed,
          "Medication-label review confirmation is required."
        ),
  })

export type PharmacyDispenseFormValues =
  z.infer<
    typeof pharmacyDispenseFormSchema
  >
