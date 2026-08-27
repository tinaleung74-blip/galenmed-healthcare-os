import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-80 max-w-full" />

        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`doctor-loading-card-${index + 1}`}
                className="h-24 rounded-xl"
              />
            )
          )}
        </div>

        <Skeleton className="h-16 rounded-xl" />

        <div className="space-y-3">
          {Array.from(
            { length: 6 },
            (_, index) => (
              <Skeleton
                key={`doctor-loading-row-${index + 1}`}
                className="h-20 rounded-xl"
              />
            )
          )}
        </div>
      </div>
    </main>
  )
}
