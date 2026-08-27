import { z } from "zod"

import {
  LABORATORY_RESULT_FLAGS,
} from "@/features/hospital-operations/types/laboratory-result.types"

export const laboratoryResultItemSchema =
  z.object({
    id: z
      .string()
      .trim()
      .min(1),

    testName: z
      .string()
      .trim()
      .min(
        1,
        "Test name is required."
      )
      .max(200),

    resultValue: z
      .string()
      .trim()
      .min(
        1,
        "Result value is required."
      )
      .max(500),

    unit: z
      .string()
      .trim()
      .max(100),

    referenceRange: z
      .string()
      .trim()
      .max(300),

    flag: z.enum(
      LABORATORY_RESULT_FLAGS
    ),

    remarks: z
      .string()
      .trim()
      .max(1000),
  })

export const laboratoryResultDraftSchema =
  z.object({
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(200),

    serviceRequestId: z
      .string()
      .uuid(),

    documentId: z
      .string()
      .uuid()
      .nullable(),

    title: z
      .string()
      .trim()
      .min(
        2,
        "Result title is required."
      )
      .max(300),

    specimenType: z
      .string()
      .trim()
      .min(
        2,
        "Specimen type is required."
      )
      .max(200),

    collectionReference: z
      .string()
      .trim()
      .max(300),

    resultItems: z
      .array(
        laboratoryResultItemSchema
      )
      .min(
        1,
        "Add at least one result item."
      )
      .max(100),

    interpretation: z
      .string()
      .trim()
      .max(4000),

    notes: z
      .string()
      .trim()
      .max(4000),
  })

export type LaboratoryResultDraftValues =
  z.infer<
    typeof laboratoryResultDraftSchema
  >

export const laboratoryResultDocumentActionSchema =
  z.object({
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(200),

    documentId: z
      .string()
      .uuid(),
  })

export type LaboratoryResultDocumentActionValues =
  z.infer<
    typeof laboratoryResultDocumentActionSchema
  >

export const laboratoryResultReturnSchema =
  laboratoryResultDocumentActionSchema.extend({
    correctionReason: z
      .string()
      .trim()
      .min(
        3,
        "Correction reason must contain at least three characters."
      )
      .max(2000),
  })

export type LaboratoryResultReturnValues =
  z.infer<
    typeof laboratoryResultReturnSchema
  >

export const laboratoryResultFinalizeSchema =
  laboratoryResultDocumentActionSchema.extend({
    verificationNotes: z
      .string()
      .trim()
      .max(2000),
  })

export type LaboratoryResultFinalizeValues =
  z.infer<
    typeof laboratoryResultFinalizeSchema
  >
