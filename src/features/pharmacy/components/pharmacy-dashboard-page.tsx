import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PharmacyDashboardWorkspace } from "@/features/pharmacy/components/pharmacy-dashboard-workspace"

export function PharmacyDashboardPage() {
  return (
    <DashboardLayout>
      <PharmacyDashboardWorkspace />
    </DashboardLayout>
  )
}
