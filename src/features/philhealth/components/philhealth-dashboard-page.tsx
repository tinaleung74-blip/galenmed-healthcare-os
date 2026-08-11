import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PhilHealthDashboardWorkspace } from "@/features/philhealth/components/philhealth-dashboard-workspace"

export function PhilHealthDashboardPage() {
  return (
    <DashboardLayout>
      <PhilHealthDashboardWorkspace />
    </DashboardLayout>
  )
}
