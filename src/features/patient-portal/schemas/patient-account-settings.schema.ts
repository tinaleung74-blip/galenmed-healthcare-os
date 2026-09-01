import { z } from "zod"

const strongPatientPasswordSchema =
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

export const patientPasswordRecoverySchema =
  z.object({
    email:
      z
        .string()
        .trim()
        .email(
          "Enter a valid Patient Portal email."
        ),
  })

export const patientSelfServicePasswordSchema =
  z
    .object({
      newPassword:
        strongPatientPasswordSchema,

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

export type PatientPasswordRecoveryValues =
  z.infer<
    typeof patientPasswordRecoverySchema
  >

export type PatientSelfServicePasswordValues =
  z.infer<
    typeof patientSelfServicePasswordSchema
  >
