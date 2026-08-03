import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { LaboratoryDashboardWorkspace } from "@/features/laboratory/components/laboratory-dashboard-workspace"

export function LaboratoryDashboardPage() {
  return (
    <DashboardLayout>
      <LaboratoryDashboardWorkspace />
    </DashboardLayout>
  )
}
