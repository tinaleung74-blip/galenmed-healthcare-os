import {
  ArrowRight,
  FileText,
  ShieldCheck,
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
  PatientPortalReleasedDocument,
} from "@/features/patient-portal/types/patient-portal-records.types"
import {
  getPatientPortalFullName,
} from "@/features/patient-portal/utils/patient-portal.utils"
import {
  formatPatientPortalRecordDateTime,
  getPatientPortalDocumentTypeLabel,
  formatPatientPortalStatus,
} from "@/features/patient-portal/utils/patient-portal-records.utils"

interface PatientDocumentWorkspaceProps {
  context:
    PatientPortalContext

  title:
    string

  description:
    string

  documents:
    PatientPortalReleasedDocument[]
}

export function PatientDocumentWorkspace({
  context,
  title,
  description,
  documents,
}: PatientDocumentWorkspaceProps) {
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
            Released patient records
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {title}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </section>

        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-teal-700"
              aria-hidden="true"
            />

            <p className="text-sm leading-6 text-teal-900">
              Showing records for{" "}
              <strong>
                {patientName}
              </strong>{" "}
              —{" "}
              {
                context.patient
                  .medicalRecordNumber
              }.
              Draft, unpaid, unreleased,
              and restricted records are
              excluded.
            </p>
          </div>
        </div>

        {documents.length > 0 ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {documents.map(
              (document) => (
                <Card
                  key={document.id}
                  className="shadow-none"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <FileText
                          className="size-5"
                          aria-hidden="true"
                        />
                      </div>

                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        Released
                      </span>
                    </div>

                    <h2 className="mt-5 text-lg font-semibold">
                      {document.title}
                    </h2>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Document
                        </p>

                        <p className="mt-1 font-mono font-semibold">
                          {
                            document.documentNumber
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Type
                        </p>

                        <p className="mt-1 font-semibold">
                          {
                            getPatientPortalDocumentTypeLabel(
                              document.documentType
                            )
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Released
                        </p>

                        <p className="mt-1 font-semibold">
                          {
                            formatPatientPortalRecordDateTime(
                              document.releasedAt
                            )
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Payment
                        </p>

                        <p className="mt-1 font-semibold">
                          {
                            formatPatientPortalStatus(
                              document.paymentStatus
                            )
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Visit
                        </p>

                        <p className="mt-1 font-mono font-semibold">
                          {
                            document.visitNumber
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Branch
                        </p>

                        <p className="mt-1 font-semibold">
                          {
                            document.branchName
                          }
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/patient/documents/${document.id}/print`}
                      className="mt-6 flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-sm font-semibold text-teal-900 transition-colors hover:bg-teal-100"
                    >
                      Open printable copy

                      <ArrowRight
                        className="size-4"
                        aria-hidden="true"
                      />
                    </Link>
                  </CardContent>
                </Card>
              )
            )}
          </section>
        ) : (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <FileText
                className="size-9 text-slate-400"
                aria-hidden="true"
              />

              <h2 className="mt-4 font-semibold">
                No released records yet
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                A record appears only after
                clinical finalization,
                payment clearance when
                required, and formal
                Reception release.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
