"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  ChevronDown,
  History,
  LockKeyhole,
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
import {
  SettingsAuditActionBadge,
} from "@/features/settings/components/settings-status-badges"
import {
  SETTINGS_AUDIT_ACTION_LABELS,
  SETTINGS_AUDIT_NOTICE,
  SETTINGS_SECTION_LABELS,
} from "@/features/settings/constants/settings.constants"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import {
  SETTINGS_AUDIT_ACTIONS,
  SETTINGS_SECTIONS,
  type SettingsAuditAction,
  type SettingsAuditRecord,
  type SettingsSection,
} from "@/features/settings/types/settings.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

type AuditableSettingsSection =
  Exclude<
    SettingsSection,
    "audit-history"
  >

interface SettingsAuditFilters {
  search: string

  section:
    | AuditableSettingsSection
    | "all"

  action:
    | SettingsAuditAction
    | "all"
}

const INITIAL_VISIBLE_AUDIT_RECORDS =
  15

const auditableSections =
  SETTINGS_SECTIONS.filter(
    (
      section
    ): section is AuditableSettingsSection =>
      section !==
      "audit-history"
  )

const selectClassName =
  "h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"

function normalizeAuditSearch(
  ...values: Array<
    string | null | undefined
  >
): string {
  return values
    .filter(
      (
        value
      ): value is string =>
        typeof value ===
        "string"
    )
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase(
      "en-PH"
    )
}

function isAuditSectionFilter(
  value: string
): value is
  | AuditableSettingsSection
  | "all" {
  return (
    value === "all" ||
    auditableSections.some(
      (section) =>
        section === value
    )
  )
}

function isAuditActionFilter(
  value: string
): value is
  | SettingsAuditAction
  | "all" {
  return (
    value === "all" ||
    SETTINGS_AUDIT_ACTIONS.some(
      (action) =>
        action === value
    )
  )
}

function formatSnapshot(
  snapshot: string | null
): string {
  if (!snapshot) {
    return "Not recorded"
  }

  try {
    return JSON.stringify(
      JSON.parse(snapshot),
      null,
      2
    )
  } catch {
    return snapshot
  }
}

function matchesAuditSearch(
  record:
    SettingsAuditRecord,

  search: string
): boolean {
  const normalizedSearch =
    normalizeAuditSearch(
      search
    )

  if (!normalizedSearch) {
    return true
  }

  return normalizeAuditSearch(
    record.summary,
    record.actor,
    record.recordId,
    SETTINGS_SECTION_LABELS[
      record.section
    ],
    SETTINGS_AUDIT_ACTION_LABELS[
      record.action
    ],
    record.beforeSnapshot,
    record.afterSnapshot
  ).includes(normalizedSearch)
}

