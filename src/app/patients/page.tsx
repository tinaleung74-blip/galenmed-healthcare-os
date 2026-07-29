import { PatientListPage } from "@/features/patients/components/patient-list-page"

interface PatientsPageProps {
  searchParams: Promise<{
    search?: string | string[]
  }>
}

export default async function PatientsPage({
  searchParams,
}: PatientsPageProps) {
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search

  const initialSearch = (
    Array.isArray(searchValue)
      ? searchValue[0] ?? ""
      : searchValue ?? ""
  ).slice(0, 200)

  return (
    <PatientListPage initialSearch={initialSearch} />
  )
}
