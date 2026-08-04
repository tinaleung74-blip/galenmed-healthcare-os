import { z } from "zod"

const PHARMACY_REVIEW_DECISIONS = [
  "clear",
  "warning",
  "blocked",
  "not-applicable",
] as const

function reviewNeedsNote(
  status:
    (typeof PHARMACY_REVIEW_DECISIONS)[number]
): boolean {
  return (
    status === "warning" ||
    status === "blocked"
  )
}

export const pharmacyPrescriptionReviewSchema =
  z
    .object({
      reviewedBy: z
        .string()
        .trim()
        .min(
          2,
          "Reviewing pharmacist is required."
        )
        .max(
          200,
          "Reviewer name must not exceed 200 characters."
        ),

      allergyReviewStatus:
        z.enum(
          PHARMACY_REVIEW_DECISIONS
        ),

      allergyReviewNotes: z
        .string()
        .trim()
        .max(
          2000,
          "Allergy-review notes must not exceed 2,000 characters."
        ),

      interactionReviewStatus:
        z.enum(
          PHARMACY_REVIEW_DECISIONS
        ),

      interactionReviewNotes: z
        .string()
        .trim()
        .max(
          2000,
          "Interaction-review notes must not exceed 2,000 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          reviewNeedsNote(
            values.allergyReviewStatus
          ) &&
          values.allergyReviewNotes
            .trim().length < 5
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "allergyReviewNotes",
            ],

            message:
              "Document the allergy warning or blocking reason.",
          })
        }

        if (
          reviewNeedsNote(
            values.interactionReviewStatus
          ) &&
          values.interactionReviewNotes
            .trim().length < 5
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "interactionReviewNotes",
            ],

            message:
              "Document the interaction warning or blocking reason.",
          })
        }
      }
    )

export type PharmacyPrescriptionReviewValues =
  z.infer<
    typeof pharmacyPrescriptionReviewSchema
  >

export const pharmacyDispensingVerificationSchema =
  z.object({
    verifiedBy: z
      .string()
      .trim()
      .min(
        2,
        "Verifying pharmacist is required."
      )
      .max(
        200,
        "Pharmacist name must not exceed 200 characters."
      ),

    verificationNotes: z
      .string()
      .trim()
      .max(
        2000,
        "Verification notes must not exceed 2,000 characters."
      ),

    attestationAccepted: z
      .boolean()
      .refine(
        (accepted) => accepted,
        "Pharmacist verification attestation is required."
      ),
  })

export type PharmacyDispensingVerificationValues =
  z.infer<
    typeof pharmacyDispensingVerificationSchema
  >

export const pharmacyCounselingSchema =
  z.object({
    counselingCompletedBy: z
      .string()
      .trim()
      .min(
        2,
        "Counseling pharmacist or staff member is required."
      )
      .max(
        200,
        "Counselor name must not exceed 200 characters."
      ),

    counselingNotes: z
      .string()
      .trim()
      .min(
        3,
        "Record a brief synthetic counseling note."
      )
      .max(
        2000,
        "Counseling notes must not exceed 2,000 characters."
      ),

    counselingConfirmed: z
      .boolean()
      .refine(
        (confirmed) => confirmed,
        "Medication-counseling confirmation is required."
      ),
  })

export type PharmacyCounselingValues =
  z.infer<
    typeof pharmacyCounselingSchema
  >

export const pharmacyReleaseSchema =
  z.object({
    releasedBy: z
      .string()
      .trim()
      .min(
        2,
        "Releasing pharmacy professional is required."
      )
      .max(
        200,
        "Releaser name must not exceed 200 characters."
      ),

    releaseConfirmed: z
      .boolean()
      .refine(
        (confirmed) => confirmed,
        "Final medication-release confirmation is required."
      ),
  })

export type PharmacyReleaseValues =
  z.infer<
    typeof pharmacyReleaseSchema
  >

export const pharmacyCancellationSchema =
  z.object({
    cancellationReason: z
      .string()
      .trim()
      .min(
        5,
        "Enter a cancellation reason of at least five characters."
      )
      .max(
        2000,
        "Cancellation reason must not exceed 2,000 characters."
      ),
  })

export type PharmacyCancellationValues =
  z.infer<
    typeof pharmacyCancellationSchema
  >
