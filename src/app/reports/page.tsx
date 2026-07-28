import { ChartNoAxesCombined } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="View operational, clinical, financial, and management reports."
      icon={ChartNoAxesCombined}
    />
  )
}
