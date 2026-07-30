import { z } from "zod"

import {
  INSURANCE_COVERAGE_STATUSES,
  INSURANCE_COVERAGE_TYPES,
  INSURANCE_INFORMATION_SOURCES,
  INSURANCE_PRIORITIES,
  INSURANCE_SUBSCRIBER_RELATIONSHIPS,
  INSURANCE_VERIFICATION_STATUSES,
} from "@/features/patients/types/patient-insurance.types"

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
const philippineContactPattern =
  /^(?:\+63|0)\d{9,10}$/

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

function isDateBeforeToday(value: string): boolean {
  if (!isValidIsoDate(value)) {
    return false
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  return date < today
}

const optionalCoverageDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isValidIsoDate(value),
    "Enter a valid date."
  )

const optionalSubscriberBirthDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isValidIsoDate(value),
    "Enter a valid subscriber date of birth."
  )
  .refine(
    (value) => value === "" || isNotFutureDate(value),
    "Subscriber date of birth cannot be in the future."
  )

export const patientInsuranceFormSchema = z
  .object({
    payerName: z
      .string()
      .trim()
      .min(2, "Payer name is required.")
      .max(
        200,
        "Payer name must not exceed 200 characters."
      ),

    planName: z
      .string()
      .trim()
      .min(2, "Plan name is required.")
      .max(
        200,
        "Plan name must not exceed 200 characters."
      ),

    coverageType: z.enum(
      INSURANCE_COVERAGE_TYPES,
      {
        required_error:
          "Coverage type is required.",
      }
    ),

    coverageStatus: z.enum(
      INSURANCE_COVERAGE_STATUSES,
      {
        required_error:
          "Coverage status is required.",
      }
    ),

    verificationStatus: z.enum(
      INSURANCE_VERIFICATION_STATUSES,
      {
        required_error:
          "Verification status is required.",
      }
    ),

    priority: z.enum(INSURANCE_PRIORITIES, {
      required_error:
        "Coverage priority is required.",
    }),

    memberNumber: z
      .string()
      .trim()
      .min(2, "Member number is required.")
      .max(
        100,
        "Member number must not exceed 100 characters."
      ),

    policyNumber: z
      .string()
      .trim()
      .max(
        100,
        "Policy number must not exceed 100 characters."
      ),

    groupNumber: z
      .string()
      .trim()
      .max(
        100,
        "Group number must not exceed 100 characters."
      ),

    subscriberName: z
      .string()
      .trim()
      .min(2, "Subscriber name is required.")
      .max(
        200,
        "Subscriber name must not exceed 200 characters."
      ),

    subscriberRelationship: z.enum(
      INSURANCE_SUBSCRIBER_RELATIONSHIPS,
      {
        required_error:
          "Subscriber relationship is required.",
      }
    ),

    subscriberDateOfBirth:
      optionalSubscriberBirthDateSchema,

    effectiveFrom: z
      .string()
      .trim()
      .min(1, "Coverage start date is required.")
      .refine(
        isValidIsoDate,
        "Enter a valid coverage start date."
      ),

    effectiveTo: optionalCoverageDateSchema,

    employerName: z
      .string()
      .trim()
      .max(
        200,
        "Employer name must not exceed 200 characters."
      ),

    payerContactNumber: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          philippineContactPattern.test(value),
        "Enter a valid Philippine contact number."
      ),

    authorizationRequired: z.boolean(),

    coveredServices: z
      .string()
      .trim()
      .max(
        1000,
        "Covered services must not exceed 1,000 characters."
      ),

    source: z.enum(
      INSURANCE_INFORMATION_SOURCES,
      {
        required_error:
          "Information source is required.",
      }
    ),

    sourceDetails: z
      .string()
      .trim()
      .max(
        300,
        "Source details must not exceed 300 characters."
      ),

    verificationReference: z
      .string()
      .trim()
      .max(
        150,
        "Verification reference must not exceed 150 characters."
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
      values.effectiveTo !== "" &&
      values.effectiveTo < values.effectiveFrom
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveTo"],
        message:
          "Coverage end date cannot be earlier than the start date.",
      })
    }

    if (
      values.coverageStatus === "expired" &&
      values.effectiveTo === ""
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveTo"],
        message:
          "Coverage end date is required for expired coverage.",
      })
    }

    if (
      values.coverageStatus === "active" &&
      values.effectiveTo !== "" &&
      isDateBeforeToday(values.effectiveTo)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveTo"],
        message:
          "An active coverage record cannot have a past end date.",
      })
    }

    if (
      values.verificationStatus === "verified" &&
      values.verificationReference.trim().length < 3
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verificationReference"],
        message:
          "Verification reference is required for verified coverage.",
      })
    }

    if (
      (values.source === "payer-portal" ||
        values.source === "external-record") &&
      values.sourceDetails.trim().length < 3
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceDetails"],
        message:
          "Identify the payer portal, facility, document, or external source.",
      })
    }
  })

export type PatientInsuranceFormValues = z.infer<
  typeof patientInsuranceFormSchema
>
