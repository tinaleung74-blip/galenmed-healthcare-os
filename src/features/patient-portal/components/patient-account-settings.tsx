import {
  Building2,
  CalendarClock,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import Link from "next/link"

import {
  buttonVariants,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  PatientPortalHeader,
} from "@/features/patient-portal/components/patient-portal-header"
import type {
  PatientPortalContext,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  formatPatientPortalDateTime,
  getPatientPortalFullName,
} from "@/features/patient-portal/utils/patient-portal.utils"
import {
  cn,
} from "@/lib/utils"

interface PatientAccountSettingsProps {
  context:
    PatientPortalContext
}

export function PatientAccountSettings({
  context,
}: PatientAccountSettingsProps) {
  const patientName =
    getPatientPortalFullName(
      context.patient
    )

  return (
    <main className="min-h-screen bg-slate-50">
      <PatientPortalHeader />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-teal-700">
            Patient account security
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Account Settings
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Review the Patient Portal
            identity linked to your
            GalenMed medical record and
            manage your private password.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-none">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start gap-3">
                <UserRound
                  className="mt-0.5 size-5 text-sky-700"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Patient
                  </p>

                  <p className="mt-1 font-semibold">
                    {patientName}
                  </p>

                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {
                      context.patient
                        .medicalRecordNumber
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail
                  className="mt-0.5 size-5 text-violet-700"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Login email
                  </p>

                  <p className="mt-1 break-all font-semibold">
                    {
                      context.loginEmail
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2
                  className="mt-0.5 size-5 text-emerald-700"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Registered branch
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      context.branch
                        ?.name ??
                      "Not recorded"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 size-5 text-teal-700"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Portal status
                  </p>

                  <p className="mt-1 font-semibold capitalize">
                    {
                      context.accountStatus
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarClock
                  className="mt-0.5 size-5 text-amber-700"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Last recorded login
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      formatPatientPortalDateTime(
                        context.lastLoginAt
                      )
                    }
                  </p>
                </div>
              </div>

              <Link
                href="/patient/account/change-password"
                className={cn(
                  buttonVariants({
                    variant:
                      "default",
                  }),
                  "w-full"
                )}
              >
                <KeyRound
                  aria-hidden="true"
                />

                Change Patient Portal password
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="border-teal-200 bg-teal-50/60 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold text-teal-950">
              Need identity or access help?
            </h2>

            <p className="mt-2 text-sm leading-6 text-teal-900">
              Patient name, medical
              record number, linked email,
              locked access, suspension,
              and archived status can be
              changed only after review by
              authorized GalenMed staff.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
