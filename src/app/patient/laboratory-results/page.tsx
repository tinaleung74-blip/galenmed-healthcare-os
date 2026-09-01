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
    "Released Laboratory Results | GalenMed",

  description:
    "Patient access to released GalenMed laboratory results.",
}

export default async function PatientLaboratoryResultsPage() {
  const {
    context,
    data,
  } =
    await getPatientPortalReleasedDocumentsPageData(
      "laboratory_result"
    )

  return (
    <PatientDocumentWorkspace
      context={context}
      title="Released Laboratory Results"
      description="View verified laboratory results that were payment-cleared when required and formally released by GalenMed."
      documents={
        data.documents
      }
    />
  )
}
