import type { Metadata } from "next"
import { DoctorPrescriptionListWorkspace } from "@/features/hospital-operations/components/doctor-prescription-list-workspace"
import { getDoctorPrescriptionQueuePageData } from "@/features/hospital-operations/utils/doctor-prescription.server"

export const metadata: Metadata = { title: "Doctor Prescriptions | GalenMed", description: "Doctor prescription composer and submission queue." }

export default async function DoctorPrescriptionsPage() {
  const { context, records } = await getDoctorPrescriptionQueuePageData()
  return <DoctorPrescriptionListWorkspace context={context} records={records} />
}
