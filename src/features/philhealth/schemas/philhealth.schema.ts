import { z } from "zod"

import {
  PHILHEALTH_ENCOUNTER_TYPES,
  PHILHEALTH_MEMBER_RELATIONSHIPS,
  PHILHEALTH_REQUIREMENT_STATUSES,
  PHILHEALTH_STAFF_ROLES,
} from "@/features/philhealth/types/philhealth.types"

const RECORDABLE_ELIGIBILITY_STATUSES = [
  "pending",
  "eligible",
  "not-eligible",
  "mismatch",
  "error",
] as const

const RECORDABLE_ELIGIBILITY_SOURCES = [
  "official-portal-manual",
  "integration",
] as const

function normalizePinDigits(
  value: string
): string {
  return value.replace(
    /[\s-]+/g,
    ""
  )
}

function isValidPhilHealthPinInput(
  value: string
): boolean {
  if (!value.trim()) {
    return true
  }

  if (
    !/^[\d\s-]+$/.test(value)
  ) {
    return false
  }

  return (
    normalizePinDigits(value)
      .length === 12
  )
}

function isValidDateTimeInput(
  value: string
): boolean {
  if (!value.trim()) {
    return true
  }

  return !Number.isNaN(
    new Date(value).getTime()
  )
}

function parsePesoInput(
  value: string
): number | null {
  const normalizedValue =
    value.trim()

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalizedValue
    )
  ) {
    return null
  }

  const parsedValue =
    Number(normalizedValue)

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : null
}

const optionalTextSchema =
  z
    .string()
    .trim()
    .max(
      2000,
      "Value must not exceed 2,000 characters."
    )

const optionalPinSchema =
  z
    .string()
    .trim()
    .max(
      30,
      "PhilHealth PIN input is too long."
    )
    .refine(
      isValidPhilHealthPinInput,
      "Enter a 12-digit PhilHealth PIN using digits, spaces, or hyphens only."
    )

const actorSchema =
  z
    .string()
    .trim()
    .min(
      2,
      "Responsible staff member is required."
    )
    .max(
      200,
      "Staff name must not exceed 200 characters."
    )

const optionalDateTimeSchema =
  z
    .string()
    .trim()
    .refine(
      isValidDateTimeInput,
      "Enter a valid date and time."
    )

const positivePesoSchema =
  z
    .string()
    .trim()
    .min(
      1,
      "Amount is required."
    )
    .refine(
      (value) => {
        const parsedValue =
          parsePesoInput(value)

        return (
          parsedValue !== null &&
          parsedValue > 0
        )
      },
      "Enter an amount greater than zero with no more than two decimal places."
    )

const nonNegativePesoSchema =
  z
    .string()
    .trim()
    .min(
      1,
      "Amount is required."
    )
    .refine(
      (value) => {
        const parsedValue =
          parsePesoInput(value)

        return (
          parsedValue !== null &&
          parsedValue >= 0
        )
      },
      "Enter a valid non-negative amount with no more than two decimal places."
    )

export const philHealthProfileFormSchema =
  z
    .object({
      patientId: z
        .string()
        .trim()
        .min(
          1,
          "Patient is required."
        ),

      philHealthIdentificationNumber:
        optionalPinSchema,

      memberRelationship:
        z.enum(
          PHILHEALTH_MEMBER_RELATIONSHIPS
        ),

      principalMemberName:
        optionalTextSchema,

      principalMemberPin:
        optionalPinSchema,

      membershipCategory:
        optionalTextSchema,

      consentAcknowledged:
        z
          .boolean()
          .refine(
            (acknowledged) =>
              acknowledged,
            "Patient consent acknowledgement is required."
          ),

      consentAcknowledgedBy:
        actorSchema,

      updatedBy:
        actorSchema,

      actorRole:
        z.enum(
          PHILHEALTH_STAFF_ROLES
        ),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        if (
          values.memberRelationship ===
          "member"
        ) {
          if (
            !normalizePinDigits(
              values
                .philHealthIdentificationNumber
            )
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "philHealthIdentificationNumber",
              ],

              message:
                "PhilHealth PIN is required when the patient is the principal member.",
            })
          }

          return
        }

        if (
          !values.principalMemberName
            .trim()
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "principalMemberName",
            ],

            message:
              "Principal member name is required for a dependent.",
          })
        }

        if (
          !normalizePinDigits(
            values.principalMemberPin
          )
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "principalMemberPin",
            ],

            message:
              "Principal member PhilHealth PIN is required for a dependent.",
          })
        }
      }
    )

