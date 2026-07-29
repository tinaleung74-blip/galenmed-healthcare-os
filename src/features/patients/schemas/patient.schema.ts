import { z } from "zod"

import { BIOLOGICAL_SEXES } from "@/features/patients/types/patient.types"
import { calculateAge } from "@/features/patients/utils/patient.utils"

const philippineMobileNumberPattern = /^(?:\+63|0)9\d{9}$/
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

  const today = new Date()
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  today.setHours(23, 59, 59, 999)

  return date <= today
}

function isMedicallyPlausibleDateOfBirth(value: string): boolean {
  const age = calculateAge(value)

  return age !== null && age <= 130
}

export const patientFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(100, "First name must not exceed 100 characters."),

  middleName: z
    .string()
    .trim()
    .max(100, "Middle name must not exceed 100 characters.")
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(100, "Last name must not exceed 100 characters."),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required.")
    .refine(isValidIsoDate, "Enter a valid date of birth.")
    .refine(isNotFutureDate, "Date of birth cannot be in the future.")
    .refine(
      isMedicallyPlausibleDateOfBirth,
      "Date of birth must be medically plausible."
    ),

  biologicalSex: z.enum(BIOLOGICAL_SEXES, {
    required_error: "Biological sex is required.",
  }),

  mobileNumber: z
    .string()
    .trim()
    .regex(
      philippineMobileNumberPattern,
      "Use a Philippine mobile number such as 09171234567 or +639171234567."
    ),

  emailAddress: z.union([
    z
      .string()
      .trim()
      .max(254, "Email address must not exceed 254 characters.")
      .email("Enter a valid email address."),
    z.literal(""),
  ]),

  branchId: z.string().trim().min(1, "Branch is required."),

  address: z
    .string()
    .trim()
    .min(5, "Enter the patient's complete address.")
    .max(500, "Address must not exceed 500 characters."),

  emergencyContactName: z
    .string()
    .trim()
    .min(1, "Emergency contact name is required.")
    .max(150, "Emergency contact name must not exceed 150 characters."),

  emergencyContactNumber: z
    .string()
    .trim()
    .regex(
      philippineMobileNumberPattern,
      "Use a Philippine mobile number such as 09171234567 or +639171234567."
    ),

  consentAcknowledged: z
    .boolean()
    .refine(
      (isAcknowledged) => isAcknowledged,
      "Patient consent acknowledgement is required."
    ),
})

export type PatientFormValues = z.infer<typeof patientFormSchema>
