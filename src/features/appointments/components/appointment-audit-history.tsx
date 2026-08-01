"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  History,
  LockKeyhole,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AppointmentAuditActionBadge } from "@/features/appointments/components/appointment-audit-action-badge"
import {
  APPOINTMENT_AUDIT_ACTION_LABELS,
  APPOINTMENT_AUDIT_INITIAL_VISIBLE_EVENTS,
  DEFAULT_APPOINTMENT_AUDIT_FILTERS,
} from "@/features/appointments/constants/appointment-audit.constants"
import { useAppointmentAudit } from "@/features/appointments/providers/appointment-audit-provider"
import {
  APPOINTMENT_AUDIT_ACTIONS,
  type AppointmentAuditAction,
  type AppointmentAuditEvent,
  type AppointmentAuditEventDetail,
  type AppointmentAuditFilters,
} from "@/features/appointments/types/appointment-audit.types"
import type { AppointmentRecord } from "@/features/appointments/types/appointment.types"
import { buildAppointmentAuditEvents } from "@/features/appointments/utils/appointment-audit.utils"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface AppointmentAuditHistoryProps {
  appointment: AppointmentRecord
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function isAuditActionFilter(
  value: string
): value is
  | AppointmentAuditAction
  | "all" {
  return (
    value === "all" ||
    APPOINTMENT_AUDIT_ACTIONS.some(
      (action) => action === value
    )
  )
}

function protectSensitiveValue(
  detail: AppointmentAuditEventDetail
): string {
  if (!detail.sensitive) {
    return detail.value
  }

  const normalizedLabel =
    detail.label.toLocaleLowerCase(
      "en-PH"
    )

  if (
    normalizedLabel.includes(
      "reference"
    )
  ) {
    const suffix =
      detail.value.trim().slice(-4)

    return suffix
      ? `•••• ${suffix}`
      : "Protected reference"
  }

  return "Protected operational content"
}

function matchesAuditSearch(
  event: AppointmentAuditEvent,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const nonSensitiveDetails =
    event.details
      .filter(
        (detail) =>
          !detail.sensitive
      )
      .flatMap((detail) => [
        detail.label,
        detail.value,
      ])

  return normalizePatientSearch(
    event.title,
    event.summary,
    event.actor,
    event.reference,
    APPOINTMENT_AUDIT_ACTION_LABELS[
      event.action
    ],
    ...nonSensitiveDetails
  ).includes(normalizedSearch)
}

export function AppointmentAuditHistory({
  appointment,
}: AppointmentAuditHistoryProps) {
  const { recordedAuditEvents } =
    useAppointmentAudit()

  const [filters, setFilters] =
    useState<AppointmentAuditFilters>(
      () => ({
        ...DEFAULT_APPOINTMENT_AUDIT_FILTERS,
      })
    )

  const [
    visibleEventCount,
    setVisibleEventCount,
  ] = useState(
    APPOINTMENT_AUDIT_INITIAL_VISIBLE_EVENTS
  )

  const auditEvents = useMemo(
    () =>
      buildAppointmentAuditEvents({
        appointment,
        recordedAuditEvents,
      }),
    [
      appointment,
      recordedAuditEvents,
    ]
  )

  const filteredEvents = useMemo(
    () =>
      auditEvents.filter((event) => {
        const matchesSearch =
          matchesAuditSearch(
            event,
            filters.search
          )

        const matchesAction =
          filters.action === "all" ||
          event.action ===
            filters.action

        return (
          matchesSearch &&
          matchesAction
        )
      }),
    [auditEvents, filters]
  )

  const visibleEvents =
    filteredEvents.slice(
      0,
      visibleEventCount
    )

  const schedulingEventCount =
    auditEvents.filter(
      (event) =>
        event.action === "created" ||
        event.action ===
          "rescheduled" ||
        event.action === "updated" ||
        event.action === "confirmed"
    ).length

  const attendanceEventCount =
    auditEvents.filter(
      (event) =>
        event.action ===
          "checked-in" ||
        event.action === "no-show" ||
        event.action === "cancelled"
    ).length

  const consultationEventCount =
    auditEvents.filter(
      (event) =>
        event.action === "queued" ||
        event.action ===
          "consultation-started" ||
        event.action === "completed"
    ).length

  const hasActiveFilters =
    filters.search.trim().length >
      0 ||
    filters.action !== "all"

  function resetFilters() {
    setFilters({
      ...DEFAULT_APPOINTMENT_AUDIT_FILTERS,
    })

    setVisibleEventCount(
      APPOINTMENT_AUDIT_INITIAL_VISIBLE_EVENTS
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <History
            className="size-4"
            aria-hidden="true"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            Appointment Audit History
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Read-only scheduling, attendance,
            Consultation Queue, and completion
            events.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 p-3">
            <CalendarClock
              className="size-4 text-sky-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Scheduling
              </p>

              <p className="font-semibold">
                {schedulingEventCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 p-3">
            <UserCheck
              className="size-4 text-amber-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Attendance
              </p>

              <p className="font-semibold">
                {attendanceEventCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 p-3">
            {appointment.status ===
            "completed" ? (
              <CheckCircle2
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />
            ) : (
              <Stethoscope
                className="size-4 text-violet-700"
                aria-hidden="true"
              />
            )}

            <div>
              <p className="text-xs text-muted-foreground">
                Consultation
              </p>

              <p className="font-semibold">
                {consultationEventCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={filters.search}
              placeholder="Search audit events or actors"
              className="pl-8"
              onChange={(event) =>
                setFilters(
                  (currentFilters) => ({
                    ...currentFilters,
                    search:
                      event.target.value,
                  })
                )
              }
            />
          </div>

          <select
            value={filters.action}
            className={selectClassName}
            onChange={(event) => {
              const nextAction =
                event.target.value

              if (
                isAuditActionFilter(
                  nextAction
                )
              ) {
                setFilters(
                  (currentFilters) => ({
                    ...currentFilters,
                    action: nextAction,
                  })
                )
              }
            }}
          >
            <option value="all">
              All audit actions
            </option>

            {APPOINTMENT_AUDIT_ACTIONS.map(
              (action) => (
                <option
                  key={action}
                  value={action}
                >
                  {
                    APPOINTMENT_AUDIT_ACTION_LABELS[
                      action
                    ]
                  }
                </option>
              )
            )}
          </select>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={resetFilters}
            >
              <RotateCcw
                aria-hidden="true"
              />
              Reset
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {visibleEvents.length} of{" "}
          {filteredEvents.length} events
        </p>

        {visibleEvents.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No matching appointment audit
            events.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleEvents.map((event) => (
              <details
                key={event.id}
                className="group rounded-xl border bg-background"
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <AppointmentAuditActionBadge
                        action={event.action}
                      />
                    </div>

                    <p className="mt-2 text-sm font-medium">
                      {event.title}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {event.summary}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {formatPatientDateTime(
                          event.occurredAt
                        )}
                      </span>

                      <span>
                        Actor:{" "}
                        {event.actor ??
                          "Not recorded"}
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                {event.details.length >
                0 ? (
                  <dl className="grid gap-4 border-t bg-slate-50/70 p-4 sm:grid-cols-2">
                    {event.details.map(
                      (detail, index) => (
                        <div
                          key={`${event.id}-${detail.label}-${index}`}
                        >
                          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {detail.sensitive ? (
                              <LockKeyhole
                                className="size-3"
                                aria-hidden="true"
                              />
                            ) : null}

                            {detail.label}
                          </dt>

                          <dd className="mt-1 break-words text-sm">
                            {protectSensitiveValue(
                              detail
                            )}
                          </dd>
                        </div>
                      )
                    )}
                  </dl>
                ) : null}
              </details>
            ))}
          </div>
        )}

        {visibleEvents.length <
        filteredEvents.length ? (
          <div className="flex justify-center border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setVisibleEventCount(
                  (currentCount) =>
                    currentCount +
                    APPOINTMENT_AUDIT_INITIAL_VISIBLE_EVENTS
                )
              }
            >
              Load more events
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />

        <p>
          Existing lifecycle events are derived
          from appointment timestamps. Future
          reschedule and edit events are stored
          in development audit storage.
          Production audit records must be
          append-only and server-managed.
        </p>
      </div>
    </section>
  )
}
