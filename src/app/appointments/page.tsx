import { CalendarDays } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Appointments"
      description="Schedule and manage patient appointments and provider availability."
      icon={CalendarDays}
    />
  )
}