export function SettingsAuditHistory() {
  const {
    auditRecords,
  } = useSettings()

  const [
    filters,
    setFilters,
  ] =
    useState<SettingsAuditFilters>(
      {
        search: "",
        section: "all",
        action: "all",
      }
    )

  const [
    visibleRecordCount,
    setVisibleRecordCount,
  ] = useState(
    INITIAL_VISIBLE_AUDIT_RECORDS
  )

  const sortedRecords =
    useMemo(
      () =>
        [...auditRecords].sort(
          (
            firstRecord,
            secondRecord
          ) =>
            new Date(
              secondRecord.occurredAt
            ).getTime() -
            new Date(
              firstRecord.occurredAt
            ).getTime()
        ),
      [auditRecords]
    )

  const filteredRecords =
    useMemo(
      () =>
        sortedRecords.filter(
          (record) =>
            matchesAuditSearch(
              record,
              filters.search
            ) &&
            (
              filters.section ===
                "all" ||
              record.section ===
                filters.section
            ) &&
            (
              filters.action ===
                "all" ||
              record.action ===
                filters.action
            )
        ),
      [
        filters,
        sortedRecords,
      ]
    )

  const visibleRecords =
    filteredRecords.slice(
      0,
      visibleRecordCount
    )

  const permissionChangeCount =
    auditRecords.filter(
      (record) =>
        record.action ===
        "permission-changed"
    ).length

  const securityChangeCount =
    auditRecords.filter(
      (record) =>
        record.action ===
        "security-changed"
    ).length

  const affectedSectionCount =
    new Set(
      auditRecords.map(
        (record) =>
          record.section
      )
    ).size

  const latestAuditAt =
    sortedRecords[0]
      ?.occurredAt ?? null

  const hasActiveFilters =
    filters.search.trim().length >
      0 ||
    filters.section !== "all" ||
    filters.action !== "all"

  function resetFilters() {
    setFilters({
      search: "",
      section: "all",
      action: "all",
    })

    setVisibleRecordCount(
      INITIAL_VISIBLE_AUDIT_RECORDS
    )
  }

  return (
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
            Configuration Audit History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review append-only organization,
            branch, department, role,
            operational, notification, and
            security configuration changes.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Audit records
            </p>

            <p className="mt-1 text-xl font-semibold">
              {auditRecords.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-200 bg-violet-50/40 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-violet-700">
              Permission changes
            </p>

            <p className="mt-1 text-xl font-semibold text-violet-800">
              {permissionChangeCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/40 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-rose-700">
              Security changes
            </p>

            <p className="mt-1 text-xl font-semibold text-rose-800">
              {securityChangeCount}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Affected sections
            </p>

            <p className="mt-1 text-xl font-semibold">
              {affectedSectionCount}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Latest:{" "}
              {formatPatientDateTime(
                latestAuditAt,
                "No configuration changes"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 rounded-xl border bg-background p-4">
        <div className="flex flex-col gap-2 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={filters.search}
              placeholder="Search configuration change, actor, record, or snapshot"
              className="pl-8"
              onChange={(event) => {
                setFilters(
                  (
                    currentFilters
                  ) => ({
                    ...currentFilters,

                    search:
                      event.target.value,
                  })
                )

                setVisibleRecordCount(
                  INITIAL_VISIBLE_AUDIT_RECORDS
                )
              }}
            />
          </div>

          <select
            value={filters.section}
            className={selectClassName}
            onChange={(event) => {
              const nextSection =
                event.target.value

              if (
                isAuditSectionFilter(
                  nextSection
                )
              ) {
                setFilters(
                  (
                    currentFilters
                  ) => ({
                    ...currentFilters,

                    section:
                      nextSection,
                  })
                )

                setVisibleRecordCount(
                  INITIAL_VISIBLE_AUDIT_RECORDS
                )
              }
            }}
          >
            <option value="all">
              All settings sections
            </option>

            {auditableSections.map(
              (section) => (
                <option
                  key={section}
                  value={section}
                >
                  {
                    SETTINGS_SECTION_LABELS[
                      section
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
                isAuditActionFilter(
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

                setVisibleRecordCount(
                  INITIAL_VISIBLE_AUDIT_RECORDS
                )
              }
            }}
          >
            <option value="all">
              All audit actions
            </option>

            {SETTINGS_AUDIT_ACTIONS.map(
              (action) => (
                <option
                  key={action}
                  value={action}
                >
                  {
                    SETTINGS_AUDIT_ACTION_LABELS[
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
          Showing {visibleRecords.length} of{" "}
          {filteredRecords.length} matching
          audit records
        </p>
      </div>

      {visibleRecords.length ===
      0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
          <History
            className="size-8 text-muted-foreground"
            aria-hidden="true"
          />

          <h3 className="mt-4 font-semibold">
            No matching configuration
            changes
          </h3>

          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Audit records appear after
            organization, branch,
            department, role, operational,
            notification, or security
            configuration is changed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleRecords.map(
            (record) => (
              <details
                key={record.id}
                className="group rounded-xl border bg-background"
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                    <History
                      className="size-4"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {
                          SETTINGS_SECTION_LABELS[
                            record.section
                          ]
                        }
                      </span>

                      <SettingsAuditActionBadge
                        action={
                          record.action
                        }
                      />
                    </div>

                    <p className="mt-2 break-words text-sm font-medium [overflow-wrap:anywhere]">
                      {record.summary}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {formatPatientDateTime(
                          record.occurredAt
                        )}
                      </span>

                      <span>
                        Actor: {record.actor}
                      </span>

                      {record.recordId ? (
                        <span className="font-mono">
                          Record:{" "}
                          {record.recordId}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ChevronDown
                    className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                <div className="grid gap-4 border-t bg-slate-50/70 p-4 lg:grid-cols-2">
                  <section className="min-w-0">
                    <div className="flex items-center gap-2">
                      <LockKeyhole
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />

                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Before configuration
                      </h4>
                    </div>

                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-background p-3 text-xs leading-relaxed [overflow-wrap:anywhere]">
                      {formatSnapshot(
                        record.beforeSnapshot
                      )}
                    </pre>
                  </section>

                  <section className="min-w-0">
                    <div className="flex items-center gap-2">
                      <LockKeyhole
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />

                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        After configuration
                      </h4>
                    </div>

                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-background p-3 text-xs leading-relaxed [overflow-wrap:anywhere]">
                      {formatSnapshot(
                        record.afterSnapshot
                      )}
                    </pre>
                  </section>
                </div>
              </details>
            )
          )}
        </div>
      )}

      {visibleRecords.length <
      filteredRecords.length ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setVisibleRecordCount(
                (currentCount) =>
                  currentCount +
                  INITIAL_VISIBLE_AUDIT_RECORDS
              )
            }
          >
            Load more audit records
          </Button>
        </div>
      ) : null}

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />

        <p>
          {SETTINGS_AUDIT_NOTICE} The current
          development ledger is stored
          locally for workflow testing and
          must not be treated as a
          production compliance log.
        </p>
      </div>
    </section>
  )
}
