import "server-only"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  staffManagementDataSchema,
} from "@/features/staff/schemas/staff-management.schema"
import {
  createClient,
} from "@/lib/supabase/server"

export async function getStaffManagementPageData() {
  const context =
    await requireStaffRole([
      "SYSTEM_ADMIN",
    ])

  if (
    !context.permissions.includes(
      "staff.accounts.view"
    )
  ) {
    throw new Error(
      "The current administrator does not have permission to view staff accounts."
    )
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_staff_management_data"
  )

  if (error) {
    throw new Error(
      "Unable to load GalenMed staff management data."
    )
  }

  const parsedData =
    staffManagementDataSchema.safeParse(
      data
    )

  if (!parsedData.success) {
    throw new Error(
      "The GalenMed staff management response is invalid."
    )
  }

  return {
    context,
    data: parsedData.data,
  }
}
