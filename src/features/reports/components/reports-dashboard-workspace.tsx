"use client"

import type {
  LucideIcon,
} from "lucide-react"
import {
  CalendarDays,
  CreditCard,
  Download,
  FileBarChart,
  FlaskConical,
  Pill,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react"
import {
  useMemo,
  useState,
} from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useAppointments,
} from "@/features/appointments/providers/appointment-provider"
import {
  useBilling,
} from "@/features/billing/providers/billing-provider"
import {
  useConsultations,
} from "@/features/consultations/providers/consultation-provider"
import {
  useLaboratoryResults,
} from "@/features/laboratory/providers/laboratory-result-provider"
import {
  useLaboratory,
} from "@/features/laboratory/providers/laboratory-provider"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"
import {
  usePharmacy,
} from "@/features/pharmacy/providers/pharmacy-provider"
import {
  useRadiologyReports,
} from "@/features/radiology/providers/radiology-report-provider"
import {
  useRadiology,
} from "@/features/radiology/providers/radiology-provider"
import { ReportsDrilldownTable } from "@/features/reports/components/reports-drilldown-table"
import { ReportsMetricCard } from "@/features/reports/components/reports-metric-card"
import {
  DEFAULT_REPORTS_FILTERS,
  REPORT_DATE_PRESET_LABELS,
  REPORT_MODULE_DESCRIPTIONS,
  REPORT_MODULE_LABELS,
  REPORT_MODULE_ORDER,
  REPORTS_READ_ONLY_NOTICE,
  REPORTS_SYNTHETIC_NOTICE,
} from "@/features/reports/constants/reports.constants"
import {
  buildReportsSnapshot,
} from "@/features/reports/utils/reports-aggregator"
import { downloadReportsSnapshotCsv } from "@/features/reports/utils/reports-export.utils"
import {
  createReportMetric,
} from "@/features/reports/utils/reports.utils"
import {
  REPORT_DATE_PRESETS,
  type ReportMetric,
  type ReportModule,
  type ReportsFilters,
  type ReportsSnapshot,
} from "@/features/reports/types/reports.types"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { cn } from "@/lib/utils"

const moduleIcons: Record<
  ReportModule,
  LucideIcon
> = {
  patients: Users,
  appointments: CalendarDays,
  consultations: Stethoscope,
  laboratory: FlaskConical,
  radiology: ScanLine,
  pharmacy: Pill,
  billing: CreditCard,
}

const selectClassName =
  "h-8 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"

function getMetricValue(
  snapshot:
    ReportsSnapshot,

  module:
    ReportModule,

  metricId: string
): number {
  return (
    snapshot.modules
      .find(
        (moduleSnapshot) =>
          moduleSnapshot.module ===
          module
      )
      ?.metrics.find(
        (metric) =>
          metric.id === metricId
      )
      ?.value ?? 0
  )
}

