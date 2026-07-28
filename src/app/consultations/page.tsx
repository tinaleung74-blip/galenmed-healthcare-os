import { Stethoscope } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Consultations"
      description="Manage clinical encounters, assessments, diagnoses, and treatment plans."
      icon={Stethoscope}
    />
  )
}
