import type {
  Metadata,
} from "next"

import {
  LaboratoryResultsWorkspace,
} from "@/features/hospital-operations/components/laboratory-results-workspace"
import {
  getLaboratoryResultsPageData,
} from "@/features/hospital-operations/utils/laboratory-result.server"

export const metadata: Metadata = {
  title:
    "Laboratory Results | GalenMed",
  description:
    "Protected GalenMed Laboratory result entry, verification, and payment-aware release workspace.",
}

export default async function LaboratoryResultsPage() {
  const {
    context,
    data,
  } =
    await getLaboratoryResultsPageData()

  return (
    <LaboratoryResultsWorkspace
      context={context}
      data={data}
    />
  )
}
