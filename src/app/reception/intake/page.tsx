import type {
  Metadata,
} from "next"

import {
  ReceptionIntakeWorkspace,
} from "@/features/hospital-operations/components/reception-intake-workspace"
import {
  getReceptionIntakePageData,
} from "@/features/hospital-operations/utils/reception-intake.server"

export const metadata: Metadata = {
  title:
    "Reception Intake | GalenMed",
  description:
    "Register patients, create visits, and route approved hospital services.",
}

export default async function ReceptionIntakePage() {
  const {
    context,
    data,
  } =
    await getReceptionIntakePageData()

  return (
    <ReceptionIntakeWorkspace
      context={context}
      data={data}
    />
  )
}
