import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { RadiologyDashboardWorkspace } from "@/features/radiology/components/radiology-dashboard-workspace"

export function RadiologyDashboardPage() {
  return (
    <DashboardLayout>
      <RadiologyDashboardWorkspace />
    </DashboardLayout>
  )
}
