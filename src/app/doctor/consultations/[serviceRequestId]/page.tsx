import type {
  Metadata,
} from "next"

import {
  DoctorConsultationWorkspace,
} from "@/features/hospital-operations/components/doctor-consultation-workspace"
import {
  getDoctorConsultationPageData,
} from "@/features/hospital-operations/utils/doctor-consultation.server"

interface DoctorConsultationPageProps {
  params: Promise<{
    serviceRequestId: string
  }>
}

export const metadata: Metadata = {
  title:
    "Doctor Consultation | GalenMed",
  description:
    "Assigned patient clinical consultation workspace.",
}

export default async function DoctorConsultationPage({
  params,
}: DoctorConsultationPageProps) {
  const {
    serviceRequestId,
  } = await params

  const {
    context,
    data,
  } =
    await getDoctorConsultationPageData(
      serviceRequestId
    )

  return (
    <DoctorConsultationWorkspace
      context={context}
      data={data}
    />
  )
}
