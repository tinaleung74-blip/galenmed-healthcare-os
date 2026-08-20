import type {
  Metadata,
} from "next"

import {
  StaffResetPasswordForm,
} from "@/features/auth/components/staff-reset-password-form"

export const metadata: Metadata = {
  title:
    "Reset Staff Password | GalenMed",

  description:
    "Secure GalenMed staff password recovery.",
}

export default function StaffResetPasswordPage() {
  return (
    <StaffResetPasswordForm />
  )
}
