import "server-only"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  patientPortalManagementDataSchema,
} from "@/features/patient-portal/schemas/patient-portal.schema"
import {
  createClient,
} from "@/lib/supabase/server"

export async function getPatientPortalManagementPageData() {
  const context =
    await requireStaffRole([
      "SYSTEM_ADMIN",
      "RECEPTIONIST",
    ])

  const canView =
    context.permissions.includes(
      "patient.portal.view"
    ) ||
    context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )

  if (!canView) {
    throw new Error(
      "The current staff account cannot view Patient Portal accounts."
    )
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_patient_portal_management_data"
  )

  if (error) {
    throw new Error(
      "Unable to load Patient Portal account-management data."
    )
  }

  const parsedData =
    patientPortalManagementDataSchema.safeParse(
      data
    )

  if (!parsedData.success) {
    throw new Error(
      "The Patient Portal management response is invalid."
    )
  }

  return {
    context,
    data:
      parsedData.data,
  }
}
