import { z } from "zod"

import {
  LABORATORY_ORDER_PRIORITIES,
  LABORATORY_ORDER_SOURCES,
} from "@/features/laboratory/types/laboratory.types"

export const laboratoryOrderFormSchema =
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
          "Laboratory branch is required."
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
        LABORATORY_ORDER_PRIORITIES,
        {
          required_error:
            "Laboratory priority is required.",
        }
      ),

      source: z.enum(
        LABORATORY_ORDER_SOURCES,
        {
          required_error:
            "Laboratory order source is required.",
        }
      ),

      selectedTestCodes: z
        .array(
          z.string().trim().min(1)
        )
        .min(
          1,
          "Select at least one laboratory test."
        )
        .max(
          20,
          "A laboratory order may contain up to 20 tests."
        )
        .refine(
          (testCodes) =>
            new Set(testCodes).size ===
            testCodes.length,
          "Duplicate laboratory tests are not allowed."
        ),

      clinicalIndication: z
        .string()
        .trim()
        .min(
          2,
          "Clinical indication is required."
        )
        .max(
          1000,
          "Clinical indication must not exceed 1,000 characters."
        ),

      fastingRequired: z.boolean(),

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
          values.source ===
            "consultation" &&
          values.consultationId === ""
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["consultationId"],
            message:
              "Select the linked consultation for a consultation-based laboratory order.",
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

export type LaboratoryOrderFormValues =
  z.infer<
    typeof laboratoryOrderFormSchema
  >
