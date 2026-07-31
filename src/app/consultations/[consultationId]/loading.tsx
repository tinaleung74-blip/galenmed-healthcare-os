import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function ConsultationEncounterLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Skeleton className="h-8 w-52" />

        <div className="rounded-xl border bg-background p-5">
          <div className="space-y-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>

          <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={`encounter-context-${index + 1}`}
                className="h-14"
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={`encounter-section-${index + 1}`}
              className="h-44 rounded-xl"
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
