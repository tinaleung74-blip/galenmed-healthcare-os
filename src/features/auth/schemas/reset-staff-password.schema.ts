import { z } from "zod"

export const resetStaffPasswordSchema =
  z.object({
    email: z
      .string()
      .trim()
      .email(
        "Enter a valid GalenMed work email address."
      )
      .max(
        254,
        "Email address is too long."
      ),
  })

export type ResetStaffPasswordValues =
  z.infer<
    typeof resetStaffPasswordSchema
  >
