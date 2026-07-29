import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function PatientsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />

            <div className="space-y-2">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
          </div>

          <Skeleton className="h-14 w-full max-w-md rounded-lg" />
        </div>

        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">
            <Skeleton className="h-8 w-full lg:max-w-sm" />

            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-8 w-36" />
            </div>
          </div>

          <div className="space-y-3 p-4">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton
                key={`patient-loading-row-${index + 1}`}
                className="h-14 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
