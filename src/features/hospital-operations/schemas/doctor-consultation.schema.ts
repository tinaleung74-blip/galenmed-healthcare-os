import { z } from "zod"

const optionalClinicalText = z
  .string()
  .trim()
  .max(
    5000,
    "Clinical text must not exceed 5,000 characters."
  )

export const assignDoctorSchema = z.object({
  idempotencyKey: z
    .string()
    .trim()
    .min(8)
    .max(200),

  serviceRequestId: z
    .string()
    .uuid(
      "A valid consultation request is required."
    ),

  doctorId: z
    .string()
    .uuid(
      "A valid Doctor is required."
    ),

  reason: z
    .string()
    .trim()
    .min(
      3,
      "Assignment reason is required."
    )
    .max(
      1000,
      "Assignment reason must not exceed 1,000 characters."
    ),
})

export type AssignDoctorValues =
  z.infer<typeof assignDoctorSchema>

export const saveDoctorConsultationSchema =
  z.object({
    consultationId: z
      .string()
      .uuid(
        "A valid Doctor consultation is required."
      ),

    chiefComplaint:
      optionalClinicalText,

    historyOfPresentIllness:
      optionalClinicalText,

    physicalExamination:
      optionalClinicalText,

    assessment:
      optionalClinicalText,

    diagnosisCode: z
      .string()
      .trim()
      .max(
        100,
        "Diagnosis code must not exceed 100 characters."
      ),

    diagnosisText:
      optionalClinicalText,

    treatmentPlan:
      optionalClinicalText,

    clinicalNotes:
      optionalClinicalText,
  })

export type SaveDoctorConsultationValues =
  z.infer<
    typeof saveDoctorConsultationSchema
  >

export const completeDoctorConsultationSchema =
  saveDoctorConsultationSchema
    .extend({
      idempotencyKey: z
        .string()
        .trim()
        .min(8)
        .max(200),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        if (
          !values.assessment.trim()
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["assessment"],
            message:
              "Assessment is required before completion.",
          })
        }

        if (
          !values.diagnosisText.trim()
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["diagnosisText"],
            message:
              "Diagnosis is required before completion.",
          })
        }

        if (
          !values.treatmentPlan.trim()
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["treatmentPlan"],
            message:
              "Treatment plan is required before completion.",
          })
        }
      }
    )

export type CompleteDoctorConsultationValues =
  z.infer<
    typeof completeDoctorConsultationSchema
  >
