import type { Metadata } from "next"
import { DoctorPrescriptionComposer } from "@/features/hospital-operations/components/doctor-prescription-composer"
import { getDoctorPrescriptionComposerPageData } from "@/features/hospital-operations/utils/doctor-prescription.server"

interface Props { params: Promise<{ consultationId: string }> }
export const metadata: Metadata = { title: "Prescription Composer | GalenMed" }
export default async function Page({ params }: Props) {
  const { consultationId } = await params
  const { context, data } = await getDoctorPrescriptionComposerPageData(consultationId)
  return <DoctorPrescriptionComposer context={context} data={data} />
}
