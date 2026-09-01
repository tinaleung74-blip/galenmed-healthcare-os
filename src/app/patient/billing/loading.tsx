export default function PatientBillingLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-9 w-80 rounded bg-slate-200" />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-xl bg-slate-200" />
          <div className="h-28 rounded-xl bg-slate-200" />
          <div className="h-28 rounded-xl bg-slate-200" />
        </div>

        <div className="h-80 rounded-xl bg-slate-200" />
      </div>
    </main>
  )
}
