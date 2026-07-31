import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function AppointmentsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`appointment-summary-${index + 1}`}
                className="h-28 rounded-xl"
              />
            )
          )}
        </div>

        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="space-y-3 border-b p-4">
            <Skeleton className="h-8 w-full xl:max-w-sm" />

            <div className="flex flex-wrap gap-2">
              {Array.from(
                { length: 7 },
                (_, index) => (
                  <Skeleton
                    key={`appointment-filter-${index + 1}`}
                    className="h-8 w-40"
                  />
                )
              )}
            </div>
          </div>

          <div className="space-y-3 p-4">
            {Array.from(
              { length: 8 },
              (_, index) => (
                <Skeleton
                  key={`appointment-row-${index + 1}`}
                  className="h-20 w-full"
                />
              )
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
