import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ReportsDashboardWorkspace } from "@/features/reports/components/reports-dashboard-workspace"

export function ReportsDashboardPage() {
  return (
    <DashboardLayout>
      <ReportsDashboardWorkspace />
    </DashboardLayout>
  )
}
