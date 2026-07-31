import { z } from "zod"

const soapSectionSchema = z
  .string()
  .trim()
  .max(
    10000,
    "SOAP section must not exceed 10,000 characters."
  )

export const consultationSoapNoteFormSchema = z
  .object({
    subjective: soapSectionSchema,
    objective: soapSectionSchema,
    assessment: soapSectionSchema,
    plan: soapSectionSchema,
  })
  .superRefine((values, context) => {
    const hasClinicalContent = [
      values.subjective,
      values.objective,
      values.assessment,
      values.plan,
    ].some(
      (sectionValue) =>
        sectionValue.trim().length > 0
    )

    if (!hasClinicalContent) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subjective"],
        message:
          "Enter content in at least one SOAP section before saving the draft.",
      })
    }
  })

export type ConsultationSoapNoteFormValues =
  z.infer<
    typeof consultationSoapNoteFormSchema
  >
