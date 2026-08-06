import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { SettingsDashboardWorkspace } from "@/features/settings/components/settings-dashboard-workspace"

export function SettingsDashboardPage() {
  return (
    <DashboardLayout>
      <SettingsDashboardWorkspace />
    </DashboardLayout>
  )
}
