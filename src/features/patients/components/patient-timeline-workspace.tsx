"use client"

import {
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  BadgeCheck,
  ClipboardList,
  ExternalLink,
  Eye,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PatientTimelineEventDetailsSheet } from "@/features/patients/components/patient-timeline-event-details-sheet"
import {
  PatientTimelineActionBadge,
  PatientTimelineCategoryBadge,
} from "@/features/patients/components/patient-timeline-event-badges"
import {
  DEFAULT_PATIENT_TIMELINE_FILTERS,
  PATIENT_TIMELINE_ACTION_LABELS,
  PATIENT_TIMELINE_CATEGORY_LABELS,
  PATIENT_TIMELINE_DATE_FILTER_LABELS,
  PATIENT_TIMELINE_INITIAL_VISIBLE_EVENTS,
} from "@/features/patients/constants/patient-timeline.constants"
import { useLaboratoryResults } from "@/features/laboratory/providers/laboratory-result-provider"
import { useLaboratory } from "@/features/laboratory/providers/laboratory-provider"
import { useRadiologyReports } from "@/features/radiology/providers/radiology-report-provider"
import { useRadiology } from "@/features/radiology/providers/radiology-provider"
import { usePatientAllergies } from "@/features/patients/providers/patient-allergy-provider"
import { usePatientDocuments } from "@/features/patients/providers/patient-documents-provider"
import { usePatientInsurance } from "@/features/patients/providers/patient-insurance-provider"
import { usePatientMedicalHistory } from "@/features/patients/providers/patient-medical-history-provider"
import { usePatientVitalSigns } from "@/features/patients/providers/patient-vital-signs-provider"
import {
  PATIENT_TIMELINE_DATE_FILTERS,
  PATIENT_TIMELINE_EVENT_ACTIONS,
  PATIENT_TIMELINE_EVENT_CATEGORIES,
  type PatientTimelineDateFilter,
  type PatientTimelineEvent,
  type PatientTimelineEventAction,
  type PatientTimelineEventCategory,
  type PatientTimelineFilters,
} from "@/features/patients/types/patient-timeline.types"
import type { Patient } from "@/features/patients/types/patient.types"
import { buildPatientTimelineEvents } from "@/features/patients/utils/patient-timeline.utils"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import { cn } from "@/lib/utils"

interface PatientTimelineWorkspaceProps {
  patient: Patient
}

