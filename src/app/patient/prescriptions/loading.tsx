export default function PatientPrescriptionsLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-9 w-80 rounded bg-slate-200" />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 rounded-xl bg-slate-200" />
          <div className="h-72 rounded-xl bg-slate-200" />
        </div>
      </div>
    </main>
  )
}
