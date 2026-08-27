import type {
  Metadata,
} from "next"

import {
  ReceptionReleaseWorkspace,
} from "@/features/hospital-operations/components/reception-release-workspace"
import {
  getReceptionReleaseCenterPageData,
} from "@/features/hospital-operations/utils/reception-release.server"

export const metadata: Metadata = {
  title:
    "Document Release Center | GalenMed",
  description:
    "Clinically finalized and payment-controlled GalenMed document release workspace.",
}

export default async function ReceptionReleaseCenterPage() {
  const {
    context,
    data,
  } =
    await getReceptionReleaseCenterPageData()

  return (
    <ReceptionReleaseWorkspace
      context={context}
      data={data}
    />
  )
}
