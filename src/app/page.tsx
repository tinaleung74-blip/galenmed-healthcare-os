import {
  ArrowRight,
  HeartPulse,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import Link from "next/link"

import {
  GalenMedLogo,
} from "@/components/brand/galenmed-logo"

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-8">
      <section className="w-full max-w-5xl overflow-hidden rounded-[2rem] border bg-white shadow-2xl shadow-slate-950/10">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
            <GalenMedLogo
              size="lg"
              priority
              className="rounded-2xl bg-white p-1.5"
            />

            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
              GalenMed Healthcare OS
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
              Choose your secure
              GalenMed portal
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Staff and patients use
              separate authentication,
              authorization, and audit
              controls.
            </p>

            <div className="mt-10 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-teal-300"
                aria-hidden="true"
              />

              <p className="text-sm leading-6 text-slate-300">
                Access is limited to the
                portal and records assigned
                to the authenticated account.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12">
            <div className="grid gap-5">
              <Link
                href="/staff/login"
                className="group rounded-2xl border p-6 transition-all hover:border-teal-300 hover:bg-teal-50/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <HeartPulse
                      className="size-6"
                      aria-hidden="true"
                    />
                  </div>

                  <ArrowRight
                    className="size-5 text-teal-700 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  GalenMed Staff Portal
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  System Admin,
                  Receptionist, Doctor,
                  Laboratory, and Cashier
                  workspaces.
                </p>
              </Link>

              <Link
                href="/patient/login"
                className="group rounded-2xl border p-6 transition-all hover:border-sky-300 hover:bg-sky-50/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <UserRound
                      className="size-6"
                      aria-hidden="true"
                    />
                  </div>

                  <ArrowRight
                    className="size-5 text-sky-700 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  GalenMed Patient Portal
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Released prescriptions,
                  laboratory results,
                  billing status, and
                  patient account settings.
                </p>
              </Link>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
              Legacy prototype modules
              remain quarantined until
              migrated to guarded database
              workflows.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
