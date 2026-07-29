import Link from "next/link"
import { SearchX } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export function PatientProfileNotFound() {
  return (
    <section className="flex min-h-[65vh] flex-col items-center justify-center rounded-xl border bg-background px-6 py-12 text-center shadow-sm">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-600">
        <SearchX
          className="size-8"
          aria-hidden="true"
        />
      </div>

      <h1 className="mt-5 text-xl font-semibold">
        Patient record unavailable
      </h1>

      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        The requested patient record could not be found in the
        current development session. A newly registered mock
        patient will also disappear after a full browser
        refresh until persistent database integration is added.
      </p>

      <Link
        href="/patients"
        className={buttonVariants({
          variant: "default",
          size: "default",
          className:
            "mt-6 bg-teal-700 text-white hover:bg-teal-800",
        })}
      >
        Return to patient list
      </Link>
    </section>
  )
}
