"use server"

import {
  revalidatePath,
} from "next/cache"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  serviceCatalogFormSchema,
  type ServiceCatalogFormValues,
} from "@/features/hospital-operations/schemas/service-catalog.schema"
import type {
  ServiceCatalogActionResult,
} from "@/features/hospital-operations/types/service-catalog.types"
import {
  parsePhpToCentavos,
} from "@/features/hospital-operations/utils/service-catalog.utils"
import {
  createClient,
} from "@/lib/supabase/server"

export async function upsertServiceCatalogItemAction(
  values: ServiceCatalogFormValues
): Promise<ServiceCatalogActionResult> {
  const parsedValues =
    serviceCatalogFormSchema.safeParse(
      values
    )

  if (!parsedValues.success) {
    return {
      success: false,
      message:
        parsedValues.error.issues[0]
          ?.message ??
        "The service details are invalid.",
    }
  }

  await requireStaffRole([
    "SYSTEM_ADMIN",
  ])

  const input =
    parsedValues.data

  let defaultPriceCentavos:
    number

  try {
    defaultPriceCentavos =
      parsePhpToCentavos(
        input.defaultPricePhp
      )
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The default price is invalid.",
    }
  }

  const supabase =
    await createClient()

  const {
    error,
  } = await supabase.rpc(
    "admin_upsert_service_catalog_item",
    {
      p_code:
        input.code
          .trim()
          .toUpperCase(),
      p_name:
        input.name.trim(),
      p_service_type:
        input.serviceType,
      p_department_code:
        input.departmentCode
          .trim()
          .toUpperCase(),
      p_default_price_centavos:
        defaultPriceCentavos,
      p_branch_id:
        input.branchId || null,
      p_description:
        input.description || null,
      p_doctor_order_required:
        input.doctorOrderRequired,
      p_allows_patient_request:
        input.allowsPatientRequest,
      p_active:
        input.active,
      p_catalog_item_id:
        input.catalogItemId,
    }
  )

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "The service catalog item could not be saved.",
    }
  }

  revalidatePath(
    "/admin/services"
  )

  revalidatePath(
    "/admin/dashboard"
  )

  return {
    success: true,
    message:
      input.catalogItemId
        ? "Service catalog item updated successfully."
        : "Service catalog item created successfully.",
  }
}
