import { z } from "zod"

import {
  RECEPTION_PRINT_PURPOSES,
  RECEPTION_RELEASE_METHODS,
} from "@/features/hospital-operations/types/reception-release.types"

export const receptionReleaseDocumentSchema =
  z.object({
    documentId: z
      .string()
      .uuid(
        "A valid clinical document is required."
      ),

    releaseMethod: z.enum(
      RECEPTION_RELEASE_METHODS
    ),

    recipientName: z
      .string()
      .trim()
      .min(
        2,
        "Recipient name is required."
      )
      .max(
        200,
        "Recipient name must not exceed 200 characters."
      ),

    recipientRelationship: z
      .string()
      .trim()
      .max(
        100,
        "Relationship must not exceed 100 characters."
      ),

    recipientIdentifierMasked: z
      .string()
      .trim()
      .max(
        100,
        "Masked identifier must not exceed 100 characters."
      ),

    notes: z
      .string()
      .trim()
      .max(
        500,
        "Release notes must not exceed 500 characters."
      ),

    idempotencyKey: z
      .string()
      .trim()
      .min(
        12,
        "Release request key is invalid."
      )
      .max(200),
  })

export type ReceptionReleaseDocumentValues =
  z.infer<
    typeof receptionReleaseDocumentSchema
  >

export const receptionPrintDocumentSchema =
  z
    .object({
      documentId: z
        .string()
        .uuid(
          "A valid clinical document is required."
        ),

      releaseRecordId: z.union([
        z
          .string()
          .uuid(
            "Release record is invalid."
          ),
        z.literal(""),
      ]),

      printPurpose: z.enum(
        RECEPTION_PRINT_PURPOSES
      ),

      printReason: z
        .string()
        .trim()
        .max(
          500,
          "Print reason must not exceed 500 characters."
        ),

      idempotencyKey: z
        .string()
        .trim()
        .min(
          12,
          "Print request key is invalid."
        )
        .max(200),
    })
    .superRefine(
      (
        values,
        context
      ) => {
        if (
          values.printPurpose ===
            "reprint" &&
          values.printReason.length < 3
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["printReason"],
            message:
              "A reason is required before reprinting a clinical document.",
          })
        }
      }
    )

export type ReceptionPrintDocumentValues =
  z.infer<
    typeof receptionPrintDocumentSchema
  >
