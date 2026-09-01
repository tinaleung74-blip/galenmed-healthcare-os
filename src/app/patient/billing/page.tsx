import type {
  Metadata,
} from "next"

import {
  PatientBillingWorkspace,
} from "@/features/patient-portal/components/patient-billing-workspace"
import {
  getPatientPortalBillingPageData,
} from "@/features/patient-portal/utils/patient-portal-records.server"

export const metadata: Metadata = {
  title:
    "Billing and Payments | GalenMed",

  description:
    "Read-only GalenMed Patient Portal billing and payment status.",
}

export default async function PatientBillingPage() {
  const {
    context,
    data,
  } =
    await getPatientPortalBillingPageData()

  return (
    <PatientBillingWorkspace
      context={context}
      data={data}
    />
  )
}
