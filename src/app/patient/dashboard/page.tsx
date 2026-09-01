import type {
  Metadata,
} from "next"

import {
  PatientPortalDashboard,
} from "@/features/patient-portal/components/patient-portal-dashboard"
import {
  getPatientPortalDashboardPageData,
} from "@/features/patient-portal/utils/patient-portal-records.server"

export const metadata: Metadata = {
  title:
    "Patient Dashboard | GalenMed",

  description:
    "Secure GalenMed Patient Portal dashboard.",
}

export default async function PatientDashboardPage() {
  const {
    context,
    data,
  } =
    await getPatientPortalDashboardPageData()

  return (
    <PatientPortalDashboard
      context={context}
      data={data}
    />
  )
}
