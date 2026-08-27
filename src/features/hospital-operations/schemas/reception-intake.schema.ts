import { z } from "zod"

import {
  HOSPITAL_SERVICE_TYPES,
} from "@/features/hospital-operations/types/service-catalog.types"
import {
  RECEPTION_ARRIVAL_MODES,
  RECEPTION_SERVICE_PRIORITIES,
} from "@/features/hospital-operations/types/reception-intake.types"

const philippineMobilePattern =
  /^(?:\+63|0)9\d{9}$/

const safeIdempotencyPattern =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/

function isValidDate(
  value: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false
  }

  const [
    year,
    month,
    day,
  ] = value.split("-").map(Number)

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

function isPlausibleBirthDate(
  value: string
): boolean {
  if (!isValidDate(value)) {
    return false
  }

  const birthDate =
    new Date(`${value}T00:00:00`)

  const today = new Date()

  const earliest = new Date()
  earliest.setFullYear(
    earliest.getFullYear() - 130
  )

  return (
    birthDate <= today &&
    birthDate >= earliest
  )
}

const optionalMobileSchema =
  z.union([
    z
      .string()
      .trim()
      .regex(
        philippineMobilePattern,
        "Use a Philippine mobile number such as 09171234567 or +639171234567."
      ),
    z.literal(""),
  ])

const optionalEmailSchema =
  z.union([
    z
      .string()
      .trim()
      .max(
        254,
        "Email address must not exceed 254 characters."
      )
      .email(
        "Enter a valid email address."
      ),
    z.literal(""),
  ])

const idempotencyKeySchema =
  z
    .string()
    .trim()
    .min(
      8,
      "Operation key is invalid. Reopen the form and try again."
    )
    .max(
      200,
      "Operation key is invalid. Reopen the form and try again."
    )
    .regex(
      safeIdempotencyPattern,
      "Operation key is invalid. Reopen the form and try again."
    )

export const receptionPatientFormSchema =
  z.object({
    idempotencyKey:
      idempotencyKeySchema,

    branchId: z
      .string()
      .trim()
      .min(
        1,
        "Hospital branch is required."
      ),

    firstName: z
      .string()
      .trim()
      .min(
        1,
        "First name is required."
      )
      .max(
        100,
        "First name must not exceed 100 characters."
      ),

    middleName: z
      .string()
      .trim()
      .max(
        100,
        "Middle name must not exceed 100 characters."
      ),

    lastName: z
      .string()
      .trim()
      .min(
        1,
        "Last name is required."
      )
      .max(
        100,
        "Last name must not exceed 100 characters."
      ),

    dateOfBirth: z
      .string()
      .trim()
      .refine(
        isPlausibleBirthDate,
        "Enter a valid and medically plausible date of birth."
      ),

    biologicalSex: z.enum([
      "male",
      "female",
      "intersex",
      "unknown",
    ]),

    mobileNumber:
      optionalMobileSchema,

    emailAddress:
      optionalEmailSchema,

    address: z
      .string()
      .trim()
      .min(
        5,
        "Enter the patient address."
      )
      .max(
        500,
        "Address must not exceed 500 characters."
      ),

    emergencyContactName: z
      .string()
      .trim()
      .min(
        1,
        "Emergency contact name is required."
      )
      .max(
        150,
        "Emergency contact name must not exceed 150 characters."
      ),

    emergencyContactNumber: z
      .string()
      .trim()
      .regex(
        philippineMobilePattern,
        "Use a Philippine mobile number such as 09171234567 or +639171234567."
      ),

    consentAcknowledged:
      z.boolean().refine(
        (value) => value,
        "Patient consent acknowledgement is required."
      ),
  })

export type ReceptionPatientFormValues =
  z.infer<
    typeof receptionPatientFormSchema
  >

export const receptionVisitFormSchema =
  z.object({
    idempotencyKey:
      idempotencyKeySchema,

    patientId: z
      .string()
      .uuid(
        "Patient reference is invalid."
      ),

    branchId: z
      .string()
      .trim()
      .min(
        1,
        "Hospital branch is required."
      ),

    arrivalMode:
      z.enum(
        RECEPTION_ARRIVAL_MODES
      ),

    initialServiceType:
      z.enum(
        HOSPITAL_SERVICE_TYPES
      ),

    chiefConcern: z
      .string()
      .trim()
      .max(
        1000,
        "Chief concern must not exceed 1,000 characters."
      ),
  })

export type ReceptionVisitFormValues =
  z.infer<
    typeof receptionVisitFormSchema
  >

export const receptionCheckInSchema =
  z.object({
    visitId: z
      .string()
      .uuid(
        "Hospital visit reference is invalid."
      ),
  })

export type ReceptionCheckInValues =
  z.infer<
    typeof receptionCheckInSchema
  >

export const receptionServiceRequestFormSchema =
  z.object({
    idempotencyKey:
      idempotencyKeySchema,

    visitId: z
      .string()
      .uuid(
        "Hospital visit reference is invalid."
      ),

    serviceCatalogItemId: z
      .string()
      .uuid(
        "Hospital service is required."
      ),

    priority:
      z.enum(
        RECEPTION_SERVICE_PRIORITIES
      ),

    doctorOrderReference: z
      .string()
      .trim()
      .max(
        300,
        "Doctor-order reference must not exceed 300 characters."
      ),

    requestNotes: z
      .string()
      .trim()
      .max(
        1000,
        "Request notes must not exceed 1,000 characters."
      ),

    createQueue: z.boolean(),
  })

export type ReceptionServiceRequestFormValues =
  z.infer<
    typeof receptionServiceRequestFormSchema
  >
