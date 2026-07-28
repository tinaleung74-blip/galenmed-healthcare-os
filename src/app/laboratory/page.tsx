import { FlaskConical } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Laboratory"
      description="Manage laboratory requests, specimens, processing, and results."
      icon={FlaskConical}
    />
  )
}
