"use client"

import type {
  ReactNode,
} from "react"
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  FileText,
  LockKeyhole,
  ScanLine,
  Send,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  RadiologyFindingLevelBadge,
  RadiologyReportStatusBadge,
} from "@/features/radiology/components/radiology-report-badges"
import {
  RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS,
} from "@/features/radiology/constants/radiology-report.constants"
import {
  RADIOLOGY_CONTRAST_PROTOCOL_LABELS,
  RADIOLOGY_MODALITY_LABELS,
  RADIOLOGY_ORDER_PRIORITY_LABELS,
  RADIOLOGY_ORDER_SOURCE_LABELS,
} from "@/features/radiology/constants/radiology.constants"
import {
  formatRadiologyScheduleRange,
} from "@/features/radiology/utils/radiology.utils"
import type {
  PatientReleasedRadiologyReportRecord,
} from "@/features/patients/types/patient-radiology-report.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface PatientRadiologyReportDetailsSheetProps {
  record:
    | PatientReleasedRadiologyReportRecord
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void
}

interface DetailItemProps {
  label: string
  value: ReactNode
  className?: string
}

function DetailItem({
  label,
  value,
  className,
}: DetailItemProps) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm">
        {value}
      </dd>
    </div>
  )
}

export function PatientRadiologyReportDetailsSheet({
  record,
  open,
  onOpenChange,
}: PatientRadiologyReportDetailsSheetProps) {
  if (!record) {
    return null
  }

  const {
    order,
    report,
  } = record

  const isCritical =
    report.findingLevel ===
    "critical"

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-4xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <ScanLine
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle>
                {report.procedureName}
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {order.orderNumber}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <RadiologyReportStatusBadge
                  status={report.status}
                />

                <RadiologyFindingLevelBadge
                  findingLevel={
                    report.findingLevel
                  }
                />

                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                  <LockKeyhole
                    className="size-3.5"
                    aria-hidden="true"
                  />
                  Read-only
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ScanLine
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Imaging order
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Order reference"
                value={
                  <span className="font-mono text-xs">
                    {order.orderNumber}
                  </span>
                }
              />

              <DetailItem
                label="Procedure code"
                value={
                  <span className="font-mono text-xs">
                    {order.procedureCode}
                  </span>
                }
              />

              <DetailItem
                label="Procedure"
                value={order.procedureName}
              />

              <DetailItem
                label="Modality"
                value={
                  RADIOLOGY_MODALITY_LABELS[
                    order.modality
                  ]
                }
              />

              <DetailItem
                label="Body region"
                value={order.bodyRegion}
              />

              <DetailItem
                label="Contrast protocol"
                value={
                  RADIOLOGY_CONTRAST_PROTOCOL_LABELS[
                    order.contrastProtocol
                  ]
                }
              />

              <DetailItem
                label="Priority"
                value={
                  RADIOLOGY_ORDER_PRIORITY_LABELS[
                    order.priority
                  ]
                }
              />

              <DetailItem
                label="Source"
                value={
                  RADIOLOGY_ORDER_SOURCE_LABELS[
                    order.source
                  ]
                }
              />

              <DetailItem
                label="Ordering clinician"
                value={
                  order.orderedByName
                }
              />

              <DetailItem
                label="Radiology branch"
                value={order.branchName}
              />

              <DetailItem
                label="Imaging schedule"
                className="sm:col-span-2"
                value={formatRadiologyScheduleRange(
                  order
                )}
              />

              <DetailItem
                label="Imaging room"
                value={
                  order.roomName ??
                  "Not assigned"
                }
              />

              <DetailItem
                label="Consultation reference"
                value={
                  order.consultationNumber ??
                  "Not linked"
                }
              />

              <DetailItem
                label="Clinical indication"
                className="sm:col-span-2"
                value={
                  order.clinicalIndication
                }
              />
            </dl>
          </section>

          {isCritical ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-2 text-rose-800">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />

                <div>
                  <h3 className="text-sm font-semibold">
                    Critical finding
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {
                      report.criticalFindingSummary
                    }
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Final radiology report
              </h3>
            </div>

            <div className="space-y-5 rounded-xl border p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Findings
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {report.findings}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Impression
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed">
                  {report.impression}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recommendation
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {report.recommendation ??
                    "No recommendation recorded."}
                </p>
              </div>
            </div>
          </section>

          {report.criticalCommunicatedAt ? (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                Critical-finding communication
              </h3>

              <dl className="grid gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:grid-cols-2">
                <DetailItem
                  label="Communicated at"
                  value={formatPatientDateTime(
                    report
                      .criticalCommunicatedAt
                  )}
                />

                <DetailItem
                  label="Communication method"
                  value={
                    report
                      .criticalCommunicationMethod
                      ? RADIOLOGY_CRITICAL_COMMUNICATION_METHOD_LABELS[
                          report
                            .criticalCommunicationMethod
                        ]
                      : "Not recorded"
                  }
                />

                <DetailItem
                  label="Communicated by"
                  value={
                    report
                      .criticalCommunicatedBy ??
                    "Not recorded"
                  }
                />

                <DetailItem
                  label="Communicated to"
                  value={
                    report
                      .criticalCommunicatedTo ??
                    "Not recorded"
                  }
                />

                <DetailItem
                  label="Communication note"
                  className="sm:col-span-2"
                  value={
                    report
                      .criticalCommunicationNote ??
                    "No note recorded"
                  }
                />
              </dl>
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Report lifecycle
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Drafted by"
                value={report.draftedBy}
              />

              <DetailItem
                label="Drafted at"
                value={formatPatientDateTime(
                  report.draftedAt
                )}
              />

              <DetailItem
                label="Verified by"
                value={
                  <span className="inline-flex items-center gap-2">
                    <BadgeCheck
                      className="size-3.5 text-emerald-700"
                      aria-hidden="true"
                    />

                    {report.verifiedBy ??
                      "Not recorded"}
                  </span>
                }
              />

              <DetailItem
                label="Verified at"
                value={formatPatientDateTime(
                  report.verifiedAt
                )}
              />

              <DetailItem
                label="Professional registration number"
                value={
                  report
                    .radiologistRegistrationNumber ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Verification note"
                value={
                  report.verificationNote ??
                  "No note recorded"
                }
              />

              <DetailItem
                label="Released by"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Send
                      className="size-3.5 text-teal-700"
                      aria-hidden="true"
                    />

                    {report.releasedBy ??
                      "Not recorded"}
                  </span>
                }
              />

              <DetailItem
                label="Released at"
                value={formatPatientDateTime(
                  report.releasedAt
                )}
              />

              <DetailItem
                label="Release note"
                className="sm:col-span-2"
                value={
                  report.releaseNote ??
                  "No note recorded"
                }
              />
            </dl>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-teal-800">
            <LockKeyhole
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This final report is released
              and read-only. Findings,
              impressions, clinicians,
              registration numbers, and
              timestamps remain synthetic
              development data.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
