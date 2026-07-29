import { FileClock } from "lucide-react"

interface PatientProfileSectionPlaceholderProps {
  title: string
  description: string
}

export function PatientProfileSectionPlaceholder({
  title,
  description,
}: PatientProfileSectionPlaceholderProps) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-xl border bg-background px-6 py-12 text-center shadow-sm">
      <div className="rounded-2xl bg-teal-50 p-4 text-teal-700">
        <FileClock
          className="size-7"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-4 text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <p className="mt-4 rounded-lg border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
        This section is part of the Patient Profile
        foundation. Its dedicated mock workflow will be added
        before any database integration.
      </p>
    </section>
  )
}
