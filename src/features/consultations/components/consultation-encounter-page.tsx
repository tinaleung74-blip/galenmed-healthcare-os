import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ConsultationEncounterWorkspace } from "@/features/consultations/components/consultation-encounter-workspace"

interface ConsultationEncounterPageProps {
  consultationReference: string
}

export function ConsultationEncounterPage({
  consultationReference,
}: ConsultationEncounterPageProps) {
  return (
    <DashboardLayout>
      <ConsultationEncounterWorkspace
        consultationReference={
          consultationReference
        }
      />
    </DashboardLayout>
  )
}
