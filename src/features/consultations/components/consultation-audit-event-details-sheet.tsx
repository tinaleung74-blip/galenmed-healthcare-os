"use client"

import type { ReactNode } from "react"
import {
  CalendarClock,
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
  ConsultationAuditActionBadge,
  ConsultationAuditCategoryBadge,
} from "@/features/consultations/components/consultation-audit-event-badges"
import {
  CONSULTATION_AUDIT_CATEGORY_LABELS,
} from "@/features/consultations/constants/consultation-audit.constants"
import type {
  ConsultationAuditEvent,
  ConsultationAuditEventDetail,
} from "@/features/consultations/types/consultation-audit.types"
import { formatPatientDateTime } from "@/features/patients/utils/patient.utils"

interface ConsultationAuditEventDetailsSheetProps {
  event: ConsultationAuditEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DetailItemProps {
  label: string
  value: ReactNode
  sensitive?: boolean
}

function protectSensitiveValue(
  detail: ConsultationAuditEventDetail
): string {
  if (!detail.sensitive) {
    return detail.value
  }

  if (detail.value.includes("••••")) {
    return detail.value
  }

  const normalizedLabel =
    detail.label.toLocaleLowerCase("en-PH")

  const shouldShowMaskedSuffix =
    normalizedLabel.includes("number") ||
    normalizedLabel.includes(
      "registration"
    ) ||
    normalizedLabel.includes(
      "reference"
    )

  if (shouldShowMaskedSuffix) {
    const normalizedValue =
      detail.value.trim()

    const suffix =
      normalizedValue.slice(-4)

    return suffix
      ? `•••• ${suffix}`
      : "Protected value"
  }

  return "Protected clinical content"
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

export function ConsultationAuditEventDetailsSheet({
  event,
  open,
  onOpenChange,
}: ConsultationAuditEventDetailsSheetProps) {
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
                {formatPatientDateTime(
                  event.occurredAt
                )}
              </SheetDescription>

              <div className="mt-3 flex flex-wrap gap-2">
                <ConsultationAuditCategoryBadge
                  category={event.category}
                />

                <ConsultationAuditActionBadge
                  action={event.action}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">
              Audit summary
            </h3>

            <div className="rounded-xl border p-4">
              <p className="text-sm leading-relaxed">
                {event.summary}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock
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
                  CONSULTATION_AUDIT_CATEGORY_LABELS[
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
              Audit events are read-only summaries
              derived from the consultation modules.
              Sensitive values are protected in this
              general development view.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t bg-slate-50 sm:flex-row sm:justify-end">
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
