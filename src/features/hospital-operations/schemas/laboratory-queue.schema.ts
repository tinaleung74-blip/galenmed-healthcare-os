import { z } from "zod"

import {
  LABORATORY_QUEUE_ACTIONS,
} from "@/features/hospital-operations/types/laboratory-queue.types"

export const laboratoryQueueActionSchema =
  z
    .object({
      queueEntryId: z
        .string()
        .uuid(
          "The selected queue entry is invalid."
        ),

      action: z.enum(
        LABORATORY_QUEUE_ACTIONS
      ),

      reason: z
        .string()
        .trim()
        .max(
          500,
          "Reason must not exceed 500 characters."
        ),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        if (
          values.action ===
            "cancel" &&
          !values.reason
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["reason"],
            message:
              "A cancellation reason is required.",
          })
        }
      }
    )

export type LaboratoryQueueActionValues =
  z.infer<
    typeof laboratoryQueueActionSchema
  >
