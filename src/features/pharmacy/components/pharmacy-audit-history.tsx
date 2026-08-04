"use client"

import type {
  LucideIcon,
} from "lucide-react"
import {
  BadgeCheck,
  ChevronDown,
  History,
  LockKeyhole,
  MessageSquare,
  PackageCheck,
  Pill,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
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
  PharmacyAuditActionBadge,
  PharmacyAuditCategoryBadge,
} from "@/features/pharmacy/components/pharmacy-audit-badges"
import {
  DEFAULT_PHARMACY_AUDIT_FILTERS,
  PHARMACY_AUDIT_ACTION_LABELS,
  PHARMACY_AUDIT_CATEGORY_LABELS,
  PHARMACY_AUDIT_INITIAL_VISIBLE_EVENTS,
} from "@/features/pharmacy/constants/pharmacy-audit.constants"
import {
  PHARMACY_AUDIT_EVENT_ACTIONS,
  PHARMACY_AUDIT_EVENT_CATEGORIES,
  type PharmacyAuditEvent,
  type PharmacyAuditEventAction,
  type PharmacyAuditEventCategory,
  type PharmacyAuditEventDetail,
  type PharmacyAuditFilters,
} from "@/features/pharmacy/types/pharmacy-audit.types"
import type {
  PharmacyPrescription,
} from "@/features/pharmacy/types/pharmacy.types"
import {
  buildPharmacyAuditEvents,
} from "@/features/pharmacy/utils/pharmacy-audit.utils"
import {
  formatPatientDateTime,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"

interface PharmacyAuditHistoryProps {
  prescription:
    PharmacyPrescription
}

const categoryIcons: Record<
  PharmacyAuditEventCategory,
  LucideIcon
> = {
  prescription: Pill,
  "safety-review": ShieldCheck,
  dispensing: PackageCheck,
  verification: BadgeCheck,
  counseling: MessageSquare,
  release: Send,
}

const selectClassName =
  "h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"

function isCategoryFilter(
  value: string
): value is
  | PharmacyAuditEventCategory
  | "all" {
  return (
    value === "all" ||
    PHARMACY_AUDIT_EVENT_CATEGORIES.some(
      (category) =>
        category === value
    )
  )
}

function isActionFilter(
  value: string
): value is
  | PharmacyAuditEventAction
  | "all" {
  return (
    value === "all" ||
    PHARMACY_AUDIT_EVENT_ACTIONS.some(
      (action) =>
        action === value
    )
  )
}

function protectSensitiveValue(
  detail:
    PharmacyAuditEventDetail
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
      "batch"
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

  return "Protected pharmacy content"
}

function matchesAuditSearch(
  event: PharmacyAuditEvent,
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
    PHARMACY_AUDIT_CATEGORY_LABELS[
      event.category
    ],
    PHARMACY_AUDIT_ACTION_LABELS[
      event.action
    ],
    ...searchableDetails
  ).includes(normalizedSearch)
}

export function PharmacyAuditHistory({
  prescription,
}: PharmacyAuditHistoryProps) {
  const [filters, setFilters] =
    useState<PharmacyAuditFilters>(
      () => ({
        ...DEFAULT_PHARMACY_AUDIT_FILTERS,
      })
    )

  const [
    visibleEventCount,
    setVisibleEventCount,
  ] = useState(
    PHARMACY_AUDIT_INITIAL_VISIBLE_EVENTS
  )

  const auditEvents =
    useMemo(
      () =>
        buildPharmacyAuditEvents(
          prescription
        ),
      [prescription]
    )

  const filteredEvents =
    useMemo(
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

  const reviewEventCount =
    auditEvents.filter(
      (event) =>
        event.category ===
        "safety-review"
    ).length

  const dispensingEventCount =
    auditEvents.filter(
      (event) =>
        event.category ===
        "dispensing"
    ).length

  const releaseWorkflowCount =
    auditEvents.filter(
      (event) =>
        event.category ===
          "verification" ||
        event.category ===
          "counseling" ||
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
      ...DEFAULT_PHARMACY_AUDIT_FILTERS,
    })

    setVisibleEventCount(
      PHARMACY_AUDIT_INITIAL_VISIBLE_EVENTS
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
            Pharmacy Audit History
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Read-only prescription,
            safety-review, dispensing,
            verification, counseling, and
            release events.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              Safety-review events
            </p>

            <p className="mt-1 font-semibold">
              {reviewEventCount}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              Dispensing events
            </p>

            <p className="mt-1 font-semibold">
              {dispensingEventCount}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              Verification / Release
            </p>

            <p className="mt-1 font-semibold">
              {releaseWorkflowCount}
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
              placeholder="Search Pharmacy Audit events or actors"
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
              All pharmacy modules
            </option>

            {PHARMACY_AUDIT_EVENT_CATEGORIES.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {
                    PHARMACY_AUDIT_CATEGORY_LABELS[
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

            {PHARMACY_AUDIT_EVENT_ACTIONS.map(
              (action) => (
                <option
                  key={action}
                  value={action}
                >
                  {
                    PHARMACY_AUDIT_ACTION_LABELS[
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
            No matching Pharmacy Audit
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
                          <PharmacyAuditCategoryBadge
                            category={
                              event.category
                            }
                          />

                          <PharmacyAuditActionBadge
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
                    PHARMACY_AUDIT_INITIAL_VISIBLE_EVENTS
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
          derived from Pharmacy
          Prescription, Safety Review,
          Dispensing Ledger, Verification,
          Counseling, and Release records.
          Production audit events must be
          append-only, server-managed, and
          access-controlled.
        </p>
      </div>
    </section>
  )
}
