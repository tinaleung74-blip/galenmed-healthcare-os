import {
  redirect,
} from "next/navigation"

import {
  requireAnyStaff,
} from "@/features/auth/utils/staff-auth.server"
import {
  getPreferredDashboardPath,
} from "@/features/auth/utils/staff-auth.utils"

export default async function StaffEntryPage() {
  const context =
    await requireAnyStaff()

  redirect(
    getPreferredDashboardPath(
      context
    )
  )
}
