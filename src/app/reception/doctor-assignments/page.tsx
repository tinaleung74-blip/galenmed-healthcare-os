import type {
  Metadata,
} from "next"

import {
  ReceptionDoctorAssignmentWorkspace,
} from "@/features/hospital-operations/components/reception-doctor-assignment-workspace"
import {
  getReceptionDoctorAssignmentPageData,
} from "@/features/hospital-operations/utils/doctor-consultation.server"

export const metadata: Metadata = {
  title:
    "Doctor Assignment | GalenMed",
  description:
    "Assign consultation service requests to active GalenMed Doctors.",
}

export default async function ReceptionDoctorAssignmentsPage() {
  const {
    context,
    data,
  } =
    await getReceptionDoctorAssignmentPageData()

  return (
    <ReceptionDoctorAssignmentWorkspace
      context={context}
      data={data}
    />
  )
}
