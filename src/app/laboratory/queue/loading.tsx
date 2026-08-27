import { Skeleton } from "@/components/ui/skeleton"

export default function LaboratoryQueueLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-8 w-72" />
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-8 w-96 max-w-full" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>

        <Skeleton className="h-24 rounded-xl" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`laboratory-queue-summary-${index + 1}`}
                className="h-24 rounded-xl"
              />
            )
          )}
        </div>

        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
    </main>
  )
}
