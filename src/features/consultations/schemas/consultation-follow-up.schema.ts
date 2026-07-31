import { z } from "zod"

import {
  CONSULTATION_FOLLOW_UP_DISPOSITIONS,
  CONSULTATION_FOLLOW_UP_MODES,
} from "@/features/consultations/types/consultation-finalization.types"

const isoDatePattern =
  /^\d{4}-\d{2}-\d{2}$/

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

const optionalFollowUpDateSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      isValidIsoDate(value),
    "Enter a valid follow-up date."
  )

export const consultationFollowUpFormSchema =
  z
    .object({
      followUpDisposition: z.enum(
        CONSULTATION_FOLLOW_UP_DISPOSITIONS,
        {
          required_error:
            "Follow-up disposition is required.",
        }
      ),

      followUpDate:
        optionalFollowUpDateSchema,

      followUpMode: z.union([
        z.enum(
          CONSULTATION_FOLLOW_UP_MODES
        ),
        z.literal(""),
      ]),

      followUpReason: z
        .string()
        .trim()
        .max(
          1000,
          "Follow-up reason must not exceed 1,000 characters."
        ),

      patientInstructions: z
        .string()
        .trim()
        .max(
          3000,
          "Patient instructions must not exceed 3,000 characters."
        ),

      returnPrecautions: z
        .string()
        .trim()
        .max(
          3000,
          "Return precautions must not exceed 3,000 characters."
        ),

      referralFacility: z
        .string()
        .trim()
        .max(
          200,
          "Referral facility must not exceed 200 characters."
        ),

      referralProvider: z
        .string()
        .trim()
        .max(
          200,
          "Referral provider must not exceed 200 characters."
        ),

      referralReason: z
        .string()
        .trim()
        .max(
          1000,
          "Referral reason must not exceed 1,000 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.followUpDisposition ===
            "scheduled" &&
          values.followUpDate === ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["followUpDate"],
            message:
              "Follow-up date is required for a scheduled follow-up.",
          })
        }

        if (
          values.followUpDisposition ===
            "scheduled" &&
          values.followUpMode === ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["followUpMode"],
            message:
              "Follow-up mode is required for a scheduled follow-up.",
          })
        }

        if (
          values.followUpDisposition ===
            "scheduled" &&
          values.followUpReason
            .trim().length < 3
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["followUpReason"],
            message:
              "Document the reason for the scheduled follow-up.",
          })
        }

        if (
          values.followUpDisposition ===
            "as-needed" &&
          values.followUpReason
            .trim().length < 3
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["followUpReason"],
            message:
              "Document when or why the patient should follow up as needed.",
          })
        }

        if (
          values.followUpDisposition ===
            "external-referral" &&
          values.referralFacility
            .trim().length < 2
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["referralFacility"],
            message:
              "Referral facility is required for an external referral.",
          })
        }

        if (
          values.followUpDisposition ===
            "external-referral" &&
          values.referralReason
            .trim().length < 3
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["referralReason"],
            message:
              "Referral reason is required for an external referral.",
          })
        }

        if (
          values.followUpDisposition !==
            "scheduled" &&
          (values.followUpDate !== "" ||
            values.followUpMode !== "")
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["followUpDate"],
            message:
              "Scheduled date and mode may only be entered for a scheduled follow-up.",
          })
        }

        const hasDischargeContent = [
          values.patientInstructions,
          values.returnPrecautions,
        ].some(
          (value) =>
            value.trim().length >= 3
        )

        if (!hasDischargeContent) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["patientInstructions"],
            message:
              "Enter patient instructions or return precautions before saving the follow-up draft.",
          })
        }
      }
    )

export type ConsultationFollowUpFormValues =
  z.infer<
    typeof consultationFollowUpFormSchema
  >
