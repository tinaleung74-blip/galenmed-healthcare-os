"use client"

import type { ReactNode } from "react"
import {
  ExternalLink,
  FlaskConical,
  Play,
  TestTube2,
  UserRound,
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
  LaboratoryOrderPriorityBadge,
  LaboratoryOrderStatusBadge,
  LaboratorySpecimenStatusBadge,
} from "@/features/laboratory/components/laboratory-status-badges"
import {
  LABORATORY_COLLECTION_METHOD_LABELS,
  LABORATORY_ORDER_ITEM_STATUS_LABELS,
  LABORATORY_ORDER_SOURCE_LABELS,
  LABORATORY_SPECIMEN_TYPE_LABELS,
} from "@/features/laboratory/constants/laboratory.constants"
import type {
  LaboratoryOrder,
  LaboratorySpecimenRecord,
} from "@/features/laboratory/types/laboratory.types"
import {
  getLaboratorySpecimenProgress,
} from "@/features/laboratory/utils/laboratory.utils"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface LaboratoryOrderDetailsSheetProps {
  order: LaboratoryOrder | null
  patient: Patient | null

  open: boolean
  onOpenChange: (open: boolean) => void

  onCollectSpecimen: (
    order: LaboratoryOrder
  ) => void

  onReceiveSpecimen: (
    order: LaboratoryOrder,
    specimenId: string
  ) => void

  onRejectSpecimen: (
    order: LaboratoryOrder,
    specimen:
      LaboratorySpecimenRecord
  ) => void

  onStartProcessing: (
    order: LaboratoryOrder
  ) => void

  onOpenPatientProfile: (
    patient: Patient
  ) => void

  onOpenConsultation: (
    consultationId: string
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

      <dd className="mt-1 text-sm">
        {value}
      </dd>
    </div>
  )
}

