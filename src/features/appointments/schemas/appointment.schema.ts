import { z } from "zod"

import {
  APPOINTMENT_BOOKING_STATUSES,
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_SOURCES,
} from "@/features/appointments/types/appointment.types"
import {
  CONSULTATION_MODES,
  CONSULTATION_VISIT_TYPES,
} from "@/features/consultations/types/consultation.types"

const isoDatePattern =
  /^\d{4}-\d{2}-\d{2}$/

const timePattern =
  /^(?:[01]\d|2[0-3]):[0-5]\d$/

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

export const appointmentFormSchema = z
  .object({
    patientId: z
      .string()
      .trim()
      .min(
        1,
        "Patient selection is required."
      ),

    branchId: z
      .string()
      .trim()
      .min(
        1,
        "Branch is required."
      ),

    departmentId: z
      .string()
      .trim()
      .min(
        1,
        "Department is required."
      ),

    doctorId: z
      .string()
      .trim()
      .min(
        1,
        "Doctor is required."
      ),

    roomId: z
      .string()
      .trim(),

    appointmentDate: z
      .string()
      .trim()
      .min(
        1,
        "Appointment date is required."
      )
      .refine(
        isValidIsoDate,
        "Enter a valid appointment date."
      ),

    startTime: z
      .string()
      .trim()
      .regex(
        timePattern,
        "Enter a valid appointment time."
      ),

    durationMinutes: z
      .string()
      .trim()
      .refine((value) => {
        const duration = Number(value)

        return (
          Number.isInteger(duration) &&
          duration >= 15 &&
          duration <= 480 &&
          duration % 5 === 0
        )
      }, "Duration must be 15–480 minutes in five-minute intervals."),

    status: z.enum(
      APPOINTMENT_BOOKING_STATUSES,
      {
        required_error:
          "Initial appointment status is required.",
      }
    ),

    priority: z.enum(
      APPOINTMENT_PRIORITIES,
      {
        required_error:
          "Appointment priority is required.",
      }
    ),

    source: z.enum(
      APPOINTMENT_SOURCES,
      {
        required_error:
          "Booking source is required.",
      }
    ),

    mode: z.enum(
      CONSULTATION_MODES,
      {
        required_error:
          "Appointment mode is required.",
      }
    ),

    visitType: z.enum(
      CONSULTATION_VISIT_TYPES,
      {
        required_error:
          "Visit type is required.",
      }
    ),

    chiefComplaint: z
      .string()
      .trim()
      .min(
        2,
        "Appointment reason or chief complaint is required."
      )
      .max(
        500,
        "Appointment reason must not exceed 500 characters."
      ),

    patientInstructions: z
      .string()
      .trim()
      .max(
        1000,
        "Patient instructions must not exceed 1,000 characters."
      ),

    internalNotes: z
      .string()
      .trim()
      .max(
        2000,
        "Internal notes must not exceed 2,000 characters."
      ),
  })
  .superRefine(
    (values, context) => {
      if (
        values.mode === "in-person" &&
        values.roomId === ""
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["roomId"],
          message:
            "Room assignment is required for an in-person appointment.",
        })
      }

      if (
        values.mode === "telemedicine" &&
        values.roomId !== ""
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["roomId"],
          message:
            "Leave the physical room blank for telemedicine appointments.",
        })
      }
    }
  )

export type AppointmentFormValues =
  z.infer<
    typeof appointmentFormSchema
  >
