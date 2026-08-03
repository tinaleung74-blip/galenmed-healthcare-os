import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function LaboratoryLoading() {
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
                key={`laboratory-summary-${index + 1}`}
                className="h-24 rounded-xl"
              />
            )
          )}
        </div>

        <div className="rounded-xl border">
          <div className="space-y-3 border-b p-4">
            <Skeleton className="h-8 w-full xl:max-w-sm" />

            <div className="flex flex-wrap gap-2">
              {Array.from(
                { length: 6 },
                (_, index) => (
                  <Skeleton
                    key={`laboratory-filter-${index + 1}`}
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
                  key={`laboratory-row-${index + 1}`}
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
