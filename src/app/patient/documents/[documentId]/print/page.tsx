import type {
  Metadata,
} from "next"
import {
  notFound,
} from "next/navigation"
import { z } from "zod"

import {
  PatientReleasedDocument,
} from "@/features/patient-portal/components/patient-released-document"
import {
  getPatientPortalReleasedDocumentPageData,
} from "@/features/patient-portal/utils/patient-portal-records.server"

export const metadata: Metadata = {
  title:
    "Released Patient Document | GalenMed",

  description:
    "Printable released GalenMed Patient Portal document.",
}

interface PatientDocumentPrintPageProps {
  params:
    Promise<{
      documentId: string
    }>
}

export default async function PatientDocumentPrintPage({
  params,
}: PatientDocumentPrintPageProps) {
  const {
    documentId,
  } = await params

  const parsedDocumentId =
    z
      .string()
      .uuid()
      .safeParse(
        documentId
      )

  if (
    !parsedDocumentId.success
  ) {
    notFound()
  }

  const {
    context,
    document,
  } =
    await getPatientPortalReleasedDocumentPageData(
      parsedDocumentId.data
    )

  return (
    <PatientReleasedDocument
      context={context}
      document={document}
    />
  )
}
