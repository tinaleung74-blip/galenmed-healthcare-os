import { z } from "zod"

import {
  PATIENT_DOCUMENT_CATEGORIES,
  PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS,
  PATIENT_DOCUMENT_SOURCES,
  PATIENT_DOCUMENT_STATUSES,
  PATIENT_DOCUMENT_VERIFICATION_STATUSES,
} from "@/features/patients/types/patient-document.types"

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

const mimeTypePattern =
  /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i

function isValidIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) {
    return false
  }

  const [year, month, day] =
    value.split("-").map(Number)

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

  const [year, month, day] =
    value.split("-").map(Number)

  const date = new Date(year, month - 1, day)
  const today = new Date()

  today.setHours(23, 59, 59, 999)

  return date <= today
}

function isBeforeToday(value: string): boolean {
  if (!isValidIsoDate(value)) {
    return false
  }

  const [year, month, day] =
    value.split("-").map(Number)

  const date = new Date(year, month - 1, day)
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  return date < today
}

function isAfterToday(value: string): boolean {
  if (!isValidIsoDate(value)) {
    return false
  }

  const [year, month, day] =
    value.split("-").map(Number)

  const date = new Date(year, month - 1, day)
  const today = new Date()

  today.setHours(23, 59, 59, 999)

  return date > today
}

function hasValidFileName(value: string): boolean {
  const normalizedValue = value.trim()

  if (
    normalizedValue.includes("/") ||
    normalizedValue.includes("\\")
  ) {
    return false
  }

  const finalDotIndex =
    normalizedValue.lastIndexOf(".")

  return (
    finalDotIndex > 0 &&
    finalDotIndex <
      normalizedValue.length - 1
  )
}

const optionalDocumentDateSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" || isValidIsoDate(value),
    "Enter a valid date."
  )

export const patientDocumentFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Document title is required.")
      .max(
        200,
        "Document title must not exceed 200 characters."
      ),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Description must not exceed 500 characters."
      ),

    category: z.enum(
      PATIENT_DOCUMENT_CATEGORIES,
      {
        required_error:
          "Document category is required.",
      }
    ),

    documentStatus: z.enum(
      PATIENT_DOCUMENT_STATUSES,
      {
        required_error:
          "Document status is required.",
      }
    ),

    verificationStatus: z.enum(
      PATIENT_DOCUMENT_VERIFICATION_STATUSES,
      {
        required_error:
          "Verification status is required.",
      }
    ),

    confidentialityLevel: z.enum(
      PATIENT_DOCUMENT_CONFIDENTIALITY_LEVELS,
      {
        required_error:
          "Confidentiality level is required.",
      }
    ),

    issuedBy: z
      .string()
      .trim()
      .max(
        200,
        "Issuer name must not exceed 200 characters."
      ),

    issueDate: optionalDocumentDateSchema.refine(
      (value) =>
        value === "" || isNotFutureDate(value),
      "Issue date cannot be in the future."
    ),

    expirationDate: optionalDocumentDateSchema,

    fileName: z
      .string()
      .trim()
      .min(3, "File name is required.")
      .max(
        255,
        "File name must not exceed 255 characters."
      )
      .refine(
        hasValidFileName,
        "Enter a file name with an extension and without folder paths."
      ),

    mimeType: z
      .string()
      .trim()
      .min(3, "MIME type is required.")
      .max(
        150,
        "MIME type must not exceed 150 characters."
      )
      .regex(
        mimeTypePattern,
        "Enter a valid MIME type such as application/pdf."
      ),

    fileSizeKilobytes: z
      .string()
      .trim()
      .refine((value) => {
        const numericValue = Number(value)

        return (
          Number.isFinite(numericValue) &&
          numericValue >= 0.1 &&
          numericValue <= 102400
        )
      }, "File size must be between 0.1 KB and 102,400 KB."),

    source: z.enum(PATIENT_DOCUMENT_SOURCES, {
      required_error:
        "Document source is required.",
    }),

    sourceDetails: z
      .string()
      .trim()
      .max(
        300,
        "Source details must not exceed 300 characters."
      ),

    relatedEncounterReference: z
      .string()
      .trim()
      .max(
        100,
        "Encounter reference must not exceed 100 characters."
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
      values.issueDate !== "" &&
      values.expirationDate !== "" &&
      values.expirationDate < values.issueDate
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expirationDate"],
        message:
          "Expiration date cannot be earlier than the issue date.",
      })
    }

    if (
      values.documentStatus === "expired" &&
      values.expirationDate === ""
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expirationDate"],
        message:
          "Expiration date is required for an expired document.",
      })
    }

    if (
      values.documentStatus === "expired" &&
      values.expirationDate !== "" &&
      isAfterToday(values.expirationDate)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expirationDate"],
        message:
          "An expired document cannot have a future expiration date.",
      })
    }

    if (
      values.documentStatus === "active" &&
      values.expirationDate !== "" &&
      isBeforeToday(values.expirationDate)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expirationDate"],
        message:
          "An active document cannot have a past expiration date.",
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
          "Verification reference is required for a verified document.",
      })
    }

    if (
      values.source === "external-facility" &&
      values.sourceDetails.trim().length < 3
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceDetails"],
        message:
          "Identify the external facility, document, or source.",
      })
    }
  })

export type PatientDocumentFormValues = z.infer<
  typeof patientDocumentFormSchema
>
