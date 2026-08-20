import type {
  Metadata,
} from "next"

import {
  StaffSelfServicePasswordForm,
} from "@/features/auth/components/staff-self-service-password-form"
import {
  requireAnyStaff,
} from "@/features/auth/utils/staff-auth.server"
import {
  getPreferredDashboardPath,
} from "@/features/auth/utils/staff-auth.utils"

export const metadata: Metadata = {
  title:
    "Change Password | GalenMed",

  description:
    "Secure self-service password change for GalenMed staff.",
}

export default async function StaffAccountChangePasswordPage() {
  const context =
    await requireAnyStaff()

  return (
    <StaffSelfServicePasswordForm
      fullName={context.fullName}
      workEmail={context.workEmail}
      dashboardPath={
        getPreferredDashboardPath(
          context
        )
      }
    />
  )
}
