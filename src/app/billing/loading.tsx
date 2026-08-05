import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function BillingLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`billing-summary-${index + 1}`}
                className="h-24 rounded-xl"
              />
            )
          )}
        </div>

        <Skeleton className="h-24 rounded-xl" />

        <div className="overflow-hidden rounded-xl border">
          <div className="space-y-3 border-b p-4">
            <Skeleton className="h-8 w-full xl:max-w-sm" />

            <div className="flex flex-wrap gap-2">
              {Array.from(
                { length: 5 },
                (_, index) => (
                  <Skeleton
                    key={`billing-filter-${index + 1}`}
                    className="h-8 w-40"
                  />
                )
              )}
            </div>
          </div>

          <div className="space-y-3 p-4">
            {Array.from(
              { length: 6 },
              (_, index) => (
                <Skeleton
                  key={`billing-row-${index + 1}`}
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
