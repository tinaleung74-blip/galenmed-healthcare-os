import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`settings-summary-${index + 1}`}
                className="h-28 rounded-xl"
              />
            )
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-2 rounded-xl border p-3">
            {Array.from(
              { length: 13 },
              (_, index) => (
                <Skeleton
                  key={`settings-navigation-${index + 1}`}
                  className="h-10 w-full rounded-lg"
                />
              )
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>

            <div className="space-y-5 rounded-xl border p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from(
                  { length: 6 },
                  (_, index) => (
                    <div
                      key={`settings-field-${index + 1}`}
                      className="space-y-2"
                    >
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  )
                )}
              </div>

              <Skeleton className="h-28 w-full" />

              <div className="flex justify-end">
                <Skeleton className="h-9 w-44" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
