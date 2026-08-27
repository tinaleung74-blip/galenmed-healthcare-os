import { Skeleton } from "@/components/ui/skeleton"

export default function AdminServicesLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from(
            { length: 4 },
            (_, index) => (
              <Skeleton
                key={`service-summary-${index + 1}`}
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
