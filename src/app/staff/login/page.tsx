import type {
  Metadata,
} from "next"

import {
  StaffLoginForm,
} from "@/features/auth/components/staff-login-form"

export const metadata: Metadata = {
  title:
    "Staff Login | GalenMed",

  description:
    "Secure GalenMed staff authentication portal.",
}

export default function StaffLoginPage() {
  return <StaffLoginForm />
}
