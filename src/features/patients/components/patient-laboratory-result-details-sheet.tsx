"use client"

import type {
  ReactNode,
} from "react"
import {
  BadgeCheck,
  CalendarClock,
  FlaskConical,
  LockKeyhole,
  Send,
  TestTube2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LaboratoryResultFlagBadge,
  LaboratoryResultStatusBadge,
} from "@/features/laboratory/components/laboratory-result-badges"
import {
  LABORATORY_ORDER_PRIORITY_LABELS,
  LABORATORY_ORDER_SOURCE_LABELS,
  LABORATORY_SPECIMEN_TYPE_LABELS,
} from "@/features/laboratory/constants/laboratory.constants"
import type {
  LaboratoryResultEntry,
} from "@/features/laboratory/types/laboratory-result.types"
import type {
  PatientLaboratoryReleasedResultRecord,
} from "@/features/patients/types/patient-laboratory-result.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

interface PatientLaboratoryResultDetailsSheetProps {
  record:
    | PatientLaboratoryReleasedResultRecord
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void
}

interface DetailItemProps {
  label: string
  value: ReactNode
}

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm">
        {value}
      </dd>
    </div>
  )
}

function formatResultValue(
  entry: LaboratoryResultEntry
): string {
  if (
    entry.numericValue !== null
  ) {
    return `${entry.numericValue}${
      entry.unit
        ? ` ${entry.unit}`
        : ""
    }`
  }

  return (
    entry.textValue ??
    "Not recorded"
  )
}

function formatReferenceRange(
  entry: LaboratoryResultEntry
): string {
  if (entry.referenceText) {
    return entry.referenceText
  }

  if (
    entry.referenceLow !== null &&
    entry.referenceHigh !== null
  ) {
    return `${entry.referenceLow}–${entry.referenceHigh}${
      entry.unit
        ? ` ${entry.unit}`
        : ""
    }`
  }

  if (
    entry.referenceLow !== null
  ) {
    return `≥ ${entry.referenceLow}${
      entry.unit
        ? ` ${entry.unit}`
        : ""
    }`
  }

  if (
    entry.referenceHigh !== null
  ) {
    return `≤ ${entry.referenceHigh}${
      entry.unit
        ? ` ${entry.unit}`
        : ""
    }`
  }

  return "Not configured"
}

export function PatientLaboratoryResultDetailsSheet({
  record,
  open,
  onOpenChange,
}: PatientLaboratoryResultDetailsSheetProps) {
  if (!record) {
    return null
  }

  const {
    order,
    orderItem,
    resultSet,
  } = record

  const abnormalCount =
    resultSet.entries.filter(
      (entry) =>
        entry.flag !== "normal" &&
        entry.flag !==
          "not-applicable"
    ).length

  const criticalCount =
    resultSet.entries.filter(
      (entry) =>
        entry.flag ===
          "critical-low" ||
        entry.flag ===
          "critical-high"
    ).length

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-3xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <FlaskConical
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle>
                {resultSet.testName}
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {order.orderNumber}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <LaboratoryResultStatusBadge
                  status={
                    resultSet.status
                  }
                />

                {abnormalCount > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {abnormalCount} abnormal
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    No abnormal flags
                  </span>
                )}

                {criticalCount > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                    {criticalCount} critical
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TestTube2
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Laboratory order
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
                label="Test code"
                value={
                  <span className="font-mono text-xs">
                    {orderItem.testCode}
                  </span>
                }
              />

              <DetailItem
                label="Specimen type"
                value={
                  LABORATORY_SPECIMEN_TYPE_LABELS[
                    orderItem.specimenType
                  ]
                }
              />

              <DetailItem
                label="Container"
                value={
                  orderItem.containerType
                }
              />

              <DetailItem
                label="Priority"
                value={
                  LABORATORY_ORDER_PRIORITY_LABELS[
                    order.priority
                  ]
                }
              />

              <DetailItem
                label="Source"
                value={
                  LABORATORY_ORDER_SOURCE_LABELS[
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
                label="Laboratory branch"
                value={order.branchName}
              />

              <DetailItem
                label="Clinical indication"
                value={
                  order.clinicalIndication
                }
              />

              <DetailItem
                label="Consultation reference"
                value={
                  order.consultationNumber ??
                  "Not linked"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Released results
            </h3>

            <div className="overflow-hidden rounded-xl border">
              <Table className="min-w-[850px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Analyte
                    </TableHead>

                    <TableHead>
                      Result
                    </TableHead>

                    <TableHead>
                      Reference
                    </TableHead>

                    <TableHead>
                      Flag
                    </TableHead>

                    <TableHead>
                      Comment
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {resultSet.entries.map(
                    (entry) => (
                      <TableRow
                        key={entry.id}
                      >
                        <TableCell>
                          <p className="font-medium">
                            {
                              entry.analyteName
                            }
                          </p>

                          <p className="font-mono text-xs text-muted-foreground">
                            {
                              entry.analyteCode
                            }
                          </p>
                        </TableCell>

                        <TableCell className="font-medium">
                          {formatResultValue(
                            entry
                          )}
                        </TableCell>

                        <TableCell>
                          {formatReferenceRange(
                            entry
                          )}
                        </TableCell>

                        <TableCell>
                          <LaboratoryResultFlagBadge
                            flag={entry.flag}
                          />
                        </TableCell>

                        <TableCell>
                          {entry.comment ??
                            "—"}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Result lifecycle
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Performed by"
                value={
                  resultSet.performedBy
                }
              />

              <DetailItem
                label="Performed at"
                value={formatPatientDateTime(
                  resultSet.performedAt
                )}
              />

              <DetailItem
                label="Completed by"
                value={
                  resultSet.completedBy ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Completed at"
                value={formatPatientDateTime(
                  resultSet.completedAt
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

                    {resultSet.verifiedBy ??
                      "Not recorded"}
                  </span>
                }
              />

              <DetailItem
                label="Verified at"
                value={formatPatientDateTime(
                  resultSet.verifiedAt
                )}
              />

              <DetailItem
                label="Released by"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Send
                      className="size-3.5 text-teal-700"
                      aria-hidden="true"
                    />

                    {resultSet.releasedBy ??
                      "Not recorded"}
                  </span>
                }
              />

              <DetailItem
                label="Released at"
                value={formatPatientDateTime(
                  resultSet.releasedAt
                )}
              />

              <DetailItem
                label="Verification note"
                value={
                  resultSet.verificationNote ??
                  "No note recorded"
                }
              />

              <DetailItem
                label="Release note"
                value={
                  resultSet.releaseNote ??
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
              This released result is
              read-only. Reference limits,
              values, flags, clinicians, and
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
