import { ConsultationEncounterPage } from "@/features/consultations/components/consultation-encounter-page"

interface ConsultationEncounterRouteProps {
  params: Promise<{
    consultationId: string
  }>
}

export default async function ConsultationEncounterRoute({
  params,
}: ConsultationEncounterRouteProps) {
  const resolvedParams = await params

  const consultationReference =
    resolvedParams.consultationId.slice(
      0,
      200
    )

  return (
    <ConsultationEncounterPage
      consultationReference={
        consultationReference
      }
    />
  )
}
