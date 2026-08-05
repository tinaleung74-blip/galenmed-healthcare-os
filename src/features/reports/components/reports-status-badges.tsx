import type {
  ReportDrilldownSeverity,
  ReportMetricTone,
} from "@/features/reports/types/reports.types"
import { cn } from "@/lib/utils"

const metricToneStyles: Record<
  ReportMetricTone,
  string
> = {
  neutral:
    "border-slate-200 bg-slate-50 text-slate-800",

  information:
    "border-sky-200 bg-sky-50 text-sky-800",

  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800",

  warning:
    "border-amber-200 bg-amber-50 text-amber-800",

  danger:
    "border-rose-200 bg-rose-50 text-rose-800",
}

const drilldownSeverityStyles: Record<
  ReportDrilldownSeverity,
  string
> = {
  neutral:
    "border-slate-200 bg-slate-50 text-slate-700",

  information:
    "border-sky-200 bg-sky-50 text-sky-700",

  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  warning:
    "border-amber-200 bg-amber-50 text-amber-700",

  danger:
    "border-rose-200 bg-rose-50 text-rose-700",
}

export function getReportMetricToneClassName(
  tone: ReportMetricTone,
  className?: string
): string {
  return cn(
    metricToneStyles[tone],
    className
  )
}

export function ReportDrilldownSeverityBadge({
  severity,
  label,
}: {
  severity:
    ReportDrilldownSeverity

  label: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        drilldownSeverityStyles[
          severity
        ]
      )}
    >
      {label}
    </span>
  )
}
