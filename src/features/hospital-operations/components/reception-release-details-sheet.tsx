"use client"

import {
  ClipboardList,
  FileText,
  History,
  PackageCheck,
  Printer,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import Link from "next/link"

import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
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
  ReceptionDocumentStatusBadge,
  ReceptionPaymentStatusBadge,
  ReceptionReleaseStatusBadge,
} from "@/features/hospital-operations/components/reception-release-badges"
import type {
  ReceptionReleaseItem,
} from "@/features/hospital-operations/types/reception-release.types"
import { cn } from "@/lib/utils"
import {
  LABORATORY_RESULT_FLAG_LABELS,
} from "@/features/hospital-operations/utils/laboratory-result.utils"
import {
  canPrintReceptionDocument,
  canReleaseReceptionDocument,
  formatReceptionAmount,
  formatReceptionDate,
  formatReceptionDateTime,
  getReceptionPatientFullName,
  RECEPTION_DOCUMENT_TYPE_LABELS,
  RECEPTION_PRINT_PURPOSE_LABELS,
  RECEPTION_RELEASE_METHOD_LABELS,
} from "@/features/hospital-operations/utils/reception-release.utils"

interface ReceptionReleaseDetailsSheetProps {
  item: ReceptionReleaseItem | null
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
  onRelease: (
    item: ReceptionReleaseItem
  ) => void
}

