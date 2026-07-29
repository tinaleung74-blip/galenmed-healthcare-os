import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function PatientProfileLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Skeleton className="h-8 w-36" />

        <div className="rounded-xl border bg-background p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="size-14 rounded-full" />

              <div className="space-y-2">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
            </div>

            <Skeleton className="h-8 w-40" />
          </div>

          <div className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={`profile-header-item-${index + 1}`}
                className="h-12 w-full"
              />
            ))}
          </div>
        </div>

        <Skeleton className="h-12 w-full rounded-xl" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={`profile-summary-card-${index + 1}`}
              className="h-28 w-full rounded-xl"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    </DashboardLayout>
  )
}