export function ReportsDashboardWorkspace() {
  const { patients } =
    usePatients()

  const { appointments } =
    useAppointments()

  const { consultations } =
    useConsultations()

  const {
    laboratoryOrders,
  } = useLaboratory()

  const {
    resultSets:
      laboratoryResultSets,
  } = useLaboratoryResults()

  const {
    radiologyOrders,
  } = useRadiology()

  const {
    reports:
      radiologyReports,
  } = useRadiologyReports()

  const {
    prescriptions:
      pharmacyPrescriptions,
  } = usePharmacy()

  const {
    statements:
      billingStatements,

    payments:
      billingPayments,

    refunds:
      billingRefunds,
  } = useBilling()

  const [
    filters,
    setFilters,
  ] = useState<ReportsFilters>(
    () => ({
      ...DEFAULT_REPORTS_FILTERS,
    })
  )

  const [
    selectedModule,
    setSelectedModule,
  ] = useState<ReportModule>(
    "patients"
  )

  const reportResult =
    useMemo<{
      snapshot:
        ReportsSnapshot | null

      error:
        string | null
    }>(
      () => {
        try {
          return {
            snapshot:
              buildReportsSnapshot({
                filters,

                patients,
                appointments,
                consultations,

                laboratoryOrders,
                laboratoryResultSets,

                radiologyOrders,
                radiologyReports,

                pharmacyPrescriptions,

                billingStatements,
                billingPayments,
                billingRefunds,
              }),

            error: null,
          }
        } catch (error) {
          return {
            snapshot: null,

            error:
              error instanceof Error
                ? error.message
                : "The reports snapshot could not be generated.",
          }
        }
      },
      [
        filters,

        patients,
        appointments,
        consultations,

        laboratoryOrders,
        laboratoryResultSets,

        radiologyOrders,
        radiologyReports,

        pharmacyPrescriptions,

        billingStatements,
        billingPayments,
        billingRefunds,
      ]
    )

  const snapshot =
    reportResult.snapshot

  const selectedModuleSnapshot =
    snapshot?.modules.find(
      (moduleSnapshot) =>
        moduleSnapshot.module ===
        selectedModule
    ) ?? null

  const executiveMetrics =
    useMemo<
      ReportMetric[]
    >(
      () => {
        if (!snapshot) {
          return []
        }

        const releasedClinicalOutputs =
          getMetricValue(
            snapshot,
            "laboratory",
            "laboratory-released"
          ) +
          getMetricValue(
            snapshot,
            "radiology",
            "radiology-released"
          ) +
          getMetricValue(
            snapshot,
            "pharmacy",
            "pharmacy-released"
          )

        return [
          createReportMetric({
            id:
              "executive-new-patients",

            label:
              "New Patient Registrations",

            description:
              "Patients created within the selected reporting period.",

            value:
              getMetricValue(
                snapshot,
                "patients",
                "patients-registered-period"
              ),

            tone:
              "information",
          }),

          createReportMetric({
            id:
              "executive-appointments",

            label:
              "Appointments",

            description:
              "Appointments scheduled within the selected reporting period.",

            value:
              getMetricValue(
                snapshot,
                "appointments",
                "appointments-total"
              ),

            tone:
              "information",
          }),

          createReportMetric({
            id:
              "executive-clinical-releases",

            label:
              "Released Clinical Outputs",

            description:
              "Released laboratory results, radiology reports, and medications.",

            value:
              releasedClinicalOutputs,

            tone:
              releasedClinicalOutputs >
              0
                ? "success"
                : "neutral",
          }),

          createReportMetric({
            id:
              "executive-net-collections",

            label:
              "Net Collections",

            description:
              "Posted payments less posted refunds for the reporting period.",

            value:
              getMetricValue(
                snapshot,
                "billing",
                "billing-net-collections"
              ),

            format:
              "currency-centavos",

            tone:
              "success",
          }),
        ]
      },
      [snapshot]
    )

  function updateFilter<
    Key extends keyof ReportsFilters,
  >(
    key: Key,
    value:
      ReportsFilters[Key]
  ) {
    setFilters(
      (currentFilters) => ({
        ...currentFilters,
        [key]: value,
      })
    )
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_REPORTS_FILTERS,
    })
  }

  const hasActiveFilters =
    filters.branchId !==
      DEFAULT_REPORTS_FILTERS.branchId ||
    filters.datePreset !==
      DEFAULT_REPORTS_FILTERS.datePreset ||
    filters.selectedDate !==
      DEFAULT_REPORTS_FILTERS.selectedDate ||
    filters.customStartDate !==
      DEFAULT_REPORTS_FILTERS.customStartDate ||
    filters.customEndDate !==
      DEFAULT_REPORTS_FILTERS.customEndDate

  const selectedBranchLabel =
    filters.branchId === "all"
      ? "All branches"
      : GALENMED_BRANCHES.find(
          (branch) =>
            branch.id ===
            filters.branchId
        )?.name ??
        filters.branchId

  function handleExportSelectedModule() {
    if (!snapshot) {
      return
    }

    try {
      const fileName =
        downloadReportsSnapshotCsv({
          snapshot,

          modules: [
            selectedModule,
          ],

          branchLabel:
            selectedBranchLabel,
        })

      toast.success(
        "Report module exported",
        {
          description: `${REPORT_MODULE_LABELS[
            selectedModule
          ]} was downloaded as ${fileName}.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to export report",
        {
          description:
            error instanceof Error
              ? error.message
              : "The selected report module could not be exported.",
        }
      )
    }
  }

  function handleExportAllModules() {
    if (!snapshot) {
      return
    }

    try {
      const fileName =
        downloadReportsSnapshotCsv({
          snapshot,

          branchLabel:
            selectedBranchLabel,
        })

      toast.success(
        "Complete report exported",
        {
          description: `All report modules were downloaded as ${fileName}.`,
        }
      )
    } catch (error) {
      toast.error(
        "Unable to export report",
        {
          description:
            error instanceof Error
              ? error.message
              : "The complete report snapshot could not be exported.",
        }
      )
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
            <FileBarChart
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Read-only cross-module
              operational analytics
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Reports Dashboard
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Review patient census,
              appointments, consultations,
              laboratory, radiology,
              pharmacy, billing, and
              collections from one derived
              reporting view.
            </p>
          </div>
        </div>

        {snapshot ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={
                  handleExportSelectedModule
                }
              >
                <Download
                  aria-hidden="true"
                />
                Export module CSV
              </Button>

              <Button
                type="button"
                className="bg-sky-700 text-white hover:bg-sky-800"
                onClick={
                  handleExportAllModules
                }
              >
                <Download
                  aria-hidden="true"
                />
                Export all CSV
              </Button>
            </div>

            <div className="rounded-xl border bg-slate-50 px-4 py-3 text-xs text-muted-foreground">
              <p>
                Generated
              </p>

              <p className="mt-1 font-medium text-foreground">
                {formatPatientDateTime(
                  snapshot.generatedAt
                )}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <section className="space-y-4 rounded-xl border bg-background p-4">
        <div>
          <h2 className="text-sm font-semibold">
            Global report filters
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            The selected date acts as the
            ending date for rolling and
            month-to-date presets.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="reports-branch"
              className="text-xs font-medium"
            >
              Branch
            </label>

            <select
              id="reports-branch"
              value={filters.branchId}
              className={selectClassName}
              onChange={(event) =>
                updateFilter(
                  "branchId",
                  event.target.value
                )
              }
            >
              <option value="all">
                All branches
              </option>

              {GALENMED_BRANCHES.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reports-date-preset"
              className="text-xs font-medium"
            >
              Date range
            </label>

            <select
              id="reports-date-preset"
              value={
                filters.datePreset
              }
              className={selectClassName}
              onChange={(event) =>
                updateFilter(
                  "datePreset",
                  event.target
                    .value as
                    ReportsFilters["datePreset"]
                )
              }
            >
              {REPORT_DATE_PRESETS.map(
                (datePreset) => (
                  <option
                    key={datePreset}
                    value={datePreset}
                  >
                    {
                      REPORT_DATE_PRESET_LABELS[
                        datePreset
                      ]
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {filters.datePreset !==
          "all" ? (
            <div className="space-y-1.5">
              <label
                htmlFor="reports-selected-date"
                className="text-xs font-medium"
              >
                Selected date
              </label>

              <Input
                id="reports-selected-date"
                type="date"
                value={
                  filters.selectedDate
                }
                className="w-auto"
                onChange={(event) =>
                  updateFilter(
                    "selectedDate",
                    event.target.value
                  )
                }
              />
            </div>
          ) : null}

          {filters.datePreset ===
          "custom" ? (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="reports-custom-start"
                  className="text-xs font-medium"
                >
                  Custom start
                </label>

                <Input
                  id="reports-custom-start"
                  type="date"
                  value={
                    filters.customStartDate
                  }
                  className="w-auto"
                  onChange={(event) =>
                    updateFilter(
                      "customStartDate",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reports-custom-end"
                  className="text-xs font-medium"
                >
                  Custom end
                </label>

                <Input
                  id="reports-custom-end"
                  type="date"
                  value={
                    filters.customEndDate
                  }
                  className="w-auto"
                  onChange={(event) =>
                    updateFilter(
                      "customEndDate",
                      event.target.value
                    )
                  }
                />
              </div>
            </>
          ) : null}

          {hasActiveFilters ? (
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                onClick={resetFilters}
              >
                <RotateCcw
                  aria-hidden="true"
                />
                Reset filters
              </Button>
            </div>
          ) : null}
        </div>

        {snapshot ? (
          <p className="text-xs text-muted-foreground">
            Reporting period:{" "}
            <strong className="font-medium text-foreground">
              {
                snapshot.dateRange.label
              }
            </strong>
          </p>
        ) : null}
      </section>

      {reportResult.error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <p className="font-semibold">
            Report filters are invalid
          </p>

          <p className="mt-1">
            {reportResult.error}
          </p>
        </div>
      ) : null}

      {snapshot ? (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">
                Executive summary
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Selected cross-module
                indicators for the current
                reporting scope.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {executiveMetrics.map(
                (metric) => (
                  <ReportsMetricCard
                    key={metric.id}
                    metric={metric}
                  />
                )
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">
                Report modules
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Select a module to review
                its metrics and source
                record drill-down.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {REPORT_MODULE_ORDER.map(
                (module) => {
                  const Icon =
                    moduleIcons[module]

                  const moduleSnapshot =
                    snapshot.modules.find(
                      (
                        candidateSnapshot
                      ) =>
                        candidateSnapshot.module ===
                        module
                    ) ?? null

                  const isSelected =
                    selectedModule ===
                    module

                  return (
                    <button
                      key={module}
                      type="button"
                      className={cn(
                        "min-w-0 rounded-xl border p-4 text-left transition-colors",
                        isSelected
                          ? "border-sky-300 bg-sky-50 text-sky-900"
                          : "bg-background hover:bg-slate-50"
                      )}
                      onClick={() =>
                        setSelectedModule(
                          module
                        )
                      }
                    >
                      <Icon
                        className="size-4"
                        aria-hidden="true"
                      />

                      <p className="mt-3 break-words text-sm font-semibold [overflow-wrap:anywhere]">
                        {
                          REPORT_MODULE_LABELS[
                            module
                          ]
                        }
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {moduleSnapshot
                          ?.drilldownRows
                          .length ?? 0}{" "}
                        record
                        {(moduleSnapshot
                          ?.drilldownRows
                          .length ?? 0) ===
                        1
                          ? ""
                          : "s"}
                      </p>
                    </button>
                  )
                }
              )}
            </div>
          </section>

          {selectedModuleSnapshot ? (
            <section className="space-y-5">
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon =
                    moduleIcons[
                      selectedModule
                    ]

                  return (
                    <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
                      <Icon
                        className="size-5"
                        aria-hidden="true"
                      />
                    </div>
                  )
                })()}

                <div>
                  <h2 className="text-xl font-semibold">
                    {
                      REPORT_MODULE_LABELS[
                        selectedModule
                      ]
                    }
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {
                      REPORT_MODULE_DESCRIPTIONS[
                        selectedModule
                      ]
                    }
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {selectedModuleSnapshot.metrics.map(
                  (metric) => (
                    <ReportsMetricCard
                      key={metric.id}
                      metric={metric}
                    />
                  )
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold">
                    Read-only drill-down
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Expand a row to inspect
                    the available synthetic
                    source-record metadata.
                  </p>
                </div>

                <ReportsDrilldownTable
                  key={selectedModule}
                  rows={
                    selectedModuleSnapshot.drilldownRows
                  }
                />
              </div>
            </section>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                {
                  REPORTS_READ_ONLY_NOTICE
                }
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                {
                  REPORTS_SYNTHETIC_NOTICE
                }
              </p>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
