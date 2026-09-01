import type {
  Metadata,
} from "next"

import {
  PatientResetPasswordForm,
} from "@/features/patient-portal/components/patient-reset-password-form"

export const metadata: Metadata = {
  title:
    "Reset Patient Portal Password | GalenMed",

  description:
    "Secure GalenMed Patient Portal password recovery.",
}

export default function PatientResetPasswordPage() {
  return (
    <PatientResetPasswordForm />
  )
}
