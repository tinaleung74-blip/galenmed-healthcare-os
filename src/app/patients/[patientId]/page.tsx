import { PatientProfilePage } from "@/features/patients/components/patient-profile-page"
import {
  isPatientProfileSection,
  type PatientProfileSection,
} from "@/features/patients/constants/patient-profile.constants"

interface PatientProfileRouteProps {
  params: Promise<{
    patientId: string
  }>
  searchParams: Promise<{
    section?: string | string[]
  }>
}

export default async function PatientProfileRoute({
  params,
  searchParams,
}: PatientProfileRouteProps) {
  const [
    resolvedParams,
    resolvedSearchParams,
  ] = await Promise.all([params, searchParams])

  const rawSection = Array.isArray(
    resolvedSearchParams.section
  )
    ? resolvedSearchParams.section[0]
    : resolvedSearchParams.section

  const activeSection: PatientProfileSection =
    isPatientProfileSection(rawSection)
      ? rawSection
      : "overview"

  const patientReference =
    resolvedParams.patientId.slice(0, 200)

  return (
    <PatientProfilePage
      patientReference={patientReference}
      activeSection={activeSection}
    />
  )
}
