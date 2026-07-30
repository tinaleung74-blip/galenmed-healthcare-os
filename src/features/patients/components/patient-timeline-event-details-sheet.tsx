"use client"

import type { ReactNode } from "react"
import {
  CalendarDays,
  ExternalLink,
  History,
  LockKeyhole,
  ShieldCheck,
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
  PatientTimelineActionBadge,
  PatientTimelineCategoryBadge,
} from "@/features/patients/components/patient-timeline-event-badges"
import {
  PATIENT_TIMELINE_CATEGORY_LABELS,
} from "@/features/patients/constants/patient-timeline.constants"
import type {
  PatientTimelineDetail,
  PatientTimelineEvent,
} from "@/features/patients/types/patient-timeline.types"
import { formatPatientDateTime } from "@/features/patients/utils/patient.utils"

interface PatientTimelineEventDetailsSheetProps {
  event: PatientTimelineEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSource: (
    event: PatientTimelineEvent
  ) => void
}

interface DetailItemProps {
  label: string
  value: ReactNode
  sensitive?: boolean
}

function protectSensitiveValue(
  detail: PatientTimelineDetail
): string {
  if (!detail.sensitive) {
    return detail.value
  }

  if (detail.value.includes("••••")) {
    return detail.value
  }

  const normalizedValue = detail.value.trim()

  if (normalizedValue.length <= 4) {
    return "Protected value"
  }

  return `•••• ${normalizedValue.slice(-4)}`
}

function DetailItem({
  label,
  value,
  sensitive = false,
}: DetailItemProps) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {sensitive ? (
          <LockKeyhole
            className="size-3"
            aria-hidden="true"
          />
        ) : null}

        {label}
      </dt>

      <dd className="mt-1 break-words text-sm text-foreground">
        {value}
      </dd>
    </div>
  )
}

export function PatientTimelineEventDetailsSheet({
  event,
  open,
  onOpenChange,
  onOpenSource,
}: PatientTimelineEventDetailsSheetProps) {
  if (!event) {
    return null
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="border-b p-6">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <History
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                {event.title}
              </SheetTitle>

              <SheetDescription className="mt-1">
                {formatPatientDateTime(event.occurredAt)}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <PatientTimelineCategoryBadge
                  category={event.category}
                />

                <PatientTimelineActionBadge
                  action={event.action}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">
              Event summary
            </h3>

            <div className="rounded-xl border p-4">
              <p className="text-sm leading-relaxed">
                {event.summary}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays
                className="size-4 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold">
                Event information
              </h3>
            </div>

            <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <DetailItem
                label="Occurred at"
                value={formatPatientDateTime(
                  event.occurredAt
                )}
              />

              <DetailItem
                label="Module"
                value={
                  PATIENT_TIMELINE_CATEGORY_LABELS[
                    event.category
                  ]
                }
              />

              <DetailItem
                label="Actor"
                value={
                  <span className="inline-flex items-center gap-2">
                    <UserRound
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />

                    {event.actor ??
                      "System or actor not recorded"}
                  </span>
                }
              />

              <DetailItem
                label="Reference"
                value={
                  event.reference ??
                  "Not recorded"
                }
              />

              <DetailItem
                label="Record status"
                value={
                  event.recordStatus ??
                  "Not applicable"
                }
              />

              <DetailItem
                label="Source section"
                value={event.sourceSection}
              />
            </dl>
          </section>

          {event.details.length > 0 ? (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                Event details
              </h3>

              <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                {event.details.map(
                  (detail, index) => (
                    <DetailItem
                      key={`${event.id}-${detail.label}-${index}`}
                      label={detail.label}
                      value={protectSensitiveValue(
                        detail
                      )}
                      sensitive={
                        detail.sensitive
                      }
                    />
                  )
                )}
              </dl>
            </section>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Timeline events are read-only summaries
              derived from their source modules. Changes
              must be made through the authorized source
              workflow.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t bg-slate-50 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={() => onOpenSource(event)}
          >
            <ExternalLink aria-hidden="true" />
            Open source module
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
