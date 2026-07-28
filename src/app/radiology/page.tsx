import { ScanLine } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Radiology"
      description="Manage imaging requests, schedules, reports, and diagnostic results."
      icon={ScanLine}
    />
  )
}