export function ReceptionReleaseDetailsSheet({
  item,
  open,
  onOpenChange,
  onRelease,
}: ReceptionReleaseDetailsSheetProps) {
  if (!item) {
    return null
  }

  const canPrint =
    canPrintReceptionDocument(
      item
    )

  const canRelease =
    canReleaseReceptionDocument(
      item
    )

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-5xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <FileText
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle>
                Clinical Document Release
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {item.documentNumber}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <ReceptionDocumentStatusBadge
                  status={
                    item.documentStatus
                  }
                />

                <ReceptionPaymentStatusBadge
                  status={
                    item.paymentStatus
                  }
                />

                <ReceptionReleaseStatusBadge
                  status={
                    item.releaseStatus
                  }
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-7 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-4 text-sky-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Patient and visit
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Patient
                </dt>

                <dd className="mt-1 font-medium">
                  {getReceptionPatientFullName(
                    item
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Medical record number
                </dt>

                <dd className="mt-1 font-mono text-xs">
                  {
                    item.patient
                      .medicalRecordNumber
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Date of birth
                </dt>

                <dd className="mt-1">
                  {formatReceptionDate(
                    item.patient
                      .dateOfBirth
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Visit number
                </dt>

                <dd className="mt-1 font-mono text-xs">
                  {item.visitNumber}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Request number
                </dt>

                <dd className="mt-1 font-mono text-xs">
                  {item.requestNumber ??
                    "Not linked"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Branch
                </dt>

                <dd className="mt-1">
                  {item.branchName}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardList
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Document details
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Document type
                </dt>

                <dd className="mt-1">
                  {
                    RECEPTION_DOCUMENT_TYPE_LABELS[
                      item.documentType
                    ]
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Title
                </dt>

                <dd className="mt-1 font-medium">
                  {item.title}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Version
                </dt>

                <dd className="mt-1">
                  {item.versionNumber}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Service
                </dt>

                <dd className="mt-1">
                  {item.serviceName ??
                    item.serviceType ??
                    "Not linked"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Finalized
                </dt>

                <dd className="mt-1">
                  {formatReceptionDateTime(
                    item.finalizedAt
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Sensitivity
                </dt>

                <dd className="mt-1 capitalize">
                  {item.sensitivity}
                </dd>
              </div>
            </dl>
          </section>

          {item.laboratoryResult ? (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                Verified laboratory result
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Specimen type
                  </p>

                  <p className="mt-1 font-medium">
                    {
                      item.laboratoryResult
                        .specimenType
                    }
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Collection reference
                  </p>

                  <p className="mt-1 font-mono text-xs">
                    {item.laboratoryResult
                      .collectionReference ??
                      "Not recorded"}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Test
                      </TableHead>
                      <TableHead>
                        Result
                      </TableHead>
                      <TableHead>
                        Unit
                      </TableHead>
                      <TableHead>
                        Reference range
                      </TableHead>
                      <TableHead>
                        Flag
                      </TableHead>
                      <TableHead>
                        Remarks
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {item.laboratoryResult.resultItems.map(
                      (resultItem) => (
                        <TableRow
                          key={resultItem.id}
                        >
                          <TableCell className="font-medium">
                            {resultItem.testName}
                          </TableCell>

                          <TableCell className="font-semibold">
                            {resultItem.resultValue}
                          </TableCell>

                          <TableCell>
                            {resultItem.unit ||
                              "—"}
                          </TableCell>

                          <TableCell>
                            {resultItem.referenceRange ||
                              "—"}
                          </TableCell>

                          <TableCell>
                            {
                              LABORATORY_RESULT_FLAG_LABELS[
                                resultItem.flag
                              ]
                            }
                          </TableCell>

                          <TableCell>
                            {resultItem.remarks ||
                              "—"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>

              {item.laboratoryResult
                .interpretation ? (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Interpretation
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {
                      item.laboratoryResult
                        .interpretation
                    }
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Payment and release control
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Required amount
                </p>

                <p className="mt-1 break-words font-semibold tabular-nums [overflow-wrap:anywhere]">
                  {formatReceptionAmount(
                    item.requiredAmountCentavos
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Cleared amount
                </p>

                <p className="mt-1 break-words font-semibold tabular-nums [overflow-wrap:anywhere]">
                  {formatReceptionAmount(
                    item.clearedAmountCentavos
                  )}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Ready at
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatReceptionDateTime(
                    item.readyAt
                  )}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Released at
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatReceptionDateTime(
                    item.releasedAt
                  )}
                </p>
              </div>
            </div>

            {item.releaseStatus ===
            "payment_pending" ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <ShieldAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />

                <p>
                  Patient-facing printing and
                  release remain locked until
                  Cashier payment clearance is
                  marked paid or waived.
                </p>
              </div>
            ) : null}

            {item.releaseStatus ===
              "ready" ||
            item.releaseStatus ===
              "released" ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />

                <p>
                  Clinical finalization and
                  financial clearance are both
                  satisfied. Reception may
                  print and record release.
                </p>
              </div>
            ) : null}

            {item.blockedReason ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                {item.blockedReason}
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History
                className="size-4 text-slate-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Release history
              </h3>
            </div>

            {item.releaseRecords.length ===
            0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No release has been recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {item.releaseRecords.map(
                  (record) => (
                    <article
                      key={record.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-semibold">
                            {record.releaseNumber}
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {record.recipientName}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              RECEPTION_RELEASE_METHOD_LABELS[
                                record.releaseMethod
                              ]
                            }
                            {" · Copy "}
                            {record.copyNumber}
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {formatReceptionDateTime(
                            record.releasedAt
                          )}
                        </p>
                      </div>

                      {record.notes ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          {record.notes}
                        </p>
                      ) : null}
                    </article>
                  )
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ReceiptText
                className="size-4 text-slate-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Print history
              </h3>
            </div>

            {item.printLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No print has been recorded.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Purpose
                      </TableHead>
                      <TableHead>
                        Copy
                      </TableHead>
                      <TableHead>
                        Printed
                      </TableHead>
                      <TableHead>
                        Reason
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {item.printLogs.map(
                      (printLog) => (
                        <TableRow
                          key={printLog.id}
                        >
                          <TableCell>
                            {
                              RECEPTION_PRINT_PURPOSE_LABELS[
                                printLog.printPurpose
                              ]
                            }
                          </TableCell>

                          <TableCell>
                            {printLog.copyNumber}
                          </TableCell>

                          <TableCell>
                            {formatReceptionDateTime(
                              printLog.printedAt
                            )}
                          </TableCell>

                          <TableCell>
                            {printLog.printReason ??
                              "—"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>

        <SheetFooter className="gap-2 border-t bg-slate-50">
          <Button
            type="button"
            variant="outline"
            disabled={!canRelease}
            onClick={() =>
              onRelease(item)
            }
          >
            <PackageCheck
              aria-hidden="true"
            />
            Record release
          </Button>

          {canPrint ? (
            <Link
              href={`/reception/releases/${item.documentId}/print`}
              className={cn(
                buttonVariants()
              )}
            >
              <Printer
                aria-hidden="true"
              />
              Open print view
            </Link>
          ) : (
            <Button
              type="button"
              disabled
            >
              <Printer
                aria-hidden="true"
              />
              Print locked
            </Button>
          )}

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