export function LaboratoryOrderDetailsSheet({
  order,
  patient,
  open,
  onOpenChange,
  onCollectSpecimen,
  onReceiveSpecimen,
  onRejectSpecimen,
  onStartProcessing,
  onOpenPatientProfile,
  onOpenConsultation,
}: LaboratoryOrderDetailsSheetProps) {
  if (!order || !patient) {
    return null
  }

  const progress =
    getLaboratorySpecimenProgress(
      order
    )

  const canCollect =
    [
      "ordered",
      "specimen-collected",
      "rejected",
    ].includes(order.status) &&
    progress.collected <
      progress.required

  const canStartProcessing =
    order.status === "received"

  const terminalOrder =
    [
      "completed",
      "verified",
      "released",
      "cancelled",
    ].includes(order.status)

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
                {order.orderNumber}
              </SheetTitle>

              <SheetDescription className="mt-1">
                {getPatientFullName(
                  patient
                )}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <LaboratoryOrderStatusBadge
                  status={order.status}
                />

                <LaboratoryOrderPriorityBadge
                  priority={
                    order.priority
                  }
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section>
            <h3 className="text-sm font-semibold">
              Order information
            </h3>

            <dl className="mt-4 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Patient"
                value={getPatientFullName(
                  patient
                )}
              />

              <DetailItem
                label="Medical record number"
                value={
                  <span className="font-mono text-xs">
                    {
                      patient.medicalRecordNumber
                    }
                  </span>
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
                label="Branch"
                value={order.branchName}
              />

              <DetailItem
                label="Created"
                value={formatPatientDateTime(
                  order.createdAt
                )}
              />

              <DetailItem
                label="Fasting"
                value={
                  order.fastingRequired
                    ? "Required"
                    : "Not required"
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

          <section>
            <h3 className="text-sm font-semibold">
              Clinical indication
            </h3>

            <div className="mt-3 rounded-xl border p-4 text-sm">
              {order.clinicalIndication}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">
              Requested tests
            </h3>

            <div className="mt-3 overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Specimen</TableHead>
                    <TableHead>Container</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {order.items.map(
                    (item) => (
                      <TableRow
                        key={item.id}
                      >
                        <TableCell>
                          <p className="font-medium">
                            {item.testName}
                          </p>

                          <p className="font-mono text-xs text-muted-foreground">
                            {item.testCode}
                          </p>
                        </TableCell>

                        <TableCell>
                          {
                            LABORATORY_SPECIMEN_TYPE_LABELS[
                              item.specimenType
                            ]
                          }
                        </TableCell>

                        <TableCell>
                          {
                            item.containerType
                          }
                        </TableCell>

                        <TableCell>
                          {
                            LABORATORY_ORDER_ITEM_STATUS_LABELS[
                              item.status
                            ]
                          }
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                Specimens
              </h3>

              <p className="text-xs text-muted-foreground">
                Required {progress.required}
                {" · "}
                Collected {progress.collected}
                {" · "}
                Received {progress.received}
              </p>
            </div>

            {order.specimens.length ===
            0 ? (
              <div className="mt-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No specimens have been
                collected.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {order.specimens.map(
                  (specimen) => {
                    const canReceive =
                      specimen.status ===
                      "collected"

                    const canReject =
                      specimen.status !==
                        "rejected" &&
                      !terminalOrder

                    return (
                      <article
                        key={specimen.id}
                        className="rounded-xl border p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-mono text-sm font-medium">
                              {
                                specimen.accessionNumber
                              }
                            </p>

                            <p className="mt-1 text-sm">
                              {
                                LABORATORY_SPECIMEN_TYPE_LABELS[
                                  specimen.specimenType
                                ]
                              }
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                LABORATORY_COLLECTION_METHOD_LABELS[
                                  specimen.collectionMethod
                                ]
                              }
                              {" · "}
                              {
                                specimen.containerType
                              }
                            </p>
                          </div>

                          <LaboratorySpecimenStatusBadge
                            status={
                              specimen.status
                            }
                          />
                        </div>

                        <dl className="mt-4 grid gap-3 border-t pt-3 text-xs sm:grid-cols-2">
                          <DetailItem
                            label="Collected"
                            value={`${formatPatientDateTime(
                              specimen.collectedAt
                            )} by ${
                              specimen.collectedBy
                            }`}
                          />

                          <DetailItem
                            label="Received"
                            value={
                              specimen.receivedAt
                                ? `${formatPatientDateTime(
                                    specimen.receivedAt
                                  )} by ${
                                    specimen.receivedBy
                                  }`
                                : "Not received"
                            }
                          />
                        </dl>

                        {specimen.rejectionReason ? (
                          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                            {
                              specimen.rejectionReason
                            }
                          </div>
                        ) : null}

                        {(canReceive ||
                          canReject) ? (
                          <div className="mt-4 flex flex-wrap justify-end gap-2">
                            {canReceive ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  onReceiveSpecimen(
                                    order,
                                    specimen.id
                                  )
                                }
                              >
                                Receive specimen
                              </Button>
                            ) : null}

                            {canReject ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  onRejectSpecimen(
                                    order,
                                    specimen
                                  )
                                }
                              >
                                Reject specimen
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    )
                  }
                )}
              </div>
            )}
          </section>
        </div>

        <SheetFooter className="gap-3 border-t bg-slate-50 p-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {canCollect ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onCollectSpecimen(
                    order
                  )
                }
              >
                <TestTube2
                  aria-hidden="true"
                />
                Collect specimen
              </Button>
            ) : null}

            {canStartProcessing ? (
              <Button
                type="button"
                className="bg-teal-700 text-white hover:bg-teal-800"
                onClick={() =>
                  onStartProcessing(
                    order
                  )
                }
              >
                <Play aria-hidden="true" />
                Start processing
              </Button>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 border-t pt-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
            >
              Close
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onOpenPatientProfile(
                    patient
                  )
                }
              >
                <UserRound
                  aria-hidden="true"
                />
                Patient profile
              </Button>

              {order.consultationId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onOpenConsultation(
                      order.consultationId!
                    )
                  }
                >
                  <ExternalLink
                    aria-hidden="true"
                  />
                  Consultation
                </Button>
              ) : null}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
