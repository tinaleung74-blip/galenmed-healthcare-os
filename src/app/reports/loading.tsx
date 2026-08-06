import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>

        <Skeleton className="h-36 rounded-xl" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`reports-executive-${index + 1}`}
                className="h-28 rounded-xl"
              />
            )
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {Array.from(
            { length: 7 },
            (_, index) => (
              <Skeleton
                key={`reports-module-${index + 1}`}
                className="h-28 rounded-xl"
              />
            )
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 8 },
            (_, index) => (
              <Skeleton
                key={`reports-metric-${index + 1}`}
                className="h-28 rounded-xl"
              />
            )
          )}
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="space-y-3 border-b p-4">
            <Skeleton className="h-8 w-full max-w-md" />

            <div className="flex gap-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>

          <div className="space-y-3 p-4">
            {Array.from(
              { length: 6 },
              (_, index) => (
                <Skeleton
                  key={`reports-row-${index + 1}`}
                  className="h-16 w-full"
                />
              )
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
