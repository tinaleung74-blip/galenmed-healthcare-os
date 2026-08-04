"use client"

import type {
  LucideIcon,
} from "lucide-react"
import {
  BadgeCheck,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  History,
  LockKeyhole,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  TestTube2,
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
import {
  LaboratoryAuditActionBadge,
  LaboratoryAuditCategoryBadge,
} from "@/features/laboratory/components/laboratory-audit-badges"
import {
  DEFAULT_LABORATORY_AUDIT_FILTERS,
  LABORATORY_AUDIT_ACTION_LABELS,
  LABORATORY_AUDIT_CATEGORY_LABELS,
  LABORATORY_AUDIT_INITIAL_VISIBLE_EVENTS,
} from "@/features/laboratory/constants/laboratory-audit.constants"
import { useLaboratoryResults } from "@/features/laboratory/providers/laboratory-result-provider"
import {
  LABORATORY_AUDIT_EVENT_ACTIONS,
  LABORATORY_AUDIT_EVENT_CATEGORIES,
  type LaboratoryAuditEvent,
  type LaboratoryAuditEventAction,
  type LaboratoryAuditEventCategory,
  type LaboratoryAuditEventDetail,
  type LaboratoryAuditFilters,
} from "@/features/laboratory/types/laboratory-audit.types"
import type {
  LaboratoryOrder,
} from "@/features/laboratory/types/laboratory.types"
import {
  buildLaboratoryAuditEvents,
} from "@/features/laboratory/utils/laboratory-audit.utils"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface LaboratoryAuditHistoryProps {
  order: LaboratoryOrder
}

const categoryIcons: Record<
  LaboratoryAuditEventCategory,
  LucideIcon
> = {
  order: FlaskConical,
  specimen: TestTube2,
  processing: Play,
  result: ClipboardList,
  verification: BadgeCheck,
  release: Send,
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"

function isCategoryFilter(
  value: string
): value is
  | LaboratoryAuditEventCategory
  | "all" {
  return (
    value === "all" ||
    LABORATORY_AUDIT_EVENT_CATEGORIES.some(
      (category) =>
        category === value
    )
  )
}

function isActionFilter(
  value: string
): value is
  | LaboratoryAuditEventAction
  | "all" {
  return (
    value === "all" ||
    LABORATORY_AUDIT_EVENT_ACTIONS.some(
      (action) =>
        action === value
    )
  )
}

function protectSensitiveValue(
  detail:
    LaboratoryAuditEventDetail
): string {
  if (!detail.sensitive) {
    return detail.value
  }

  const normalizedLabel =
    detail.label
      .trim()
      .toLocaleLowerCase(
        "en-PH"
      )

  if (
    normalizedLabel.includes(
      "reference"
    ) ||
    normalizedLabel.includes(
      "accession"
    )
  ) {
    const suffix =
      detail.value
        .trim()
        .slice(-4)

    return suffix
      ? `•••• ${suffix}`
      : "Protected reference"
  }

  return "Protected laboratory content"
}

function matchesAuditSearch(
  event: LaboratoryAuditEvent,
  search: string
): boolean {
  const normalizedSearch =
    normalizePatientSearch(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableDetails =
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
    LABORATORY_AUDIT_CATEGORY_LABELS[
      event.category
    ],
    LABORATORY_AUDIT_ACTION_LABELS[
      event.action
    ],
    ...searchableDetails
  ).includes(normalizedSearch)
}

export function LaboratoryAuditHistory({
  order,
}: LaboratoryAuditHistoryProps) {
  const { resultSets } =
    useLaboratoryResults()

  const [filters, setFilters] =
    useState<LaboratoryAuditFilters>(
      () => ({
        ...DEFAULT_LABORATORY_AUDIT_FILTERS,
      })
    )

  const [
    visibleEventCount,
    setVisibleEventCount,
  ] = useState(
    LABORATORY_AUDIT_INITIAL_VISIBLE_EVENTS
  )

  const auditEvents = useMemo(
    () =>
      buildLaboratoryAuditEvents({
        order,
        resultSets,
      }),
    [order, resultSets]
  )

  const filteredEvents = useMemo(
    () =>
      auditEvents.filter(
        (event) => {
          const matchesSearch =
            matchesAuditSearch(
              event,
              filters.search
            )

          const matchesCategory =
            filters.category ===
              "all" ||
            event.category ===
              filters.category

          const matchesAction =
            filters.action ===
              "all" ||
            event.action ===
              filters.action

          return (
            matchesSearch &&
            matchesCategory &&
            matchesAction
          )
        }
      ),
    [auditEvents, filters]
  )

  const visibleEvents =
    filteredEvents.slice(
      0,
      visibleEventCount
    )

  const specimenEvents =
    auditEvents.filter(
      (event) =>
        event.category ===
        "specimen"
    ).length

  const resultEvents =
    auditEvents.filter(
      (event) =>
        event.category ===
        "result"
    ).length

  const verificationEvents =
    auditEvents.filter(
      (event) =>
        event.category ===
          "verification" ||
        event.category ===
          "release"
    ).length

  const hasActiveFilters =
    filters.search.trim().length >
      0 ||
    filters.category !== "all" ||
    filters.action !== "all"

  function resetFilters() {
    setFilters({
      ...DEFAULT_LABORATORY_AUDIT_FILTERS,
    })

    setVisibleEventCount(
      LABORATORY_AUDIT_INITIAL_VISIBLE_EVENTS
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
            Laboratory Audit History
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Read-only order, specimen,
            processing, result,
            verification, and release
            events.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              Specimen events
            </p>

            <p className="mt-1 font-semibold">
              {specimenEvents}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              Result events
            </p>

            <p className="mt-1 font-semibold">
              {resultEvents}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              Verification / Release
            </p>

            <p className="mt-1 font-semibold">
              {verificationEvents}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-col gap-2 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={filters.search}
              placeholder="Search laboratory audit events or actors"
              className="pl-8"
              onChange={(event) =>
                setFilters(
                  (
                    currentFilters
                  ) => ({
                    ...currentFilters,
                    search:
                      event.target.value,
                  })
                )
              }
            />
          </div>

          <select
            value={filters.category}
            className={selectClassName}
            onChange={(event) => {
              const nextCategory =
                event.target.value

              if (
                isCategoryFilter(
                  nextCategory
                )
              ) {
                setFilters(
                  (
                    currentFilters
                  ) => ({
                    ...currentFilters,
                    category:
                      nextCategory,
                  })
                )
              }
            }}
          >
            <option value="all">
              All laboratory modules
            </option>

            {LABORATORY_AUDIT_EVENT_CATEGORIES.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {
                    LABORATORY_AUDIT_CATEGORY_LABELS[
                      category
                    ]
                  }
                </option>
              )
            )}
          </select>

          <select
            value={filters.action}
            className={selectClassName}
            onChange={(event) => {
              const nextAction =
                event.target.value

              if (
                isActionFilter(
                  nextAction
                )
              ) {
                setFilters(
                  (
                    currentFilters
                  ) => ({
                    ...currentFilters,
                    action:
                      nextAction,
                  })
                )
              }
            }}
          >
            <option value="all">
              All audit actions
            </option>

            {LABORATORY_AUDIT_EVENT_ACTIONS.map(
              (action) => (
                <option
                  key={action}
                  value={action}
                >
                  {
                    LABORATORY_AUDIT_ACTION_LABELS[
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
          {filteredEvents.length} audit
          events
        </p>

        {visibleEvents.length ===
        0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No matching Laboratory Audit
            events.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleEvents.map(
              (event) => {
                const Icon =
                  categoryIcons[
                    event.category
                  ]

                return (
                  <details
                    key={event.id}
                    className="group rounded-xl border bg-background"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                        <Icon
                          className="size-4"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <LaboratoryAuditCategoryBadge
                            category={
                              event.category
                            }
                          />

                          <LaboratoryAuditActionBadge
                            action={
                              event.action
                            }
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
                          (
                            detail,
                            index
                          ) => (
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

                                {
                                  detail.label
                                }
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
                )
              }
            )}
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
                    LABORATORY_AUDIT_INITIAL_VISIBLE_EVENTS
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
          This development audit view is
          derived from Laboratory Order,
          Specimen, and Result timestamps.
          Production audit events must be
          append-only, server-managed, and
          access-controlled.
        </p>
      </div>
    </section>
  )
}
