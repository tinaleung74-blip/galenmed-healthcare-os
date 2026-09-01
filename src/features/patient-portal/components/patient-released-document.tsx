import {
  ArrowLeft,
  FlaskConical,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"

import {
  GalenMedLogo,
} from "@/components/brand/galenmed-logo"
import {
  buttonVariants,
} from "@/components/ui/button"
import {
  PatientPrintButton,
} from "@/features/patient-portal/components/patient-print-button"
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
  formatPatientPortalStatus,
  getPatientPortalDocumentTypeLabel,
} from "@/features/patient-portal/utils/patient-portal-records.utils"
import {
  cn,
} from "@/lib/utils"

interface PatientReleasedDocumentProps {
  context:
    PatientPortalContext

  document:
    PatientPortalReleasedDocument
}

export function PatientReleasedDocument({
  context,
  document,
}: PatientReleasedDocumentProps) {
  const patientName =
    getPatientPortalFullName(
      context.patient
    )

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link
          href={
            document.documentType ===
            "prescription"
              ? "/patient/prescriptions"
              : document.documentType ===
                  "laboratory_result"
                ? "/patient/laboratory-results"
                : "/patient/dashboard"
          }
          className={cn(
            buttonVariants({
              variant:
                "outline",
            })
          )}
        >
          <ArrowLeft
            aria-hidden="true"
          />
          Back to records
        </Link>

        <PatientPrintButton
          documentId={
            document.id
          }
        />
      </div>

      <article className="mx-auto max-w-4xl bg-white p-8 shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <header className="flex items-start justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-4">
            <GalenMedLogo
              size="lg"
              priority
              className="rounded-2xl bg-white p-1 ring-1 ring-slate-200"
            />

            <div>
              <p className="text-xl font-semibold">
                GalenMed
              </p>

              <p className="text-sm text-muted-foreground">
                {
                  getPatientPortalDocumentTypeLabel(
                    document.documentType
                  )
                }
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <p className="font-mono font-semibold">
              {
                document.documentNumber
              }
            </p>

            <p className="mt-1 text-muted-foreground">
              Version{" "}
              {
                document.versionNumber
              }
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 border-b pb-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Patient
            </p>

            <p className="mt-1 font-semibold">
              {patientName}
            </p>
          </div>

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
              Release reference
            </p>

            <p className="mt-1 font-mono font-semibold">
              {
                document.releaseNumber
              }
            </p>
          </div>
        </section>

        <section className="py-8">
          <h1 className="text-2xl font-semibold">
            {document.title}
          </h1>

          {document.content.kind ===
          "prescription" ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Diagnosis
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      document.content
                        .diagnosisText ??
                      "Not recorded"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Prescribing Doctor
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      document.content
                        .doctor
                        .fullName ??
                      "Not recorded"
                    }
                  </p>

                  {document.content
                    .doctor
                    .jobTitle ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {
                        document.content
                          .doctor
                          .jobTitle
                      }
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs">
                    <tr>
                      <th className="px-4 py-3">
                        Medicine
                      </th>
                      <th className="px-4 py-3">
                        Strength
                      </th>
                      <th className="px-4 py-3">
                        Dose / Route
                      </th>
                      <th className="px-4 py-3">
                        Frequency
                      </th>
                      <th className="px-4 py-3">
                        Duration
                      </th>
                      <th className="px-4 py-3">
                        Quantity
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {
                      document.content.items.map(
                        (item) => (
                          <tr
                            key={
                              item.id ??
                              item.sequence
                            }
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold">
                                {
                                  item.genericName
                                }
                              </p>

                              {item.brandName ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {
                                    item.brandName
                                  }
                                </p>
                              ) : null}

                              {item.instructions ? (
                                <p className="mt-2 text-xs">
                                  {
                                    item.instructions
                                  }
                                </p>
                              ) : null}
                            </td>

                            <td className="px-4 py-3">
                              {
                                item.strength
                              }{" "}
                              {
                                item.dosageForm
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                item.dose
                              }{" "}
                              ·{" "}
                              {
                                item.route
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                item.frequency
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                item.duration
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                item.quantity
                              }{" "}
                              {
                                item.quantityUnit
                              }
                            </td>
                          </tr>
                        )
                      )
                    }
                  </tbody>
                </table>
              </div>

              {document.content
                .generalInstructions ? (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    General instructions
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {
                      document.content
                        .generalInstructions
                    }
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {document.content.kind ===
          "laboratory_result" ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Specimen type
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      document.content
                        .specimenType ??
                      "Not recorded"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Collection reference
                  </p>

                  <p className="mt-1 font-mono font-semibold">
                    {
                      document.content
                        .collectionReference ??
                      "Not recorded"
                    }
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs">
                    <tr>
                      <th className="px-4 py-3">
                        Test
                      </th>
                      <th className="px-4 py-3">
                        Result
                      </th>
                      <th className="px-4 py-3">
                        Unit
                      </th>
                      <th className="px-4 py-3">
                        Reference
                      </th>
                      <th className="px-4 py-3">
                        Flag
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {
                      document.content
                        .resultItems
                        .map(
                          (
                            item,
                            index
                          ) => (
                            <tr
                              key={`${item.testName}-${index}`}
                            >
                              <td className="px-4 py-3 font-semibold">
                                {
                                  item.testName
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  item.resultValue
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  item.unit ??
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  item.referenceRange ??
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-2">
                                  <FlaskConical
                                    className="size-4"
                                    aria-hidden="true"
                                  />

                                  {
                                    formatPatientPortalStatus(
                                      item.flag
                                    )
                                  }
                                </span>
                              </td>
                            </tr>
                          )
                        )
                    }
                  </tbody>
                </table>
              </div>

              {document.content
                .interpretation ? (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Interpretation
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {
                      document.content
                        .interpretation
                    }
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {document.content.kind ===
          "generic" ? (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-7">
              {
                document.content
                  .summary ??
                "No additional patient-facing content is available."
              }
            </p>
          ) : null}
        </section>

        <footer className="border-t pt-6">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-emerald-700"
              aria-hidden="true"
            />

            <div className="text-sm text-emerald-900">
              <p className="font-semibold">
                GalenMed released copy
              </p>

              <p className="mt-1 leading-6">
                Payment status:{" "}
                <strong>
                  {
                    formatPatientPortalStatus(
                      document.paymentStatus
                    )
                  }
                </strong>.
                This document became
                available after clinical
                finalization and formal
                release.
              </p>
            </div>
          </div>
        </footer>
      </article>
    </main>
  )
}
