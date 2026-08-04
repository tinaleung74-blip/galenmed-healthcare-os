import { z } from "zod"

import {
  LABORATORY_COLLECTION_METHODS,
  LABORATORY_SPECIMEN_TYPES,
} from "@/features/laboratory/types/laboratory.types"

function isValidDateTime(
  value: string
): boolean {
  const date = new Date(value)

  return !Number.isNaN(
    date.getTime()
  )
}

function isNotMeaningfullyFuture(
  value: string
): boolean {
  if (!isValidDateTime(value)) {
    return false
  }

  const timestamp =
    new Date(value).getTime()

  const fiveMinutesFromNow =
    Date.now() + 5 * 60 * 1000

  return (
    timestamp <= fiveMinutesFromNow
  )
}

export const laboratorySpecimenCollectionFormSchema =
  z.object({
    specimenType: z.enum(
      LABORATORY_SPECIMEN_TYPES,
      {
        required_error:
          "Specimen type is required.",
      }
    ),

    collectionMethod: z.enum(
      LABORATORY_COLLECTION_METHODS,
      {
        required_error:
          "Collection method is required.",
      }
    ),

    containerType: z
      .string()
      .trim()
      .min(
        2,
        "Specimen container is required."
      )
      .max(
        200,
        "Container description must not exceed 200 characters."
      ),

    collectedAt: z
      .string()
      .trim()
      .min(
        1,
        "Collection date and time are required."
      )
      .refine(
        isValidDateTime,
        "Enter a valid collection date and time."
      )
      .refine(
        isNotMeaningfullyFuture,
        "Collection time cannot be in the future."
      ),

    collectedBy: z
      .string()
      .trim()
      .min(
        2,
        "Collector name is required."
      )
      .max(
        200,
        "Collector name must not exceed 200 characters."
      ),

    notes: z
      .string()
      .trim()
      .max(
        1000,
        "Specimen notes must not exceed 1,000 characters."
      ),
  })

export type LaboratorySpecimenCollectionFormValues =
  z.infer<
    typeof laboratorySpecimenCollectionFormSchema
  >

export const laboratorySpecimenRejectionSchema =
  z.object({
    rejectionReason: z
      .string()
      .trim()
      .min(
        5,
        "Enter a specimen rejection reason of at least five characters."
      )
      .max(
        1000,
        "Rejection reason must not exceed 1,000 characters."
      ),
  })

export type LaboratorySpecimenRejectionValues =
  z.infer<
    typeof laboratorySpecimenRejectionSchema
  >
