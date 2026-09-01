import type {
  Metadata,
} from "next"

import {
  PatientChangePasswordForm,
} from "@/features/patient-portal/components/patient-change-password-form"
import {
  requirePatientPasswordChange,
} from "@/features/patient-portal/utils/patient-auth.server"

export const metadata: Metadata = {
  title:
    "Create Patient Portal Password | GalenMed",
  description:
    "Required first-login password change for GalenMed Patient Portal accounts.",
}

export default async function PatientChangePasswordPage() {
  const context =
    await requirePatientPasswordChange()

  return (
    <PatientChangePasswordForm
      context={context}
    />
  )
}
