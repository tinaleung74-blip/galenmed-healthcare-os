import type {
  Metadata,
} from "next"

import {
  PatientDocumentWorkspace,
} from "@/features/patient-portal/components/patient-document-workspace"
import {
  getPatientPortalReleasedDocumentsPageData,
} from "@/features/patient-portal/utils/patient-portal-records.server"

export const metadata: Metadata = {
  title:
    "Released Prescriptions | GalenMed",

  description:
    "Patient access to released GalenMed prescriptions.",
}

export default async function PatientPrescriptionsPage() {
  const {
    context,
    data,
  } =
    await getPatientPortalReleasedDocumentsPageData(
      "prescription"
    )

  return (
    <PatientDocumentWorkspace
      context={context}
      title="Released Prescriptions"
      description="View prescriptions that were finalized, payment-cleared when required, and formally released by GalenMed."
      documents={
        data.documents
      }
    />
  )
}
