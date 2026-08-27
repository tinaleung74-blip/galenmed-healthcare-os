import type {
  Metadata,
} from "next"

import {
  DoctorQueueWorkspace,
} from "@/features/hospital-operations/components/doctor-queue-workspace"
import {
  getDoctorQueuePageData,
} from "@/features/hospital-operations/utils/doctor-consultation.server"

export const metadata: Metadata = {
  title:
    "Assigned Patient Queue | GalenMed",
  description:
    "Doctor-only consultation queue for assigned GalenMed patients.",
}

export default async function DoctorQueuePage() {
  const {
    context,
    queue,
  } =
    await getDoctorQueuePageData()

  return (
    <DoctorQueueWorkspace
      context={context}
      queue={queue}
    />
  )
}
