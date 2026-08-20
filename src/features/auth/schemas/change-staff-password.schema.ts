import { z } from "zod"

const strongStaffPasswordSchema =
  z
    .string()
    .min(
      12,
      "New password must contain at least 12 characters."
    )
    .max(
      128,
      "New password is too long."
    )
    .regex(
      /[a-z]/,
      "New password must contain a lowercase letter."
    )
    .regex(
      /[A-Z]/,
      "New password must contain an uppercase letter."
    )
    .regex(
      /\d/,
      "New password must contain a number."
    )
    .regex(
      /[^A-Za-z0-9]/,
      "New password must contain a special character."
    )

export const changeStaffPasswordSchema =
  z
    .object({
      newPassword:
        strongStaffPasswordSchema,

      confirmNewPassword:
        z.string(),
    })
    .refine(
      (values) =>
        values.newPassword ===
        values.confirmNewPassword,
      {
        path: [
          "confirmNewPassword",
        ],
        message:
          "Password confirmation does not match.",
      }
    )

export type ChangeStaffPasswordValues =
  z.infer<
    typeof changeStaffPasswordSchema
  >
