import type {
  Metadata,
} from "next"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  PatientPortalHeader,
} from "@/features/patient-portal/components/patient-portal-header"
import {
  PatientSelfServicePasswordForm,
} from "@/features/patient-portal/components/patient-self-service-password-form"
import {
  requirePatientPortal,
} from "@/features/patient-portal/utils/patient-auth.server"

export const metadata: Metadata = {
  title:
    "Change Patient Portal Password | GalenMed",

  description:
    "Change the password for an authenticated GalenMed Patient Portal account.",
}

export default async function PatientAccountChangePasswordPage() {
  const context =
    await requirePatientPortal()

  return (
    <main className="min-h-screen bg-slate-50">
      <PatientPortalHeader />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="shadow-none">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Change Patient Portal password
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Create a new private
              password for your own
              GalenMed Patient Portal
              account.
            </p>

            <div className="mt-8">
              <PatientSelfServicePasswordForm
                context={
                  context
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
