"use client"

import {
  useMemo,
  useState,
  type FormEvent,
} from "react"
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Eye,
  EyeOff,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  staffContextSchema,
  staffLoginFormSchema,
} from "@/features/auth/schemas/staff-auth.schema"
import {
  getPreferredDashboardPath,
} from "@/features/auth/utils/staff-auth.utils"
import {
  createClient,
} from "@/lib/supabase/client"

const GENERIC_LOGIN_ERROR =
  "Unable to sign in. Check your credentials or contact the GalenMed System Administrator."

export function StaffLoginForm() {
  const router = useRouter()

  const supabase = useMemo(
    () => createClient(),
    []
  )

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)

    const parsedValues =
      staffLoginFormSchema.safeParse({
        email,
        password,
      })

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          GENERIC_LOGIN_ERROR
      )

      return
    }

    setIsSubmitting(true)

    try {
      const {
        error: signInError,
      } =
        await supabase.auth.signInWithPassword(
          parsedValues.data
        )

      if (signInError) {
        setErrorMessage(
          GENERIC_LOGIN_ERROR
        )

        return
      }

      const {
        data: contextData,
        error: contextError,
      } = await supabase.rpc(
        "get_current_staff_context"
      )

      const parsedContext =
        staffContextSchema.safeParse(
          contextData
        )

      if (
        contextError ||
        !parsedContext.success ||
        parsedContext.data
          .accountStatus !==
          "active" ||
        parsedContext.data.roles
          .length === 0
      ) {
        await supabase.auth.signOut({
          scope: "local",
        })

        setErrorMessage(
          "Your GalenMed staff account is not active or has no assigned role. Contact the System Administrator."
        )

        return
      }

      const dashboardPath =
        getPreferredDashboardPath(
          parsedContext.data
        )

      const {
        error: auditError,
      } = await supabase.rpc(
        "record_staff_session_event",
        {
          p_event_type:
            "login_success",

          p_session_id:
            null,

          p_user_agent:
            navigator.userAgent,

          p_metadata: {
            source:
              "staff_login",

            dashboard_path:
              dashboardPath,
          },
        }
      )

      if (auditError) {
        await supabase.auth.signOut({
          scope: "local",
        })

        setErrorMessage(
          "Login could not be audited. Access was stopped for security."
        )

        return
      }

      router.replace(
        dashboardPath
      )

      router.refresh()
    } catch {
      setErrorMessage(
        GENERIC_LOGIN_ERROR
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-6 font-sans sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(520px,0.92fr)]">
        <section className="relative hidden min-w-0 overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div
            className="pointer-events-none absolute -top-28 -left-28 size-80 rounded-full bg-teal-500/20 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute right-0 bottom-20 size-72 rounded-full bg-cyan-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <GalenMedLogo
                size="lg"
                priority
                className="rounded-2xl bg-white/95 p-1.5 ring-1 ring-white/20"
              />

              <div>
                <p className="text-base font-semibold tracking-tight">
                  GalenMed
                </p>

                <p className="text-xs uppercase tracking-[0.22em] text-teal-300">
                  Healthcare OS
                </p>
              </div>
            </div>

            <div className="mt-16 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
                Secure hospital operations
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                One secure portal for every
                GalenMed staff role
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                Your assigned role, branch,
                department, and permissions
                determine which dashboard,
                patients, and hospital records
                you can access.
              </p>
            </div>

            <div className="mt-12 grid max-w-2xl gap-4 xl:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <LayoutDashboard
                  className="size-5 text-teal-300"
                  aria-hidden="true"
                />

                <p className="mt-4 text-sm font-semibold">
                  Role-based dashboard
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Doctor, laboratory,
                  receptionist, cashier, and
                  administrator workspaces.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Building2
                  className="size-5 text-teal-300"
                  aria-hidden="true"
                />

                <p className="mt-4 text-sm font-semibold">
                  Branch-aware access
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Staff records and actions are
                  restricted to authorized
                  hospital assignments.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <ClipboardCheck
                  className="size-5 text-teal-300"
                  aria-hidden="true"
                />

                <p className="mt-4 text-sm font-semibold">
                  Security audit trail
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Successful logins and
                  sensitive account events are
                  retained for review.
                </p>
              </article>
            </div>
          </div>

          <div className="relative z-10 mt-12 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start gap-3">
              <LockKeyhole
                className="mt-0.5 size-5 shrink-0 text-teal-300"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-semibold text-white">
                  Protected staff access
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Never share your password or
                  use another staff member&apos;s
                  account. Access is recorded
                  in the GalenMed security
                  ledger.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center bg-gradient-to-br from-white via-white to-teal-50/50 px-5 py-10 sm:px-10 sm:py-14 lg:px-12 xl:px-16">
          <Card className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <CardContent className="p-7 sm:p-10 lg:p-12">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <GalenMedLogo
                  size="md"
                  priority
                  className="rounded-xl bg-white p-1 ring-1 ring-teal-100"
                />

                <div>
                  <p className="font-semibold tracking-tight">
                    GalenMed
                  </p>

                  <p className="text-xs uppercase tracking-[0.18em] text-teal-700">
                    Healthcare OS
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                <ShieldCheck
                  className="size-3.5"
                  aria-hidden="true"
                />

                Secure Staff Portal
              </div>

              <div className="mt-6">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Sign in to GalenMed
                </h2>

                <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
                  Enter your assigned work
                  email and GalenMed staff
                  password to open your
                  authorized dashboard.
                </p>
              </div>

              <form
                noValidate
                className="mt-9 space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="space-y-2.5">
                  <Label
                    htmlFor="staff-login-email"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Work email
                  </Label>

                  <Input
                    id="staff-login-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    disabled={isSubmitting}
                    placeholder="name@hospital.com"
                    aria-invalid={
                      Boolean(errorMessage)
                    }
                    className="h-12 rounded-xl border-slate-300 bg-white px-4 text-base shadow-sm transition-colors placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="staff-login-password"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Password
                    </Label>

                    <Link
                      href="/staff/reset-password"
                      className="text-xs font-semibold text-teal-700 underline-offset-4 hover:text-teal-900 hover:underline"
                    >
                      Forgot or change password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Input
                      id="staff-login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      disabled={isSubmitting}
                      aria-invalid={
                        Boolean(errorMessage)
                      }
                      className="h-12 rounded-xl border-slate-300 bg-white px-4 pr-12 text-base shadow-sm transition-colors focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600"
                      disabled={isSubmitting}
                      onClick={() =>
                        setShowPassword(
                          (currentValue) =>
                            !currentValue
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          className="size-5"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="size-5"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage ? (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm leading-6 text-rose-800"
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl bg-teal-700 text-base font-semibold text-white shadow-lg shadow-teal-700/15 transition-all hover:bg-teal-800 hover:shadow-xl disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle
                        className="size-5 animate-spin"
                        aria-hidden="true"
                      />

                      Verifying account
                    </>
                  ) : (
                    <>
                      Sign in securely

                      <ArrowRight
                        className="size-5"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole
                    className="mt-0.5 size-4 shrink-0 text-teal-700"
                    aria-hidden="true"
                  />

                  <p className="text-xs leading-5 text-slate-600">
                    Account activation, role
                    assignment, branch access,
                    and password support are
                    managed by the GalenMed
                    System Administrator.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                <span>
                  Role-based access
                </span>

                <span
                  className="hidden size-1 rounded-full bg-slate-300 sm:block"
                  aria-hidden="true"
                />

                <span>
                  Branch permissions
                </span>

                <span
                  className="hidden size-1 rounded-full bg-slate-300 sm:block"
                  aria-hidden="true"
                />

                <span>
                  Audit logged
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
