import { Users } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Patients"
      description="Register patients and manage demographic and medical information."
      icon={Users}
    />
  )
}
