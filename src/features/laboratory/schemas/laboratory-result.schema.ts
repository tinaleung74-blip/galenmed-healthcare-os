import { z } from "zod"

import {
  LABORATORY_RESULT_VALUE_TYPES,
} from "@/features/laboratory/types/laboratory-result.types"

const numericResultSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      Number.isFinite(
        Number(value)
      ),
    "Enter a valid numeric result."
  )

export const laboratoryResultEntryFormSchema =
  z
    .object({
      analyteCode: z
        .string()
        .trim()
        .min(
          1,
          "Analyte code is required."
        ),

      valueType: z.enum(
        LABORATORY_RESULT_VALUE_TYPES
      ),

      numericValue:
        numericResultSchema,

      textValue: z
        .string()
        .trim()
        .max(
          1000,
          "Result value must not exceed 1,000 characters."
        ),

      comment: z
        .string()
        .trim()
        .max(
          1000,
          "Result comment must not exceed 1,000 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.valueType ===
            "numeric" &&
          values.numericValue === ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["numericValue"],
            message:
              "Numeric result is required.",
          })
        }

        if (
          values.valueType !==
            "numeric" &&
          values.textValue === ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["textValue"],
            message:
              "Result value is required.",
          })
        }
      }
    )

export const laboratoryResultPanelFormSchema =
  z.object({
    performedBy: z
      .string()
      .trim()
      .min(
        2,
        "Laboratory analyst name is required."
      )
      .max(
        200,
        "Analyst name must not exceed 200 characters."
      ),

    entries: z
      .array(
        laboratoryResultEntryFormSchema
      )
      .min(
        1,
        "At least one result entry is required."
      ),
  })

export type LaboratoryResultEntryFormValues =
  z.infer<
    typeof laboratoryResultEntryFormSchema
  >

export type LaboratoryResultPanelFormValues =
  z.infer<
    typeof laboratoryResultPanelFormSchema
  >

export const laboratoryResultVerificationSchema =
  z.object({
    verifiedBy: z
      .string()
      .trim()
      .min(
        2,
        "Verifying laboratory professional is required."
      )
      .max(
        200,
        "Verifier name must not exceed 200 characters."
      ),

    verificationNote: z
      .string()
      .trim()
      .max(
        1000,
        "Verification note must not exceed 1,000 characters."
      ),

    attestationAccepted: z
      .boolean()
      .refine(
        (accepted) => accepted,
        "Technical verification attestation is required."
      ),
  })

export type LaboratoryResultVerificationValues =
  z.infer<
    typeof laboratoryResultVerificationSchema
  >

export const laboratoryResultReleaseSchema =
  z.object({
    releasedBy: z
      .string()
      .trim()
      .min(
        2,
        "Releasing laboratory professional is required."
      )
      .max(
        200,
        "Releaser name must not exceed 200 characters."
      ),

    releaseNote: z
      .string()
      .trim()
      .max(
        1000,
        "Release note must not exceed 1,000 characters."
      ),

    releaseConfirmed: z
      .boolean()
      .refine(
        (confirmed) => confirmed,
        "Result release confirmation is required."
      ),
  })

export type LaboratoryResultReleaseValues =
  z.infer<
    typeof laboratoryResultReleaseSchema
  >
