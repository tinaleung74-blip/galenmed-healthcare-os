import { z } from "zod"

import {
  ALLERGY_CATEGORIES,
  ALLERGY_CLINICAL_STATUSES,
  ALLERGY_CRITICALITIES,
  ALLERGY_INFORMATION_SOURCES,
  ALLERGY_INTOLERANCE_TYPES,
  ALLERGY_REACTION_SEVERITIES,
  ALLERGY_VERIFICATION_STATUSES,
} from "@/features/patients/types/patient-allergy.types"

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) {
    return false
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function isNotFutureDate(value: string): boolean {
  if (!isValidIsoDate(value)) {
    return false
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()

  today.setHours(23, 59, 59, 999)

  return date <= today
}

const optionalAllergyDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isValidIsoDate(value),
    "Enter a valid date."
  )
  .refine(
    (value) => value === "" || isNotFutureDate(value),
    "Allergy history dates cannot be in the future."
  )

export const patientAllergyFormSchema = z
  .object({
    allergenName: z
      .string()
      .trim()
      .min(2, "Allergen or substance name is required.")
      .max(
        200,
        "Allergen name must not exceed 200 characters."
      ),

    allergenCode: z
      .string()
      .trim()
      .max(
        100,
        "Allergen code must not exceed 100 characters."
      ),

    codeSystem: z
      .string()
      .trim()
      .max(
        100,
        "Code system must not exceed 100 characters."
      ),

    type: z.enum(ALLERGY_INTOLERANCE_TYPES, {
      required_error:
        "Allergy or intolerance type is required.",
    }),

    category: z.enum(ALLERGY_CATEGORIES, {
      required_error: "Allergy category is required.",
    }),

    clinicalStatus: z.enum(
      ALLERGY_CLINICAL_STATUSES,
      {
        required_error:
          "Clinical status is required.",
      }
    ),

    verificationStatus: z.enum(
      ALLERGY_VERIFICATION_STATUSES,
      {
        required_error:
          "Verification status is required.",
      }
    ),

    criticality: z.enum(ALLERGY_CRITICALITIES, {
      required_error: "Criticality is required.",
    }),

    onsetDate: optionalAllergyDateSchema,

    lastOccurrenceDate: optionalAllergyDateSchema,

    reactionManifestations: z
      .string()
      .trim()
      .max(
        500,
        "Reaction manifestations must not exceed 500 characters."
      ),

    reactionSeverity: z.union([
      z.enum(ALLERGY_REACTION_SEVERITIES),
      z.literal(""),
    ]),

    exposureRoute: z
      .string()
      .trim()
      .max(
        100,
        "Exposure route must not exceed 100 characters."
      ),

    source: z.enum(ALLERGY_INFORMATION_SOURCES, {
      required_error:
        "Information source is required.",
    }),

    sourceDetails: z
      .string()
      .trim()
      .max(
        300,
        "Source details must not exceed 300 characters."
      ),

    notes: z
      .string()
      .trim()
      .max(
        2000,
        "Notes must not exceed 2,000 characters."
      ),
  })
  .superRefine((values, context) => {
    if (
      values.onsetDate !== "" &&
      values.lastOccurrenceDate !== "" &&
      values.lastOccurrenceDate < values.onsetDate
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastOccurrenceDate"],
        message:
          "Last occurrence cannot be earlier than the onset date.",
      })
    }

    if (
      values.reactionSeverity !== "" &&
      values.reactionManifestations.trim() === ""
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reactionManifestations"],
        message:
          "Document at least one reaction manifestation when severity is recorded.",
      })
    }

    if (
      values.source === "external-record" &&
      values.sourceDetails.trim().length < 3
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceDetails"],
        message:
          "Identify the external facility, document, or record source.",
      })
    }

    if (
      values.allergenCode !== "" &&
      values.codeSystem === ""
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codeSystem"],
        message:
          "Identify the terminology or code system used for the allergen code.",
      })
    }
  })

export type PatientAllergyFormValues = z.infer<
  typeof patientAllergyFormSchema
>