interface TimelineDateGroup {
  key: string
  label: string
  events: PatientTimelineEvent[]
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"

const timelineDateHeadingFormatter =
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

function getLocalDateKey(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "invalid-date"
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function getTimelineDateLabel(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable"
  }

  return timelineDateHeadingFormatter.format(
    date
  )
}

function isCategoryFilter(
  value: string
): value is
  | PatientTimelineEventCategory
  | "all" {
  return (
    value === "all" ||
    PATIENT_TIMELINE_EVENT_CATEGORIES.some(
      (category) => category === value
    )
  )
}

function isActionFilter(
  value: string
): value is
  | PatientTimelineEventAction
  | "all" {
  return (
    value === "all" ||
    PATIENT_TIMELINE_EVENT_ACTIONS.some(
      (action) => action === value
    )
  )
}

function isDateFilter(
  value: string
): value is PatientTimelineDateFilter {
  return PATIENT_TIMELINE_DATE_FILTERS.some(
    (dateFilter) => dateFilter === value
  )
}

function matchesTimelineDateRange(
  occurredAt: string,
  dateRange: PatientTimelineDateFilter
): boolean {
  if (dateRange === "all") {
    return true
  }

  const eventDate = new Date(occurredAt)

  if (Number.isNaN(eventDate.getTime())) {
    return false
  }

  const currentDate = new Date()
  const earliestDate = new Date(currentDate)

  if (dateRange === "last-30-days") {
    earliestDate.setDate(
      earliestDate.getDate() - 30
    )
  }

  if (dateRange === "last-90-days") {
    earliestDate.setDate(
      earliestDate.getDate() - 90
    )
  }

  if (dateRange === "last-12-months") {
    earliestDate.setFullYear(
      earliestDate.getFullYear() - 1
    )
  }

  return (
    eventDate >= earliestDate &&
    eventDate <= currentDate
  )
}

function matchesTimelineSearch(
  event: PatientTimelineEvent,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const nonSensitiveDetails = event.details
    .filter((detail) => !detail.sensitive)
    .map((detail) => detail.value)

  const searchableEvent =
    normalizePatientSearch(
      event.title,
      event.summary,
      event.actor,
      event.reference,
      PATIENT_TIMELINE_CATEGORY_LABELS[
        event.category
      ],
      PATIENT_TIMELINE_ACTION_LABELS[
        event.action
      ],
      ...nonSensitiveDetails
    )

  return searchableEvent.includes(
    normalizedSearch
  )
}

function groupTimelineEvents(
  events: PatientTimelineEvent[]
): TimelineDateGroup[] {
  const groups =
    new Map<string, PatientTimelineEvent[]>()

  events.forEach((event) => {
    const dateKey = getLocalDateKey(
      event.occurredAt
    )

    const currentEvents =
      groups.get(dateKey) ?? []

    currentEvents.push(event)
    groups.set(dateKey, currentEvents)
  })

  return Array.from(groups.entries()).map(
    ([key, groupedEvents]) => ({
      key,
      label: getTimelineDateLabel(
        groupedEvents[0]?.occurredAt ?? ""
      ),
      events: groupedEvents,
    })
  )
}

export function PatientTimelineWorkspace({
  patient,
}: PatientTimelineWorkspaceProps) {
  const router = useRouter()

  const {
    medicalHistoryRecords,
  } = usePatientMedicalHistory()

  const { vitalSignsRecords } =
    usePatientVitalSigns()

  const { allergyRecords } =
    usePatientAllergies()

  const { insuranceRecords } =
    usePatientInsurance()

  const { documentRecords } =
    usePatientDocuments()

  const { laboratoryOrders } =
    useLaboratory()

  const {
    resultSets:
      laboratoryResultSets,
  } = useLaboratoryResults()

  const { radiologyOrders } =
    useRadiology()

  const {
    reports:
      radiologyReports,
  } = useRadiologyReports()

  const [filters, setFilters] =
    useState<PatientTimelineFilters>(() => ({
      ...DEFAULT_PATIENT_TIMELINE_FILTERS,
    }))

  const [
    visibleEventCount,
    setVisibleEventCount,
  ] = useState(
    PATIENT_TIMELINE_INITIAL_VISIBLE_EVENTS
  )

  const [
    viewingEventId,
    setViewingEventId,
  ] = useState<string | null>(null)

  const timelineEvents = useMemo(
    () =>
      buildPatientTimelineEvents({
        patient,
        medicalHistoryRecords,
        vitalSignsRecords,
        allergyRecords,
        insuranceRecords,
        documentRecords,
        laboratoryOrders,
        laboratoryResultSets,
        radiologyOrders,
        radiologyReports,
      }),
    [
      patient,
      medicalHistoryRecords,
      vitalSignsRecords,
      allergyRecords,
      insuranceRecords,
      documentRecords,
      laboratoryOrders,
      laboratoryResultSets,
      radiologyOrders,
      radiologyReports,
    ]
  )

  const filteredEvents = useMemo(
    () =>
      timelineEvents.filter((event) => {
        const matchesSearch =
          matchesTimelineSearch(
            event,
            filters.search
          )

        const matchesCategory =
          filters.category === "all" ||
          event.category === filters.category

        const matchesAction =
          filters.action === "all" ||
          event.action === filters.action

        const matchesDate =
          matchesTimelineDateRange(
            event.occurredAt,
            filters.dateRange
          )

        return (
          matchesSearch &&
          matchesCategory &&
          matchesAction &&
          matchesDate
        )
      }),
    [timelineEvents, filters]
  )

  const visibleEvents =
    filteredEvents.slice(0, visibleEventCount)

  const groupedEvents = useMemo(
    () => groupTimelineEvents(visibleEvents),
    [visibleEvents]
  )

  const viewingEvent =
    timelineEvents.find(
      (event) =>
        event.id === viewingEventId
    ) ?? null

  const clinicalEventCount =
    timelineEvents.filter(
      (event) =>
        event.category ===
          "medical-history" ||
        event.category === "vital-signs" ||
        event.category === "allergy" ||
        event.category === "laboratory" ||
        event.category === "radiology"
    ).length

  const verifiedEventCount =
    timelineEvents.filter(
      (event) => event.action === "verified"
    ).length

  const archivedEventCount =
    timelineEvents.filter(
      (event) => event.action === "archived"
    ).length

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.category !== "all" ||
    filters.action !== "all" ||
    filters.dateRange !== "all"

  function updateFilter<
    Key extends keyof PatientTimelineFilters,
  >(
    key: Key,
    value: PatientTimelineFilters[Key]
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))

