import type {
  Metadata,
} from "next"

import {
  PatientPortalManagementWorkspace,
} from "@/features/patient-portal/components/patient-portal-management-workspace"
import {
  getPatientPortalManagementPageData,
} from "@/features/patient-portal/utils/patient-portal-management.server"

export const metadata: Metadata = {
  title:
    "Patient Portal Accounts | GalenMed",
  description:
    "Secure GalenMed Patient Portal account creation and access management.",
}

export default async function ReceptionPatientPortalAccountsPage() {
  const {
    context,
    data,
  } =
    await getPatientPortalManagementPageData()

  return (
    <PatientPortalManagementWorkspace
      context={context}
      data={data}
    />
  )
}
