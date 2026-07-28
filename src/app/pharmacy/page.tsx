import { Pill } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Pharmacy"
      description="Manage prescriptions, dispensing, medicines, and inventory."
      icon={Pill}
    />
  )
}
