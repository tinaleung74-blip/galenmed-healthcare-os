"use client"

import type { LucideIcon } from "lucide-react"
import {
  CalendarCheck2,
  ClipboardList,
  Eye,
  FileSignature,
  HeartPulse,
  History,
  Pill,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import {
  useMemo,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ConsultationAuditEventDetailsSheet } from "@/features/consultations/components/consultation-audit-event-details-sheet"
import {
  ConsultationAuditActionBadge,
  ConsultationAuditCategoryBadge,
} from "@/features/consultations/components/consultation-audit-event-badges"
import {
  CONSULTATION_AUDIT_ACTION_LABELS,
  CONSULTATION_AUDIT_CATEGORY_LABELS,
  CONSULTATION_AUDIT_INITIAL_VISIBLE_EVENTS,
  DEFAULT_CONSULTATION_AUDIT_FILTERS,
} from "@/features/consultations/constants/consultation-audit.constants"
import { useConsultationDiagnoses } from "@/features/consultations/providers/consultation-diagnosis-provider"
import { useConsultationEmr } from "@/features/consultations/providers/consultation-emr-provider"
import { useConsultationFinalization } from "@/features/consultations/providers/consultation-finalization-provider"
import { useConsultationPrescriptions } from "@/features/consultations/providers/consultation-prescription-provider"
import {
  CONSULTATION_AUDIT_EVENT_ACTIONS,
  CONSULTATION_AUDIT_EVENT_CATEGORIES,
  type ConsultationAuditEvent,
  type ConsultationAuditEventAction,
  type ConsultationAuditEventCategory,
  type ConsultationAuditFilters,
} from "@/features/consultations/types/consultation-audit.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import { buildConsultationAuditEvents } from "@/features/consultations/utils/consultation-audit.utils"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import { cn } from "@/lib/utils"

interface ConsultationAuditWorkspaceProps {
  consultation: ConsultationEncounter
}

interface AuditDateGroup {
  key: string
  label: string
  events: ConsultationAuditEvent[]
}

const categoryIcons: Record<
  ConsultationAuditEventCategory,
  LucideIcon
> = {
  encounter: Stethoscope,
  soap: ClipboardList,
  diagnosis: HeartPulse,
  prescription: Pill,
  "follow-up": CalendarCheck2,
  signature: FileSignature,
}

const auditDateHeadingFormatter =
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

function getAuditDateKey(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "invalid-date"
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-")
}

function getAuditDateLabel(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable"
  }

  return auditDateHeadingFormatter.format(
    date
  )
}

function groupAuditEvents(
  events:
    readonly ConsultationAuditEvent[]
): AuditDateGroup[] {
  const groups =
    new Map<
      string,
      ConsultationAuditEvent[]
    >()

  events.forEach((event) => {
    const dateKey =
      getAuditDateKey(
        event.occurredAt
      )

    const existingEvents =
      groups.get(dateKey) ?? []

    existingEvents.push(event)

    groups.set(
      dateKey,
      existingEvents
    )
  })

  return Array.from(
    groups.entries()
  ).map(
    ([key, groupedEvents]) => ({
      key,

      label: getAuditDateLabel(
        groupedEvents[0]?.occurredAt ??
          ""
      ),

      events: groupedEvents,
    })
  )
}

function isAuditCategoryFilter(
  value: string
): value is
  | ConsultationAuditEventCategory
  | "all" {
  return (
    value === "all" ||
    CONSULTATION_AUDIT_EVENT_CATEGORIES.some(
      (category) =>
        category === value
    )
  )
}

function isAuditActionFilter(
  value: string
): value is
  | ConsultationAuditEventAction
  | "all" {
  return (
    value === "all" ||
    CONSULTATION_AUDIT_EVENT_ACTIONS.some(
      (action) =>
        action === value
    )
  )
}

