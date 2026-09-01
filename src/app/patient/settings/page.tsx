import type {
  Metadata,
} from "next"

import {
  PatientAccountSettings,
} from "@/features/patient-portal/components/patient-account-settings"
import {
  requirePatientPortal,
} from "@/features/patient-portal/utils/patient-auth.server"

export const metadata: Metadata = {
  title:
    "Patient Portal Settings | GalenMed",

  description:
    "Secure GalenMed Patient Portal identity and account settings.",
}

export default async function PatientSettingsPage() {
  const context =
    await requirePatientPortal()

  return (
    <PatientAccountSettings
      context={context}
    />
  )
}
