import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  getReportMetricToneClassName,
} from "@/features/reports/components/reports-status-badges"
import type {
  ReportMetric,
} from "@/features/reports/types/reports.types"
import {
  formatReportMetricValue,
} from "@/features/reports/utils/reports.utils"

interface ReportsMetricCardProps {
  metric: ReportMetric
}

export function ReportsMetricCard({
  metric,
}: ReportsMetricCardProps) {
  return (
    <Card
      className={getReportMetricToneClassName(
        metric.tone,
        "min-w-0 overflow-hidden shadow-none"
      )}
    >
      <CardContent className="min-w-0 p-4">
        <p className="break-words text-xs font-medium [overflow-wrap:anywhere]">
          {metric.label}
        </p>

        <p className="mt-2 max-w-full break-words text-xl font-semibold leading-tight tabular-nums [overflow-wrap:anywhere]">
          {formatReportMetricValue(
            metric
          )}
        </p>

        {metric.description ? (
          <p className="mt-2 break-words text-xs leading-relaxed opacity-75 [overflow-wrap:anywhere]">
            {metric.description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
