import { z } from "zod"

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

export const radiologyScheduleFormSchema =
  z.object({
    scheduledDate: z
      .string()
      .trim()
      .min(
        1,
        "Imaging date is required."
      )
      .refine(
        isValidIsoDate,
        "Enter a valid imaging date."
      ),

    startTime: z
      .string()
      .trim()
      .regex(
        timePattern,
        "Enter a valid imaging time."
      ),

    durationMinutes: z
      .string()
      .trim()
      .refine((value) => {
        const duration = Number(value)

        return (
          Number.isInteger(duration) &&
          duration >= 10 &&
          duration <= 240 &&
          duration % 5 === 0
        )
      }, "Duration must be 10–240 minutes in five-minute intervals."),

    roomId: z
      .string()
      .trim()
      .min(
        1,
        "Radiology room is required."
      ),

    schedulingNotes: z
      .string()
      .trim()
      .max(
        1000,
        "Scheduling notes must not exceed 1,000 characters."
      ),
  })

export type RadiologyScheduleFormValues =
  z.infer<
    typeof radiologyScheduleFormSchema
  >