function matchesAuditSearch(
  event: ConsultationAuditEvent,
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

  const searchableEvent =
    normalizePatientSearch(
      event.title,
      event.summary,
      event.actor,
      event.reference,
      CONSULTATION_AUDIT_CATEGORY_LABELS[
        event.category
      ],
      CONSULTATION_AUDIT_ACTION_LABELS[
        event.action
      ],
      ...nonSensitiveDetails
    )

  return searchableEvent.includes(
    normalizedSearch
  )
}

export function ConsultationAuditWorkspace({
  consultation,
}: ConsultationAuditWorkspaceProps) {
  const {
    soapNoteRevisions,
  } = useConsultationEmr()

  const { diagnosisRecords } =
    useConsultationDiagnoses()

  const { prescriptionRecords } =
    useConsultationPrescriptions()

  const {
    finalizationRecords,
    finalizationRevisions,
  } = useConsultationFinalization()

  const [filters, setFilters] =
    useState<ConsultationAuditFilters>(
      () => ({
        ...DEFAULT_CONSULTATION_AUDIT_FILTERS,
      })
    )

  const [
    visibleEventCount,
    setVisibleEventCount,
  ] = useState(
    CONSULTATION_AUDIT_INITIAL_VISIBLE_EVENTS
  )

  const [
    viewingEventId,
    setViewingEventId,
  ] = useState<string | null>(null)

  const finalizationRecord =
    finalizationRecords.find(
      (record) =>
        record.consultationId ===
        consultation.id
    ) ?? null

  const auditEvents = useMemo(
    () =>
      buildConsultationAuditEvents({
        consultation,
        soapNoteRevisions,
        diagnosisRecords,
        prescriptionRecords,
        finalizationRevisions,
        finalizationRecord,
      }),
    [
      consultation,
      soapNoteRevisions,
      diagnosisRecords,
      prescriptionRecords,
      finalizationRevisions,
      finalizationRecord,
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

        const matchesCategory =
          filters.category === "all" ||
          event.category ===
            filters.category

        const matchesAction =
          filters.action === "all" ||
          event.action ===
            filters.action

        return (
          matchesSearch &&
          matchesCategory &&
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

  const groupedEvents =
    groupAuditEvents(visibleEvents)

  const viewingEvent =
    auditEvents.find(
      (event) =>
        event.id ===
        viewingEventId
    ) ?? null

  const documentationEventCount =
    auditEvents.filter(
      (event) =>
        event.category === "soap" ||
        event.category ===
          "diagnosis"
    ).length

  const prescriptionEventCount =
    auditEvents.filter(
      (event) =>
        event.category ===
        "prescription"
    ).length

  const finalizationEventCount =
    auditEvents.filter(
      (event) =>
        event.category ===
          "signature" ||
        event.action ===
          "finalized" ||
        event.action ===
          "completed"
    ).length

  const hasActiveFilters =
    filters.search.trim().length >
      0 ||
    filters.category !== "all" ||
    filters.action !== "all"

  function updateFilter<
    Key extends keyof ConsultationAuditFilters,
  >(
    key: Key,
    value:
      ConsultationAuditFilters[Key]
  ) {
    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        [key]: value,
      })
    )

    setVisibleEventCount(
      CONSULTATION_AUDIT_INITIAL_VISIBLE_EVENTS
    )
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_CONSULTATION_AUDIT_FILTERS,
    })

    setVisibleEventCount(
      CONSULTATION_AUDIT_INITIAL_VISIBLE_EVENTS
    )
  }

  return (
    <>
      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
            <History
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Clinical Audit History
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Read-only chronological activity
              derived from the consultation and
              its clinical modules.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Total events
              </p>

              <p className="mt-1 text-xl font-semibold">
                {auditEvents.length}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Clinical documentation
              </p>

              <p className="mt-1 text-xl font-semibold">
                {
                  documentationEventCount
                }
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Prescription events
              </p>

              <p className="mt-1 text-xl font-semibold">
                {prescriptionEventCount}
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              finalizationEventCount > 0
                ? "border-emerald-200 bg-emerald-50/40 shadow-none"
                : "shadow-none"
            }
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Finalization events
              </p>

              <p className="mt-1 text-xl font-semibold">
                {finalizationEventCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl border bg-background shadow-sm">
          <div className="space-y-4 border-b p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1 xl:max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  value={filters.search}
                  placeholder="Search audit events, references, or actors"
                  aria-label="Search consultation audit history"
                  className="pl-8"
                  onChange={(event) =>
                    updateFilter(
                      "search",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.category}
                  aria-label="Filter audit category"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isAuditCategoryFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "category",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All modules
                  </option>

                  {CONSULTATION_AUDIT_EVENT_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {
                          CONSULTATION_AUDIT_CATEGORY_LABELS[
                            category
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.action}
                  aria-label="Filter audit action"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isAuditActionFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "action",
                        event.target.value
                      )
                    }
                  }}
                >
                  <option value="all">
                    All actions
                  </option>

                  {CONSULTATION_AUDIT_EVENT_ACTIONS.map(
                    (action) => (
                      <option
                        key={action}
                        value={action}
                      >
                        {
                          CONSULTATION_AUDIT_ACTION_LABELS[
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
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {visibleEvents.length} of{" "}
              {filteredEvents.length} matching
              audit events
            </p>
          </div>

          {auditEvents.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <History
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No audit activity
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No consultation activity is
                available for this encounter.
              </p>
            </div>
          ) : filteredEvents.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching audit events
              </h3>

              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="space-y-8 p-4 sm:p-6">
              {groupedEvents.map(
                (group) => (
                  <section
                    key={group.key}
                    className="space-y-3"
                  >
                    <div className="sticky top-16 z-10 border-b bg-background/95 py-2 backdrop-blur">
                      <h3 className="text-sm font-semibold">
                        {group.label}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {group.events.map(
                        (event) => {
                          const Icon =
                            categoryIcons[
                              event.category
                            ]

                          const hasTerminalState =
                            event.action ===
                              "archived" ||
                            event.action ===
                              "cancelled" ||
                            event.action ===
                              "no-show"

                          return (
                            <article
                              key={event.id}
                              className={cn(
                                "rounded-xl border p-4 transition-colors hover:bg-slate-50",
                                hasTerminalState &&
                                  "bg-slate-50/70"
                              )}
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                                <div className="flex min-w-0 flex-1 gap-3">
                                  <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-700">
                                    <Icon
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap gap-2">
                                      <ConsultationAuditCategoryBadge
                                        category={
                                          event.category
                                        }
                                      />

                                      <ConsultationAuditActionBadge
                                        action={
                                          event.action
                                        }
                                      />
                                    </div>

                                    <h4 className="mt-3 font-semibold">
                                      {event.title}
                                    </h4>

                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                      {event.summary}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
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

                                      {event.reference ? (
                                        <span>
                                          Reference:{" "}
                                          {
                                            event.reference
                                          }
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0"
                                  onClick={() =>
                                    setViewingEventId(
                                      event.id
                                    )
                                  }
                                >
                                  <Eye
                                    aria-hidden="true"
                                  />
                                  View details
                                </Button>
                              </div>
                            </article>
                          )
                        }
                      )}
                    </div>
                  </section>
                )
              )}

              {visibleEvents.length <
              filteredEvents.length ? (
                <div className="flex justify-center border-t pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setVisibleEventCount(
                        (currentCount) =>
                          currentCount +
                          CONSULTATION_AUDIT_INITIAL_VISIBLE_EVENTS
                      )
                    }
                  >
                    Load more events
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            This is a derived development audit
            view. Production audit events must be
            persisted server-side, append-only,
            access-controlled, and protected from
            alteration.
          </p>
        </div>
      </section>

      <ConsultationAuditEventDetailsSheet
        event={viewingEvent}
        open={Boolean(viewingEvent)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingEventId(null)
          }
        }}
      />
    </>
  )
}
