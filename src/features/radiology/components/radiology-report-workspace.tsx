"use client"

import {
  useState,
} from "react"
import {
  AlertTriangle,
  BadgeCheck,
  FilePenLine,
  FileText,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  RadiologyFindingLevelBadge,
  RadiologyReportStatusBadge,
} from "@/features/radiology/components/radiology-report-badges"
import { RadiologyReportFormDialog } from "@/features/radiology/components/radiology-report-form-dialog"
import { RadiologyReportReleaseDialog } from "@/features/radiology/components/radiology-report-release-dialog"
import { RadiologyReportVerificationDialog } from "@/features/radiology/components/radiology-report-verification-dialog"
import {
  RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS,
  RADIOLOGY_REPORT_SYNTHETIC_NOTICE,
} from "@/features/radiology/constants/radiology-report.constants"
import {
  useRadiologyReports,
} from "@/features/radiology/providers/radiology-report-provider"
import type {
  RadiologyReportFormValues,
  RadiologyReportReleaseValues,
  RadiologyReportVerificationValues,
} from "@/features/radiology/schemas/radiology-report.schema"
import type {
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface RadiologyReportWorkspaceProps {
  order: RadiologyOrder
}

export function RadiologyReportWorkspace({
  order,
}: RadiologyReportWorkspaceProps) {
  const {
    reports,
    saveRadiologyReportDraft,
    verifyRadiologyReport,
    releaseRadiologyReport,
  } = useRadiologyReports()

  const [
    isReportDialogOpen,
    setIsReportDialogOpen,
  ] = useState(false)

  const [
    isVerificationDialogOpen,
    setIsVerificationDialogOpen,
  ] = useState(false)

  const [
    isReleaseDialogOpen,
    setIsReleaseDialogOpen,
  ] = useState(false)

  const report =
    reports.find(
      (candidateReport) =>
        candidateReport.orderId ===
        order.id
    ) ?? null

  const canCreateReport =
    !report &&
    order.status ===
      "technically-completed"

  const canEditDraft =
    report?.status === "draft"

  const canVerify =
    report?.status === "draft"

  const canRelease =
    report?.status === "verified"

  async function handleSaveReport(
    values:
      RadiologyReportFormValues
  ) {
    const savedReport =
      saveRadiologyReportDraft(
        order.id,
        values
      )

    toast.success(
      "Radiology report draft saved",
      {
        description: `${savedReport.procedureName} report version ${savedReport.version} was saved.`,
      }
    )
  }

  async function handleVerifyReport(
    values:
      RadiologyReportVerificationValues
  ) {
    if (!report) {
      throw new Error(
        "No radiology report was selected."
      )
    }

    const verifiedReport =
      verifyRadiologyReport(
        report.id,
        values
      )

    toast.success(
      "Radiology report verified",
      {
        description: `${verifiedReport.procedureName} was verified by the radiologist.`,
      }
    )
  }

  async function handleReleaseReport(
    values:
      RadiologyReportReleaseValues
  ) {
    if (!report) {
      throw new Error(
        "No radiology report was selected."
      )
    }

    const releasedReport =
      releaseRadiologyReport(
        report.id,
        values
      )

    toast.success(
      "Final radiology report released",
      {
        description: `${releasedReport.procedureName} is now released and read-only.`,
      }
    )
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
              <FileText
                className="size-4"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Radiologist Report
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Document findings, impression,
                verification, critical
                communication, and final
                release.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canCreateReport ? (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setIsReportDialogOpen(
                    true
                  )
                }
              >
                <FilePenLine
                  aria-hidden="true"
                />
                Create report draft
              </Button>
            ) : null}

            {canEditDraft ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setIsReportDialogOpen(
                    true
                  )
                }
              >
                <FilePenLine
                  aria-hidden="true"
                />
                Edit draft
              </Button>
            ) : null}

            {canVerify ? (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={() =>
                  setIsVerificationDialogOpen(
                    true
                  )
                }
              >
                <BadgeCheck
                  aria-hidden="true"
                />
                Verify report
              </Button>
            ) : null}

            {canRelease ? (
              <Button
                type="button"
                size="sm"
                className="bg-teal-700 text-white hover:bg-teal-800"
                onClick={() =>
                  setIsReleaseDialogOpen(
                    true
                  )
                }
              >
                <Send aria-hidden="true" />
                Release report
              </Button>
            ) : null}
          </div>
        </div>

        {!report ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <FileText
              className="mx-auto size-7 text-muted-foreground"
              aria-hidden="true"
            />

            <p className="mt-3 text-sm font-medium">
              No radiology report draft
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {order.status ===
              "technically-completed"
                ? "The imaging study is technically complete and ready for radiologist reporting."
                : "Reporting becomes available after technical completion."}
            </p>
          </div>
        ) : (
          <article className="overflow-hidden rounded-xl border">
            <div className="flex flex-col gap-3 border-b bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {report.procedureName}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Version {report.version}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <RadiologyReportStatusBadge
                  status={report.status}
                />

                <RadiologyFindingLevelBadge
                  findingLevel={
                    report.findingLevel
                  }
                />

                {report.status ===
                "released" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                    <LockKeyhole
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    Read-only
                  </span>
                ) : null}
              </div>
            </div>

            {report.findingLevel ===
            "critical" ? (
              <div className="flex items-start gap-2 border-b border-rose-200 bg-rose-50 p-4 text-rose-800">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-sm font-semibold">
                    Critical finding
                  </p>

                  <p className="mt-1 text-sm">
                    {
                      report.criticalFindingSummary
                    }
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-5 p-4">
              <section>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Findings
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {report.findings}
                </p>
              </section>

              <section>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Impression
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed">
                  {report.impression}
                </p>
              </section>

              <section>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recommendation
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {report.recommendation ??
                    "No recommendation recorded."}
                </p>
              </section>

              {report
                .criticalCommunicatedAt ? (
                <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-800">
                    Critical communication
                  </p>

                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-rose-700">
                        Communicated at
                      </dt>

                      <dd className="mt-1">
                        {formatPatientDateTime(
                          report
                            .criticalCommunicatedAt
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-rose-700">
                        Method
                      </dt>

                      <dd className="mt-1">
                        {report
                          .criticalCommunicationMethod
                          ? RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS[
                              report
                                .criticalCommunicationMethod
                            ]
                          : "Not recorded"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-rose-700">
                        Communicated by
                      </dt>

                      <dd className="mt-1">
                        {report
                          .criticalCommunicatedBy ??
                          "Not recorded"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-rose-700">
                        Communicated to
                      </dt>

                      <dd className="mt-1">
                        {report
                          .criticalCommunicatedTo ??
                          "Not recorded"}
                      </dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              <dl className="grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Drafted by
                  </dt>

                  <dd className="mt-1">
                    {report.draftedBy}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Drafted at
                  </dt>

                  <dd className="mt-1">
                    {formatPatientDateTime(
                      report.draftedAt
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Verified by
                  </dt>

                  <dd className="mt-1">
                    {report.verifiedBy ??
                      "Not verified"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Verified at
                  </dt>

                  <dd className="mt-1">
                    {formatPatientDateTime(
                      report.verifiedAt
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Released by
                  </dt>

                  <dd className="mt-1">
                    {report.releasedBy ??
                      "Not released"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Released at
                  </dt>

                  <dd className="mt-1">
                    {formatPatientDateTime(
                      report.releasedAt
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            {
              RADIOLOGY_REPORT_SYNTHETIC_NOTICE
            }
          </p>
        </div>
      </section>

      <RadiologyReportFormDialog
        order={
          isReportDialogOpen
            ? order
            : null
        }
        report={report}
        open={isReportDialogOpen}
        onOpenChange={
          setIsReportDialogOpen
        }
        onSaveReport={
          handleSaveReport
        }
      />

      <RadiologyReportVerificationDialog
        report={report}
        open={
          isVerificationDialogOpen
        }
        onOpenChange={
          setIsVerificationDialogOpen
        }
        onSubmitVerification={
          handleVerifyReport
        }
      />

      <RadiologyReportReleaseDialog
        report={report}
        open={
          isReleaseDialogOpen
        }
        onOpenChange={
          setIsReleaseDialogOpen
        }
        onSubmitRelease={
          handleReleaseReport
        }
      />
    </>
  )
}
