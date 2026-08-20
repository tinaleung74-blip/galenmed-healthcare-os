import { Skeleton } from "@/components/ui/skeleton"

export default function AdminStaffLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-9 w-96 max-w-full" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`staff-summary-${index + 1}`}
                className="h-28 rounded-xl"
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