    setVisibleEventCount(
      PATIENT_TIMELINE_INITIAL_VISIBLE_EVENTS
    )
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_PATIENT_TIMELINE_FILTERS,
    })

    setVisibleEventCount(
      PATIENT_TIMELINE_INITIAL_VISIBLE_EVENTS
    )
  }

  function openSourceModule(
    event: PatientTimelineEvent
  ) {
    setViewingEventId(null)

    router.push(
      `/patients/${encodeURIComponent(
        patient.medicalRecordNumber
      )}?section=${event.sourceSection}`
    )
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
            <History
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Patient Timeline
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Read-only chronological activity derived
              from the patient profile and clinical
              modules.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                <History
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Total events
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {timelineEvents.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
                <ClipboardList
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Clinical events
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {clinicalEventCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <BadgeCheck
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Verification events
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {verifiedEventCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Archive
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Archive events
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {archivedEventCount}
                </p>
              </div>
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
                  placeholder="Search timeline events, references, or actors"
                  aria-label="Search patient timeline"
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
                  aria-label="Filter timeline category"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isCategoryFilter(
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

                  {PATIENT_TIMELINE_EVENT_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {
                          PATIENT_TIMELINE_CATEGORY_LABELS[
                            category
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.action}
                  aria-label="Filter timeline action"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isActionFilter(
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

                  {PATIENT_TIMELINE_EVENT_ACTIONS.map(
                    (action) => (
                      <option
                        key={action}
                        value={action}
                      >
                        {
                          PATIENT_TIMELINE_ACTION_LABELS[
                            action
                          ]
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filters.dateRange}
                  aria-label="Filter timeline date range"
                  className={selectClassName}
                  onChange={(event) => {
                    if (
                      isDateFilter(
                        event.target.value
                      )
                    ) {
                      updateFilter(
                        "dateRange",
                        event.target.value
                      )
                    }
                  }}
                >
                  {PATIENT_TIMELINE_DATE_FILTERS.map(
                    (dateFilter) => (
                      <option
                        key={dateFilter}
                        value={dateFilter}
                      >
                        {
                          PATIENT_TIMELINE_DATE_FILTER_LABELS[
                            dateFilter
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
                    <RotateCcw aria-hidden="true" />
                    Reset
                  </Button>
                ) : null}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {visibleEvents.length} of{" "}
              {filteredEvents.length} matching events
            </p>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <History
                className="size-8 text-teal-700"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No timeline activity
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                No patient-profile or clinical events are
                available for this patient.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <Search
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-base font-semibold">
                No matching timeline events
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
              {groupedEvents.map((group) => (
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
                    {group.events.map((event) => (
                      <article
                        key={event.id}
                        className={cn(
                          "rounded-xl border p-4 transition-colors hover:bg-slate-50",
                          event.action === "archived" &&
                            "border-slate-200 bg-slate-50/70"
                        )}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2">
                              <PatientTimelineCategoryBadge
                                category={
                                  event.category
                                }
                              />

                              <PatientTimelineActionBadge
                                action={event.action}
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
                                  {event.reference}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setViewingEventId(
                                  event.id
                                )
                              }
                            >
                              <Eye aria-hidden="true" />
                              View details
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openSourceModule(event)
                              }
                            >
                              <ExternalLink
                                aria-hidden="true"
                              />
                              Open source
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}

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
                          PATIENT_TIMELINE_INITIAL_VISIBLE_EVENTS
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

        <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs text-teal-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            The timeline is a read-only operational view.
            Source records remain authoritative and must
            be changed through their dedicated modules.
          </p>
        </div>
      </section>

      <PatientTimelineEventDetailsSheet
        event={viewingEvent}
        open={Boolean(viewingEvent)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingEventId(null)
          }
        }}
        onOpenSource={openSourceModule}
      />
    </>
  )
}
