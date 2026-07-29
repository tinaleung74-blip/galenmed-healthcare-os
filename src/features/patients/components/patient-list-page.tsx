import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PatientRegistry } from "@/features/patients/components/patient-registry"

interface PatientListPageProps {
  initialSearch?: string
}

export function PatientListPage({
  initialSearch = "",
}: PatientListPageProps) {
  return (
    <DashboardLayout>
      <PatientRegistry initialSearch={initialSearch} />
    </DashboardLayout>
  )
}
