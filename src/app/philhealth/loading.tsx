import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function PhilHealthLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-96 max-w-full" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>

        <Skeleton className="h-28 rounded-xl" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`philhealth-summary-${index + 1}`}
                className="h-24 rounded-xl"
              />
            )
          )}
        </div>

        <Skeleton className="h-20 rounded-xl" />

        <div className="overflow-hidden rounded-xl border">
          <div className="space-y-3 border-b p-4">
            <Skeleton className="h-8 w-full max-w-md" />

            <div className="flex gap-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-8 w-44" />
            </div>
          </div>

          <div className="space-y-3 p-4">
            {Array.from(
              { length: 6 },
              (_, index) => (
                <Skeleton
                  key={`philhealth-row-${index + 1}`}
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
