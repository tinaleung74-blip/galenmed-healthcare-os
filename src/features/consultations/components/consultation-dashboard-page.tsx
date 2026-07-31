import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ConsultationQueueWorkspace } from "@/features/consultations/components/consultation-queue-workspace"

export function ConsultationDashboardPage() {
  return (
    <DashboardLayout>
      <ConsultationQueueWorkspace />
    </DashboardLayout>
  )
}
