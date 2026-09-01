import type {
  Metadata,
} from "next"

import {
  PatientLoginForm,
} from "@/features/patient-portal/components/patient-login-form"

export const metadata: Metadata = {
  title:
    "Patient Login | GalenMed",
  description:
    "Secure access to the GalenMed Patient Portal.",
}

export default function PatientLoginPage() {
  return (
    <PatientLoginForm />
  )
}
