import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PatientProfileClient } from "@/features/patients/components/patient-profile-client"
import type { PatientProfileSection } from "@/features/patients/constants/patient-profile.constants"

interface PatientProfilePageProps {
  patientReference: string
  activeSection: PatientProfileSection
}

export function PatientProfilePage({
  patientReference,
  activeSection,
}: PatientProfilePageProps) {
  return (
    <DashboardLayout>
      <PatientProfileClient
        patientReference={patientReference}
        activeSection={activeSection}
      />
    </DashboardLayout>
  )
}
