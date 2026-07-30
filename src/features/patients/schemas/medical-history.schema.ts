import { z } from "zod"

import {
  MEDICAL_CONDITION_CLINICAL_STATUSES,
  MEDICAL_HISTORY_SOURCES,
  MEDICAL_HISTORY_VERIFICATION_STATUSES,
} from "@/features/patients/types/medical-history.types"

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

const icd10CodePattern =
  /^[A-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?$/

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

const optionalClinicalDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isValidIsoDate(value),
    "Enter a valid date."
  )
  .refine(
    (value) => value === "" || isNotFutureDate(value),
    "Clinical history dates cannot be in the future."
  )

export const medicalHistoryFormSchema = z
  .object({
    conditionName: z
      .string()
      .trim()
      .min(2, "Condition name is required.")
      .max(
        200,
        "Condition name must not exceed 200 characters."
      ),

    icd10Code: z
      .string()
      .trim()
      .max(12, "ICD-10 code must not exceed 12 characters.")
      .refine(
        (value) =>
          value === "" ||
          icd10CodePattern.test(value.toUpperCase()),
        "Enter a valid ICD-10 code, such as I10 or J45.9."
      ),

    clinicalStatus: z.enum(
      MEDICAL_CONDITION_CLINICAL_STATUSES,
      {
        required_error: "Clinical status is required.",
      }
    ),

    verificationStatus: z.enum(
      MEDICAL_HISTORY_VERIFICATION_STATUSES,
      {
        required_error: "Verification status is required.",
      }
    ),

    onsetDate: optionalClinicalDateSchema,

    resolutionDate: optionalClinicalDateSchema,

    source: z.enum(MEDICAL_HISTORY_SOURCES, {
      required_error: "Information source is required.",
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
        "Clinical notes must not exceed 2,000 characters."
      ),
  })
  .superRefine((values, context) => {
    if (
      values.clinicalStatus === "resolved" &&
      values.resolutionDate === ""
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolutionDate"],
        message:
          "Resolution date is required for a resolved condition.",
      })
    }

    if (
      values.clinicalStatus !== "resolved" &&
      values.resolutionDate !== ""
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolutionDate"],
        message:
          "Set the clinical status to Resolved before entering a resolution date.",
      })
    }

    if (
      values.onsetDate !== "" &&
      values.resolutionDate !== "" &&
      values.resolutionDate < values.onsetDate
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolutionDate"],
        message:
          "Resolution date cannot be earlier than the onset date.",
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
  })

export type MedicalHistoryFormValues = z.infer<
  typeof medicalHistoryFormSchema
>
