import { z } from "zod"

import {
  RADIOLOGY_CRITICAL_COMMUNICATION_METHODS,
  RADIOLOGY_FINDING_LEVELS,
} from "@/features/radiology/types/radiology-report.types"

function isValidDateTime(
  value: string
): boolean {
  const date = new Date(value)

  return !Number.isNaN(
    date.getTime()
  )
}

export const radiologyReportFormSchema =
  z
    .object({
      draftedBy: z
        .string()
        .trim()
        .min(
          2,
          "Reporting radiologist or authorized reporter is required."
        )
        .max(
          200,
          "Reporter name must not exceed 200 characters."
        ),

      findings: z
        .string()
        .trim()
        .min(
          5,
          "Radiology findings are required."
        )
        .max(
          10000,
          "Findings must not exceed 10,000 characters."
        ),

      impression: z
        .string()
        .trim()
        .min(
          3,
          "Radiology impression is required."
        )
        .max(
          5000,
          "Impression must not exceed 5,000 characters."
        ),

      recommendation: z
        .string()
        .trim()
        .max(
          3000,
          "Recommendation must not exceed 3,000 characters."
        ),

      findingLevel: z.enum(
        RADIOLOGY_FINDING_LEVELS,
        {
          required_error:
            "Finding level is required.",
        }
      ),

      criticalFindingSummary: z
        .string()
        .trim()
        .max(
          2000,
          "Critical-finding summary must not exceed 2,000 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.findingLevel ===
            "critical" &&
          values.criticalFindingSummary
            .trim().length < 5
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "criticalFindingSummary",
            ],

            message:
              "Document the critical finding before saving the report.",
          })
        }

        if (
          values.findingLevel !==
            "critical" &&
          values.criticalFindingSummary
            .trim().length > 0
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "criticalFindingSummary",
            ],

            message:
              "Critical-finding summary is only used when the finding level is Critical.",
          })
        }
      }
    )

export type RadiologyReportFormValues =
  z.infer<
    typeof radiologyReportFormSchema
  >

export const radiologyReportVerificationSchema =
  z.object({
    verifiedBy: z
      .string()
      .trim()
      .min(
        2,
        "Verifying radiologist is required."
      )
      .max(
        200,
        "Radiologist name must not exceed 200 characters."
      ),

    radiologistRegistrationNumber: z
      .string()
      .trim()
      .min(
        3,
        "Professional registration number is required."
      )
      .max(
        100,
        "Registration number must not exceed 100 characters."
      ),

    verificationNote: z
      .string()
      .trim()
      .max(
        2000,
        "Verification note must not exceed 2,000 characters."
      ),

    criticalCommunicatedAt: z
      .string()
      .trim(),

    criticalCommunicatedBy: z
      .string()
      .trim()
      .max(
        200,
        "Communicator name must not exceed 200 characters."
      ),

    criticalCommunicatedTo: z
      .string()
      .trim()
      .max(
        200,
        "Recipient name must not exceed 200 characters."
      ),

    criticalCommunicationMethod:
      z.union([
        z.enum(
          RADIOLOGY_CRITICAL_COMMUNICATION_METHODS
        ),
        z.literal(""),
      ]),

    criticalCommunicationNote: z
      .string()
      .trim()
      .max(
        2000,
        "Communication note must not exceed 2,000 characters."
      ),

    attestationAccepted: z
      .boolean()
      .refine(
        (accepted) => accepted,
        "Radiologist verification attestation is required."
      ),
  })
  .superRefine(
    (values, context) => {
      if (
        values.criticalCommunicatedAt &&
        !isValidDateTime(
          values.criticalCommunicatedAt
        )
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "criticalCommunicatedAt",
          ],

          message:
            "Enter a valid critical-communication date and time.",
        })
      }
    }
  )

export type RadiologyReportVerificationValues =
  z.infer<
    typeof radiologyReportVerificationSchema
  >

export const radiologyReportReleaseSchema =
  z.object({
    releasedBy: z
      .string()
      .trim()
      .min(
        2,
        "Releasing radiology professional is required."
      )
      .max(
        200,
        "Releaser name must not exceed 200 characters."
      ),

    releaseNote: z
      .string()
      .trim()
      .max(
        2000,
        "Release note must not exceed 2,000 characters."
      ),

    releaseConfirmed: z
      .boolean()
      .refine(
        (confirmed) => confirmed,
        "Final-report release confirmation is required."
      ),
  })

export type RadiologyReportReleaseValues =
  z.infer<
    typeof radiologyReportReleaseSchema
  >
