import type {
  Metadata,
} from "next"

import {
  LaboratoryQueueWorkspace,
} from "@/features/hospital-operations/components/laboratory-queue-workspace"
import {
  getLaboratoryQueuePageData,
} from "@/features/hospital-operations/utils/laboratory-queue.server"

export const metadata: Metadata = {
  title:
    "Laboratory Queue | GalenMed",
  description:
    "Protected GalenMed Laboratory patient queue and requested-test workspace.",
}

export default async function LaboratoryQueuePage() {
  const {
    context,
    data,
  } =
    await getLaboratoryQueuePageData()

  return (
    <LaboratoryQueueWorkspace
      context={context}
      data={data}
    />
  )
}
