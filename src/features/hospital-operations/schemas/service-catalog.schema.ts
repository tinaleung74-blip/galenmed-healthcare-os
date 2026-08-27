import { z } from "zod"

import {
  HOSPITAL_SERVICE_TYPES,
} from "@/features/hospital-operations/types/service-catalog.types"

const pricePattern = /^\d+(?:\.\d{1,2})?$/

export const serviceCatalogFormSchema =
  z.object({
    catalogItemId: z
      .string()
      .uuid()
      .nullable(),

    code: z
      .string()
      .trim()
      .min(
        2,
        "Service code must contain at least 2 characters."
      )
      .max(
        50,
        "Service code must not exceed 50 characters."
      )
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Use letters, numbers, underscores, or hyphens only."
      ),

    name: z
      .string()
      .trim()
      .min(
        2,
        "Service name must contain at least 2 characters."
      )
      .max(
        200,
        "Service name must not exceed 200 characters."
      ),

    description: z
      .string()
      .trim()
      .max(
        1000,
        "Description must not exceed 1,000 characters."
      ),

    serviceType:
      z.enum(
        HOSPITAL_SERVICE_TYPES
      ),

    departmentCode: z
      .string()
      .trim()
      .min(
        1,
        "Department is required."
      ),

    branchId: z
      .string()
      .trim(),

    defaultPricePhp: z
      .string()
      .trim()
      .min(
        1,
        "Default price is required."
      )
      .regex(
        pricePattern,
        "Enter a valid PHP amount with no more than two decimal places."
      )
      .refine(
        (value) =>
          Number(value) <=
          100_000_000,
        "Default price is outside the supported range."
      ),

    doctorOrderRequired:
      z.boolean(),

    allowsPatientRequest:
      z.boolean(),

    active: z.boolean(),
  })

export type ServiceCatalogFormValues =
  z.infer<
    typeof serviceCatalogFormSchema
  >
