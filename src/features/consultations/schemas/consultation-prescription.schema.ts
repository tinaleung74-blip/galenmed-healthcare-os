import { z } from "zod"

import {
  CONSULTATION_ALLERGY_REVIEW_STATUSES,
  CONSULTATION_MEDICATION_DOSE_UNITS,
  CONSULTATION_MEDICATION_DURATION_UNITS,
  CONSULTATION_MEDICATION_FREQUENCIES,
  CONSULTATION_MEDICATION_ROUTES,
} from "@/features/consultations/types/consultation-prescription.types"

const isoDatePattern =
  /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(
  value: string
): boolean {
  if (!isoDatePattern.test(value)) {
    return false
  }

  const [year, month, day] =
    value.split("-").map(Number)

  const date = new Date(
    year,
    month - 1,
    day
  )

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function requiredPositiveNumber(
  label: string,
  maximum: number
) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => {
      const numericValue = Number(value)

      return (
        Number.isFinite(numericValue) &&
        numericValue > 0 &&
        numericValue <= maximum
      )
    }, `${label} must be greater than zero and not exceed ${maximum}.`)
}

function optionalWholeNumber(
  label: string,
  maximum: number
) {
  return z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") {
        return true
      }

      const numericValue = Number(value)

      return (
        Number.isInteger(numericValue) &&
        numericValue >= 0 &&
        numericValue <= maximum
      )
    }, `${label} must be a whole number from 0 to ${maximum}.`)
}

const optionalMedicationDateSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      isValidIsoDate(value),
    "Enter a valid date."
  )

export const consultationPrescriptionFormSchema =
  z
    .object({
      medicationName: z
        .string()
        .trim()
        .min(
          2,
          "Medication name is required."
        )
        .max(
          200,
          "Medication name must not exceed 200 characters."
        ),

      strength: z
        .string()
        .trim()
        .max(
          100,
          "Strength must not exceed 100 characters."
        ),

      doseAmount:
        requiredPositiveNumber(
          "Dose amount",
          100000
        ),

      doseUnit: z.enum(
        CONSULTATION_MEDICATION_DOSE_UNITS,
        {
          required_error:
            "Dose unit is required.",
        }
      ),

      route: z.enum(
        CONSULTATION_MEDICATION_ROUTES,
        {
          required_error:
            "Medication route is required.",
        }
      ),

      frequency: z.enum(
        CONSULTATION_MEDICATION_FREQUENCIES,
        {
          required_error:
            "Frequency is required.",
        }
      ),

      frequencyDetails: z
        .string()
        .trim()
        .max(
          300,
          "Frequency details must not exceed 300 characters."
        ),

      durationValue:
        optionalWholeNumber(
          "Duration",
          3650
        ),

      durationUnit: z.enum(
        CONSULTATION_MEDICATION_DURATION_UNITS,
        {
          required_error:
            "Duration unit is required.",
        }
      ),

      quantity:
        requiredPositiveNumber(
          "Quantity",
          100000
        ),

      quantityUnit: z
        .string()
        .trim()
        .min(
          1,
          "Quantity unit is required."
        )
        .max(
          50,
          "Quantity unit must not exceed 50 characters."
        ),

      refillsAllowed:
        optionalWholeNumber(
          "Refills",
          12
        ),

      startDate: z
        .string()
        .trim()
        .min(
          1,
          "Start date is required."
        )
        .refine(
          isValidIsoDate,
          "Enter a valid start date."
        ),

      endDate:
        optionalMedicationDateSchema,

      indication: z
        .string()
        .trim()
        .min(
          2,
          "Medication indication is required."
        )
        .max(
          500,
          "Indication must not exceed 500 characters."
        ),

      patientInstructions: z
        .string()
        .trim()
        .min(
          2,
          "Patient instructions are required."
        )
        .max(
          2000,
          "Patient instructions must not exceed 2,000 characters."
        ),

      prescriberNotes: z
        .string()
        .trim()
        .max(
          2000,
          "Prescriber notes must not exceed 2,000 characters."
        ),

      substitutionAllowed: z.boolean(),

      allergyReviewStatus: z.enum(
        CONSULTATION_ALLERGY_REVIEW_STATUSES,
        {
          required_error:
            "Allergy review status is required.",
        }
      ),

      allergyWarningNote: z
        .string()
        .trim()
        .max(
          500,
          "Allergy warning note must not exceed 500 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.frequency ===
            "custom" &&
          values.frequencyDetails
            .trim().length < 2
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "frequencyDetails",
            ],
            message:
              "Describe the custom medication schedule.",
          })
        }

        if (
          values.durationUnit ===
            "ongoing" &&
          values.durationValue !== ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["durationValue"],
            message:
              "Leave duration blank when the prescription is ongoing.",
          })
        }

        if (
          values.durationUnit !==
            "ongoing" &&
          values.durationValue === ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["durationValue"],
            message:
              "Duration is required unless the medication is ongoing.",
          })
        }

        if (
          values.endDate !== "" &&
          values.endDate <
            values.startDate
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message:
              "End date cannot be earlier than the start date.",
          })
        }

        if (
          values.allergyReviewStatus ===
            "reviewed-with-warning" &&
          values.allergyWarningNote
            .trim().length < 3
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "allergyWarningNote",
            ],
            message:
              "Document the reviewed allergy warning and clinical decision.",
          })
        }
      }
    )

export type ConsultationPrescriptionFormValues =
  z.infer<
    typeof consultationPrescriptionFormSchema
  >
