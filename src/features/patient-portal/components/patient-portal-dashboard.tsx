import {
  ArrowRight,
  Building2,
  FileText,
  FlaskConical,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import Link from "next/link"

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
import type {
  PatientPortalDashboardData,
} from "@/features/patient-portal/types/patient-portal-records.types"
import {
  getPatientPortalFullName,
} from "@/features/patient-portal/utils/patient-portal.utils"
import {
  formatPatientPortalMoney,
  formatPatientPortalRecordDateTime,
  getPatientPortalDocumentTypeLabel,
} from "@/features/patient-portal/utils/patient-portal-records.utils"

interface PatientPortalDashboardProps {
  context:
    PatientPortalContext

  data:
    PatientPortalDashboardData
}

export function PatientPortalDashboard({
  context,
  data,
}: PatientPortalDashboardProps) {
  const patientName =
    getPatientPortalFullName(
      context.patient
    )

  return (
    <main className="min-h-screen bg-slate-50">
      <PatientPortalHeader />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-teal-700">
            Secure patient workspace
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Welcome, {patientName}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View only records released
            to your verified GalenMed
            patient identity.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UserRound
                className="size-5 text-sky-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Medical record number
                </p>

                <p className="mt-1 font-mono font-semibold">
                  {
                    context.patient
                      .medicalRecordNumber
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Building2
                className="size-5 text-emerald-700"
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
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <ShieldCheck
                className="size-5 text-teal-700"
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
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Outstanding balance
              </p>

              <p className="mt-1 text-xl font-semibold">
                {
                  formatPatientPortalMoney(
                    data.outstandingBalanceCentavos
                  )
                }
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {
                  data.openBillingAccountsCount
                } open account(s)
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <Link
            href="/patient/prescriptions"
            className="group rounded-xl border bg-white p-6 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <FileText
                  className="size-6 text-teal-700"
                  aria-hidden="true"
                />

                <h2 className="mt-4 font-semibold">
                  Released prescriptions
                </h2>

                <p className="mt-2 text-3xl font-semibold">
                  {
                    data.releasedPrescriptionsCount
                  }
                </p>
              </div>

              <ArrowRight
                className="size-5 text-teal-700 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>

          <Link
            href="/patient/laboratory-results"
            className="group rounded-xl border bg-white p-6 transition-colors hover:border-sky-300 hover:bg-sky-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <FlaskConical
                  className="size-6 text-sky-700"
                  aria-hidden="true"
                />

                <h2 className="mt-4 font-semibold">
                  Released laboratory results
                </h2>

                <p className="mt-2 text-3xl font-semibold">
                  {
                    data.releasedLaboratoryResultsCount
                  }
                </p>
              </div>

              <ArrowRight
                className="size-5 text-sky-700 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>

          <Link
            href="/patient/billing"
            className="group rounded-xl border bg-white p-6 transition-colors hover:border-violet-300 hover:bg-violet-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <ReceiptText
                  className="size-6 text-violet-700"
                  aria-hidden="true"
                />

                <h2 className="mt-4 font-semibold">
                  Billing and payments
                </h2>

                <p className="mt-2 text-2xl font-semibold">
                  {
                    formatPatientPortalMoney(
                      data.outstandingBalanceCentavos
                    )
                  }
                </p>
              </div>

              <ArrowRight
                className="size-5 text-violet-700 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>
        </section>

        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">
              Recently released documents
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Draft, unpaid, unreleased,
              and restricted records never
              appear here.
            </p>

            {data.recentDocuments.length >
            0 ? (
              <div className="mt-5 divide-y rounded-xl border">
                {data.recentDocuments.map(
                  (document) => (
                    <Link
                      key={document.id}
                      href={`/patient/documents/${document.id}/print`}
                      className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold">
                          {
                            document.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            getPatientPortalDocumentTypeLabel(
                              document.documentType
                            )
                          }{" "}
                          ·{" "}
                          {
                            document.documentNumber
                          }{" "}
                          ·{" "}
                          {
                            formatPatientPortalRecordDateTime(
                              document.releasedAt
                            )
                          }
                        </p>
                      </div>

                      <ArrowRight
                        className="size-4 shrink-0 text-teal-700"
                        aria-hidden="true"
                      />
                    </Link>
                  )
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed p-8 text-center">
                <p className="font-semibold">
                  No released documents yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Records appear only after
                  clinical finalization,
                  payment clearance when
                  required, and formal
                  Reception release.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
