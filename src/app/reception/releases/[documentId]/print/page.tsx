import type {
  Metadata,
} from "next"

import {
  ReceptionReleaseDocument,
} from "@/features/hospital-operations/components/reception-release-document"
import {
  getReceptionReleasePrintPageData,
} from "@/features/hospital-operations/utils/reception-release.server"

export const metadata: Metadata = {
  title:
    "Clinical Document Print | GalenMed",
  description:
    "Payment-cleared GalenMed clinical document print page.",
}

interface ReceptionReleasePrintPageProps {
  params: Promise<{
    documentId: string
  }>
}

export default async function ReceptionReleasePrintPage({
  params,
}: ReceptionReleasePrintPageProps) {
  const {
    documentId,
  } = await params

  const {
    data,
  } =
    await getReceptionReleasePrintPageData(
      documentId
    )

  return (
    <ReceptionReleaseDocument
      data={data}
    />
  )
}
