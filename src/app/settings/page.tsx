import { Settings } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Configure facilities, users, roles, departments, and system preferences."
      icon={Settings}
    />
  )
}