export type PhilHealthProfileFormValues =
  z.infer<
    typeof philHealthProfileFormSchema
  >

export const philHealthEligibilityFormSchema =
  z
    .object({
      profileId: z
        .string()
        .trim()
        .min(
          1,
          "PhilHealth profile is required."
        ),

      status:
        z.enum(
          RECORDABLE_ELIGIBILITY_STATUSES
        ),

      source:
        z.enum(
          RECORDABLE_ELIGIBILITY_SOURCES
        ),

      pbefReference:
        optionalTextSchema,

      notes:
        optionalTextSchema,

      checkedBy:
        actorSchema,

      actorRole:
        z.enum(
          PHILHEALTH_STAFF_ROLES
        ),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        if (
          (
            values.status ===
              "not-eligible" ||
            values.status ===
              "mismatch" ||
            values.status ===
              "error"
          ) &&
          !values.notes.trim()
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: ["notes"],

            message:
              "Add notes explaining the eligibility result.",
          })
        }
      }
    )

export type PhilHealthEligibilityFormValues =
  z.infer<
    typeof philHealthEligibilityFormSchema
  >

export const philHealthClaimFormSchema =
  z
    .object({
      patientId: z
        .string()
        .trim()
        .min(
          1,
          "Patient is required."
        ),

      profileId: z
        .string()
        .trim()
        .min(
          1,
          "PhilHealth profile is required."
        ),

      branchId: z
        .string()
        .trim()
        .min(
          1,
          "Hospital branch is required."
        ),

      encounterType:
        z.enum(
          PHILHEALTH_ENCOUNTER_TYPES
        ),

      encounterRecordId:
        optionalTextSchema,

      encounterReference:
        optionalTextSchema,

      admissionAt:
        optionalDateTimeSchema,

      dischargeAt:
        optionalDateTimeSchema,

      primaryDiagnosisCode:
        optionalTextSchema,

      primaryDiagnosisName:
        optionalTextSchema,

      benefitPackageCode:
        optionalTextSchema,

      benefitPackageName:
        optionalTextSchema,

      grossHospitalChargesPhp:
        positivePesoSchema,

      estimatedPhilHealthBenefitPhp:
        nonNegativePesoSchema,

      notes:
        optionalTextSchema,

      createdBy:
        actorSchema,

      actorRole:
        z.enum(
          PHILHEALTH_STAFF_ROLES
        ),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        const grossAmount =
          parsePesoInput(
            values
              .grossHospitalChargesPhp
          )

        const estimatedBenefit =
          parsePesoInput(
            values
              .estimatedPhilHealthBenefitPhp
          )

        if (
          grossAmount !== null &&
          estimatedBenefit !== null &&
          estimatedBenefit >
            grossAmount
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "estimatedPhilHealthBenefitPhp",
            ],

            message:
              "Estimated PhilHealth benefit must not exceed gross hospital charges in this internal draft.",
          })
        }

        if (
          values.admissionAt &&
          values.dischargeAt
        ) {
          const admissionTimestamp =
            new Date(
              values.admissionAt
            ).getTime()

          const dischargeTimestamp =
            new Date(
              values.dischargeAt
            ).getTime()

          if (
            !Number.isNaN(
              admissionTimestamp
            ) &&
            !Number.isNaN(
              dischargeTimestamp
            ) &&
            dischargeTimestamp <
              admissionTimestamp
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "dischargeAt",
              ],

              message:
                "Discharge date and time must not be before admission.",
            })
          }
        }
      }
    )

export type PhilHealthClaimFormValues =
  z.infer<
    typeof philHealthClaimFormSchema
  >

export const philHealthRequirementUpdateSchema =
  z
    .object({
      claimId: z
        .string()
        .trim()
        .min(
          1,
          "Claim is required."
        ),

      requirementId: z
        .string()
        .trim()
        .min(
          1,
          "Requirement is required."
        ),

      status:
        z.enum(
          PHILHEALTH_REQUIREMENT_STATUSES
        ),

      patientDocumentId:
        optionalTextSchema,

      remarks:
        optionalTextSchema,

      reviewedBy:
        actorSchema,

      actorRole:
        z.enum(
          PHILHEALTH_STAFF_ROLES
        ),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        if (
          values.status ===
            "rejected" &&
          !values.remarks.trim()
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: ["remarks"],

            message:
              "A rejection reason is required.",
          })
        }
      }
    )

export type PhilHealthRequirementUpdateValues =
  z.infer<
    typeof philHealthRequirementUpdateSchema
  >
