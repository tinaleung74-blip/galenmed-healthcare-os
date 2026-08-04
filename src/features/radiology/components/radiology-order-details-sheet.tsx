"use client"

import type {
  ReactNode,
} from "react"
import {
  CalendarClock,
  ExternalLink,
  MapPin,
  ScanLine,
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
import { RadiologyAuditHistory } from "@/features/radiology/components/radiology-audit-history"
import { RadiologyPreparationChecklist } from "@/features/radiology/components/radiology-preparation-checklist"
import { RadiologyReportWorkspace } from "@/features/radiology/components/radiology-report-workspace"
import {
  RadiologyOrderPriorityBadge,
  RadiologyOrderStatusBadge,
} from "@/features/radiology/components/radiology-status-badges"
import {
  RADIOLOGY_CONTRAST_PROTOCOL_LABELS,
  RADIOLOGY_MODALITY_LABELS,
  RADIOLOGY_ORDER_SOURCE_LABELS,
} from "@/features/radiology/constants/radiology.constants"
import type {
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"
import {
  formatRadiologyScheduleRange,
} from "@/features/radiology/utils/radiology.utils"
import type {
  Patient,
} from "@/features/patients/types/patient.types"
import {
  formatPatientDateTime,
  getPatientFullName,
} from "@/features/patients/utils/patient.utils"

interface RadiologyOrderDetailsSheetProps {
  order:
    | RadiologyOrder
    | null

  patient:
    | Patient
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onScheduleOrder: (
    order: RadiologyOrder
  ) => void

  onTogglePreparationItem: (
    order: RadiologyOrder,
    checklistItemId: string,
    completed: boolean
  ) => void

  onCheckIn: (
    order: RadiologyOrder
  ) => void

  onMarkReady: (
    order: RadiologyOrder
  ) => void

  onStartImaging: (
    order: RadiologyOrder
  ) => void

  onMarkImagesAcquired: (
    order: RadiologyOrder
  ) => void

  onTechnicallyComplete: (
    order: RadiologyOrder
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

export function RadiologyOrderDetailsSheet({
  order,
  patient,
  open,
  onOpenChange,
  onScheduleOrder,
  onTogglePreparationItem,
  onCheckIn,
  onMarkReady,
  onStartImaging,
  onMarkImagesAcquired,
  onTechnicallyComplete,
  onOpenPatientProfile,
  onOpenConsultation,
}: RadiologyOrderDetailsSheetProps) {
  if (!order || !patient) {
    return null
  }

  const requiredPreparationItems =
    order.preparationChecklist.filter(
      (item) => item.required
    )

  const allRequiredPreparationComplete =
    requiredPreparationItems.length >
      0 &&
    requiredPreparationItems.every(
      (item) => item.completed
    )

  const canSchedule =
    order.status === "ordered" ||
    order.status === "scheduled"

  const canCheckIn =
    order.status === "scheduled"

  const canMarkReady =
    order.status ===
      "checked-in" &&
    allRequiredPreparationComplete

  const canStartImaging =
    order.status === "ready"

  const canMarkImagesAcquired =
    order.status ===
    "in-progress"

  const canTechnicallyComplete =
    order.status ===
    "images-acquired"

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
                {order.procedureName}
              </SheetTitle>

              <SheetDescription className="mt-1 font-mono text-xs">
                {order.orderNumber}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <RadiologyOrderStatusBadge
                  status={order.status}
                />

                <RadiologyOrderPriorityBadge
                  priority={
                    order.priority
                  }
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Patient
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Patient name"
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
                label="Mobile"
                value={
                  patient.mobileNumber ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Email"
                value={
                  patient.emailAddress ??
                  "Not recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ScanLine
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Imaging request
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Procedure"
                value={order.procedureName}
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
                label="Order source"
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
                label="Branch"
                value={order.branchName}
              />

              <DetailItem
                label="Clinical indication"
                className="sm:col-span-2"
                value={
                  order.clinicalIndication
                }
              />

              <DetailItem
                label="Special instructions"
                className="sm:col-span-2"
                value={
                  order.specialInstructions ??
                  "Not recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Imaging schedule
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Schedule"
                className="sm:col-span-2"
                value={formatRadiologyScheduleRange(
                  order
                )}
              />

              <DetailItem
                label="Duration"
                value={
                  order.durationMinutes
                    ? `${order.durationMinutes} minutes`
                    : "Not scheduled"
                }
              />

              <DetailItem
                label="Imaging room"
                value={
                  <span className="inline-flex items-center gap-2">
                    <MapPin
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />

                    {order.roomName ??
                      "Not assigned"}
                  </span>
                }
              />

              <DetailItem
                label="Scheduling notes"
                className="sm:col-span-2"
                value={
                  order.schedulingNotes ??
                  "Not recorded"
                }
              />
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Preparation requirements
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
              <DetailItem
                label="Fasting"
                value={
                  order.requiresFasting
                    ? "Required"
                    : "Not required"
                }
              />

              <DetailItem
                label="Pregnancy screening"
                value={
                  order.requiresPregnancyScreening
                    ? "Required when applicable"
                    : "Not required"
                }
              />

              <DetailItem
                label="Renal-function review"
                value={
                  order.requiresRenalFunctionReview
                    ? "Required"
                    : "Not required"
                }
              />
            </dl>
          </section>

          <RadiologyPreparationChecklist
            order={order}
            onToggleItem={
              onTogglePreparationItem
            }
          />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Operational timestamps
            </h3>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Created"
                value={formatPatientDateTime(
                  order.createdAt
                )}
              />

              <DetailItem
                label="Checked in"
                value={formatPatientDateTime(
                  order.checkedInAt
                )}
              />

              <DetailItem
                label="Ready for imaging"
                value={formatPatientDateTime(
                  order.readyAt
                )}
              />

              <DetailItem
                label="Imaging started"
                value={formatPatientDateTime(
                  order.imagingStartedAt
                )}
              />

              <DetailItem
                label="Images acquired"
                value={formatPatientDateTime(
                  order.imagesAcquiredAt
                )}
              />

              <DetailItem
                label="Technical completion"
                value={formatPatientDateTime(
                  order.technicalCompletedAt
                )}
              />
            </dl>
          </section>

          <RadiologyReportWorkspace
            order={order}
          />

          <RadiologyAuditHistory
            order={order}
          />

          {order.cancellationReason ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-semibold text-rose-800">
                Cancellation reason
              </h3>

              <p className="mt-2 text-sm text-rose-700">
                {
                  order.cancellationReason
                }
              </p>
            </section>
          ) : null}

          {order.status ===
          "no-show" ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-800">
                Patient marked as no-show
              </h3>

              <p className="mt-2 text-sm text-amber-700">
                Recorded{" "}
                {formatPatientDateTime(
                  order.noShowAt
                )}
                {" by "}
                {order.noShowMarkedBy ??
                  "Not recorded"}.
              </p>
            </section>
          ) : null}
        </div>

        <SheetFooter className="gap-3 border-t bg-slate-50 p-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {canSchedule ? (
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 whitespace-nowrap sm:w-auto"
                onClick={() =>
                  onScheduleOrder(order)
                }
              >
                <CalendarClock
                  aria-hidden="true"
                />

                {order.status ===
                "scheduled"
                  ? "Reschedule"
                  : "Schedule imaging"}
              </Button>
            ) : null}

            {canCheckIn ? (
              <Button
                type="button"
                className="w-full shrink-0 whitespace-nowrap bg-teal-700 text-white hover:bg-teal-800 sm:w-auto"
                onClick={() =>
                  onCheckIn(order)
                }
              >
                Check in patient
              </Button>
            ) : null}

            {order.status ===
            "checked-in" ? (
              <Button
                type="button"
                disabled={
                  !canMarkReady
                }
                className="w-full shrink-0 whitespace-nowrap bg-cyan-700 text-white hover:bg-cyan-800 sm:w-auto"
                onClick={() =>
                  onMarkReady(order)
                }
              >
                Mark ready for imaging
              </Button>
            ) : null}

            {canStartImaging ? (
              <Button
                type="button"
                className="w-full shrink-0 whitespace-nowrap bg-violet-700 text-white hover:bg-violet-800 sm:w-auto"
                onClick={() =>
                  onStartImaging(order)
                }
              >
                Start imaging
              </Button>
            ) : null}

            {canMarkImagesAcquired ? (
              <Button
                type="button"
                className="w-full shrink-0 whitespace-nowrap bg-indigo-700 text-white hover:bg-indigo-800 sm:w-auto"
                onClick={() =>
                  onMarkImagesAcquired(
                    order
                  )
                }
              >
                Mark images acquired
              </Button>
            ) : null}

            {canTechnicallyComplete ? (
              <Button
                type="button"
                className="w-full shrink-0 whitespace-nowrap bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto"
                onClick={() =>
                  onTechnicallyComplete(
                    order
                  )
                }
              >
                Technical completion
              </Button>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 whitespace-nowrap sm:w-auto"
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
                className="w-full shrink-0 whitespace-nowrap sm:w-auto"
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
                  className="w-full shrink-0 whitespace-nowrap sm:w-auto"
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
