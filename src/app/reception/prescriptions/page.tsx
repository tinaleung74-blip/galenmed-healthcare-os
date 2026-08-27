import type { Metadata } from "next"
import { ReceptionPrescriptionReviewWorkspace } from "@/features/hospital-operations/components/reception-prescription-review-workspace"
import { getReceptionPrescriptionReviewPageData } from "@/features/hospital-operations/utils/doctor-prescription.server"

export const metadata: Metadata = { title: "Prescription Review | GalenMed", description: "Reception prescription review and controlled release approval." }
export default async function Page() {
  const { context, records } = await getReceptionPrescriptionReviewPageData()
  return <ReceptionPrescriptionReviewWorkspace context={context} records={records} />
}
