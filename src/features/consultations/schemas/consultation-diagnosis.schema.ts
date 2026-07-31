import { z } from "zod"

import {
  CONSULTATION_DIAGNOSIS_ROLES,
  CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES,
} from "@/features/consultations/types/consultation-diagnosis.types"

const isoDatePattern =
  /^\d{4}-\d{2}-\d{2}$/

const icd10CodePattern =
  /^[A-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?$/

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

function isNotFutureDate(
  value: string
): boolean {
  if (!isValidIsoDate(value)) {
    return false
  }

  const [year, month, day] =
    value.split("-").map(Number)

  const date = new Date(
    year,
    month - 1,
    day
  )

  const currentDate = new Date()

  currentDate.setHours(
    23,
    59,
    59,
    999
  )

  return date <= currentDate
}

const optionalDiagnosisDateSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      isValidIsoDate(value),
    "Enter a valid onset date."
  )
  .refine(
    (value) =>
      value === "" ||
      isNotFutureDate(value),
    "Diagnosis onset date cannot be in the future."
  )

export const consultationDiagnosisFormSchema =
  z
    .object({
      diagnosisName: z
        .string()
        .trim()
        .min(
          2,
          "Diagnosis name is required."
        )
        .max(
          200,
          "Diagnosis name must not exceed 200 characters."
        ),

      icd10Code: z
        .string()
        .trim()
        .max(
          12,
          "ICD-10 code must not exceed 12 characters."
        )
        .refine(
          (value) =>
            value === "" ||
            icd10CodePattern.test(
              value.toUpperCase()
            ),
          "Enter a valid ICD-10 format, such as I10 or J06.9."
        ),

      role: z.enum(
        CONSULTATION_DIAGNOSIS_ROLES,
        {
          required_error:
            "Diagnosis role is required.",
        }
      ),

      verificationStatus: z.enum(
        CONSULTATION_DIAGNOSIS_VERIFICATION_STATUSES,
        {
          required_error:
            "Verification status is required.",
        }
      ),

      onsetDate:
        optionalDiagnosisDateSchema,

      clinicalNotes: z
        .string()
        .trim()
        .max(
          2000,
          "Clinical notes must not exceed 2,000 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.role === "primary" &&
          values.verificationStatus ===
            "refuted"
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "verificationStatus",
            ],
            message:
              "A refuted diagnosis cannot remain the primary diagnosis.",
          })
        }

        if (
          values.verificationStatus ===
            "confirmed" &&
          values.role !==
            "differential" &&
          values.icd10Code.trim() === ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["icd10Code"],
            message:
              "ICD-10 code is required for a confirmed primary or secondary diagnosis.",
          })
        }
      }
    )

export type ConsultationDiagnosisFormValues =
  z.infer<
    typeof consultationDiagnosisFormSchema
  >
