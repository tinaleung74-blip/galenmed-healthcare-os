import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { AppointmentScheduleWorkspace } from "@/features/appointments/components/appointment-schedule-workspace"

export function AppointmentDashboardPage() {
  return (
    <DashboardLayout>
      <AppointmentScheduleWorkspace />
    </DashboardLayout>
  )
}
