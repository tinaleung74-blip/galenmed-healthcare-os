import { z } from "zod"

import {
  PHARMACY_MEDICATION_ROUTES,
  PHARMACY_PRESCRIPTION_PRIORITIES,
  PHARMACY_PRESCRIPTION_SOURCES,
} from "@/features/pharmacy/types/pharmacy.types"

const pharmacyPrescriptionItemFormSchema =
  z.object({
    medicationId: z
      .string()
      .trim()
      .min(
        1,
        "Medication selection is required."
      ),

    dose: z
      .string()
      .trim()
      .min(
        1,
        "Medication dose is required."
      )
      .max(
        100,
        "Dose must not exceed 100 characters."
      ),

    route: z.enum(
      PHARMACY_MEDICATION_ROUTES,
      {
        required_error:
          "Medication route is required.",
      }
    ),

    frequency: z
      .string()
      .trim()
      .min(
        1,
        "Medication frequency is required."
      )
      .max(
        200,
        "Frequency must not exceed 200 characters."
      ),

    durationDays: z
      .string()
      .trim()
      .refine(
        (value) => {
          if (value === "") {
            return true
          }

          const duration = Number(value)

          return (
            Number.isInteger(duration) &&
            duration >= 1 &&
            duration <= 365
          )
        },
        "Duration must be 1–365 days or left blank."
      ),

    quantityPrescribed: z
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
        "Prescribed quantity must be a whole number from 1 to 10,000."
      ),

    instructions: z
      .string()
      .trim()
      .min(
        2,
        "Medication instructions are required."
      )
      .max(
        1000,
        "Instructions must not exceed 1,000 characters."
      ),

    substitutionAllowed:
      z.boolean(),
  })

export const pharmacyPrescriptionFormSchema =
  z
    .object({
      patientId: z
        .string()
        .trim()
        .min(
          1,
          "Patient selection is required."
        ),

      consultationId: z
        .string()
        .trim(),

      branchId: z
        .string()
        .trim()
        .min(
          1,
          "Pharmacy branch is required."
        ),

      prescriberName: z
        .string()
        .trim()
        .min(
          2,
          "Prescriber or authorized requester is required."
        )
        .max(
          200,
          "Prescriber name must not exceed 200 characters."
        ),

      source: z.enum(
        PHARMACY_PRESCRIPTION_SOURCES,
        {
          required_error:
            "Prescription source is required.",
        }
      ),

      priority: z.enum(
        PHARMACY_PRESCRIPTION_PRIORITIES,
        {
          required_error:
            "Prescription priority is required.",
        }
      ),

      clinicalNotes: z
        .string()
        .trim()
        .max(
          2000,
          "Clinical notes must not exceed 2,000 characters."
        ),

      items: z
        .array(
          pharmacyPrescriptionItemFormSchema
        )
        .min(
          1,
          "Add at least one medication."
        )
        .max(
          20,
          "A prescription may contain up to 20 medications."
        )
        .refine(
          (items) =>
            new Set(
              items.map(
                (item) =>
                  item.medicationId
              )
            ).size ===
            items.length,
          "Duplicate medications are not allowed in this development prescription."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.source ===
            "consultation" &&
          values.consultationId === ""
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "consultationId",
            ],

            message:
              "Select the linked consultation for a consultation-based prescription.",
          })
        }

        if (
          values.source !==
            "consultation" &&
          values.consultationId !== ""
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "consultationId",
            ],

            message:
              "Remove the consultation link or change the source to Consultation.",
          })
        }
      }
    )

export type PharmacyPrescriptionFormValues =
  z.infer<
    typeof pharmacyPrescriptionFormSchema
  >
