import type {
  Metadata,
} from "next"

import {
  StaffChangePasswordForm,
} from "@/features/auth/components/staff-change-password-form"
import {
  requireStaffPasswordChange,
} from "@/features/auth/utils/staff-auth.server"

export const metadata: Metadata = {
  title:
    "Change Password | GalenMed",

  description:
    "Required first-login password change for GalenMed staff accounts.",
}

export default async function StaffChangePasswordPage() {
  const context =
    await requireStaffPasswordChange()

  return (
    <StaffChangePasswordForm
      fullName={context.fullName}
      workEmail={context.workEmail}
    />
  )
}
