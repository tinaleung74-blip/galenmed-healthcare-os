import { z } from "zod"

import {
  RADIOLOGY_ORDER_PRIORITIES,
  RADIOLOGY_ORDER_SOURCES,
} from "@/features/radiology/types/radiology.types"

export const radiologyOrderFormSchema =
  z
    .object({
      patientId: z
        .string()
        .trim()
        .min(
          1,
          "Patient selection is required."
        ),

      consultationId: z
        .string()
        .trim(),

      branchId: z
        .string()
        .trim()
        .min(
          1,
          "Radiology branch is required."
        ),

      orderedByName: z
        .string()
        .trim()
        .min(
          2,
          "Ordering clinician or authorized requester is required."
        )
        .max(
          200,
          "Ordering name must not exceed 200 characters."
        ),

      priority: z.enum(
        RADIOLOGY_ORDER_PRIORITIES,
        {
          required_error:
            "Radiology priority is required.",
        }
      ),

      source: z.enum(
        RADIOLOGY_ORDER_SOURCES,
        {
          required_error:
            "Radiology order source is required.",
        }
      ),

      procedureCode: z
        .string()
        .trim()
        .min(
          1,
          "Radiology procedure is required."
        ),

      clinicalIndication: z
        .string()
        .trim()
        .min(
          2,
          "Clinical indication is required."
        )
        .max(
          1500,
          "Clinical indication must not exceed 1,500 characters."
        ),

      specialInstructions: z
        .string()
        .trim()
        .max(
          1500,
          "Special instructions must not exceed 1,500 characters."
        ),
    })
    .superRefine(
      (values, context) => {
        if (
          values.source ===
            "consultation" &&
          values.consultationId === ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["consultationId"],
            message:
              "Select the linked consultation for a consultation-based radiology order.",
          })
        }

        if (
          values.source !==
            "consultation" &&
          values.consultationId !== ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["consultationId"],
            message:
              "Remove the consultation link or change the order source to Consultation.",
          })
        }
      }
    )

export type RadiologyOrderFormValues =
  z.infer<
    typeof radiologyOrderFormSchema
  >
