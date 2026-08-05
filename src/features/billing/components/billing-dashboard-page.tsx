import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { BillingDashboardWorkspace } from "@/features/billing/components/billing-dashboard-workspace"

export function BillingDashboardPage() {
  return (
    <DashboardLayout>
      <BillingDashboardWorkspace />
    </DashboardLayout>
  )
}
