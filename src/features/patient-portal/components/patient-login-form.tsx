"use client"

import {
  useMemo,
  useState,
  type FormEvent,
} from "react"
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"

import {
  GalenMedLogo,
} from "@/components/brand/galenmed-logo"
import {
  Button,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Input,
} from "@/components/ui/input"
import {
  Label,
} from "@/components/ui/label"
import {
  patientLoginSchema,
  patientPortalContextSchema,
} from "@/features/patient-portal/schemas/patient-portal.schema"
import {
  createClient,
} from "@/lib/supabase/client"

const GENERIC_LOGIN_ERROR =
  "Unable to sign in. Check your Patient Portal email and password."

export function PatientLoginForm() {
  const router =
    useRouter()

  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    )

  const [
    email,
    setEmail,
  ] = useState("")

  const [
    password,
    setPassword,
  ] = useState("")

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null)

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setErrorMessage(
      null
    )

    const parsedValues =
      patientLoginSchema.safeParse({
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

    setIsSubmitting(
      true
    )

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
        data,
        error,
      } = await supabase.rpc(
        "get_current_patient_portal_context"
      )

      const parsedContext =
        patientPortalContextSchema.safeParse(
          data
        )

      if (
        error ||
        !parsedContext.success ||
        parsedContext.data
          .accountStatus !==
          "active" ||
        parsedContext.data.patient
          .status !==
          "active"
      ) {
        await supabase.auth.signOut({
          scope:
            "local",
        })

        setErrorMessage(
          "This login is not linked to an active GalenMed Patient Portal account."
        )

        return
      }

      const {
        error: auditError,
      } = await supabase.rpc(
        "record_patient_portal_session_event",
        {
          p_event_type:
            "login_success",
          p_user_agent:
            navigator.userAgent,
          p_metadata: {
            source:
              "patient_login",
          },
        }
      )

      if (auditError) {
        await supabase.auth.signOut({
          scope:
            "local",
        })

        setErrorMessage(
          "Login could not be audited. Access was stopped for security."
        )

        return
      }

      router.replace(
        parsedContext.data
          .mustChangePassword
          ? "/patient/change-password"
          : "/patient/dashboard"
      )

      router.refresh()
    } catch {
      setErrorMessage(
        GENERIC_LOGIN_ERROR
      )
    } finally {
      setIsSubmitting(
        false
      )
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border bg-white shadow-2xl shadow-slate-950/10 sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <GalenMedLogo
                size="lg"
                priority
                className="rounded-2xl bg-white p-1.5"
              />

              <div>
                <p className="font-semibold">
                  GalenMed
                </p>

                <p className="text-xs uppercase tracking-[0.2em] text-teal-300">
                  Patient Portal
                </p>
              </div>
            </div>

            <div className="mt-16 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
                Your released hospital records
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                Secure access to your
                GalenMed patient account
              </h1>

              <p className="mt-6 text-base leading-8 text-slate-300">
                View only records that were
                finalized, payment-cleared,
                and released for your own
                patient identity.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Stethoscope
                  className="size-5 text-teal-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold">
                  Prescriptions
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <FileText
                  className="size-5 text-teal-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold">
                  Laboratory results
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <ReceiptText
                  className="size-5 text-teal-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold">
                  Billing status
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start gap-3">
              <LockKeyhole
                className="mt-0.5 size-5 text-teal-300"
                aria-hidden="true"
              />

              <p className="text-sm leading-6 text-slate-300">
                Use only the Patient Portal
                login issued for your own
                verified GalenMed medical
                record.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <Card className="w-full max-w-lg rounded-3xl shadow-xl shadow-slate-900/5">
            <CardContent className="p-7 sm:p-10">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <GalenMedLogo
                  size="md"
                  priority
                  className="rounded-xl bg-white p-1 ring-1 ring-teal-100"
                />

                <div>
                  <p className="font-semibold">
                    GalenMed
                  </p>

                  <p className="text-xs uppercase tracking-[0.18em] text-teal-700">
                    Patient Portal
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                <ShieldCheck
                  className="size-3.5"
                  aria-hidden="true"
                />
                Secure Patient Access
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight">
                Sign in to Patient Portal
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Use the email and password
                issued for your linked patient
                record.
              </p>

              <form
                noValidate
                className="mt-8 space-y-5"
                onSubmit={
                  handleSubmit
                }
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="patient-login-email"
                  >
                    Patient login email
                  </Label>

                  <Input
                    id="patient-login-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    disabled={
                      isSubmitting
                    }
                    className="h-12"
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="patient-login-password"
                    >
                      Password
                    </Label>

                    <Link
                      href="/patient/reset-password"
                      className="text-xs font-semibold text-teal-700 underline-offset-4 hover:text-teal-900 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Input
                      id="patient-login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      disabled={
                        isSubmitting
                      }
                      className="h-12 pr-12"
                      onChange={(
                        event
                      ) =>
                        setPassword(
                          event.target
                            .value
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
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500"
                      disabled={
                        isSubmitting
                      }
                      onClick={() =>
                        setShowPassword(
                          (
                            currentValue
                          ) =>
                            !currentValue
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          className="size-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="size-4"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    isSubmitting
                  }
                  className="h-12 w-full"
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      aria-hidden="true"
                    />
                  )}

                  {isSubmitting
                    ? "Verifying account"
                    : "Sign in securely"}
                </Button>
              </form>

              <Link
                href="/staff/login"
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50/70 px-4 text-sm font-semibold text-teal-800 transition-colors hover:border-teal-300 hover:bg-teal-100/70 hover:text-teal-950"
              >
                Are you GalenMed staff? Open Staff Portal

                <ArrowRight
                  className="size-4"
                  aria-hidden="true"
                />
              </Link>

              <div className="mt-6 rounded-2xl border bg-slate-50 p-4">
                <p className="text-xs leading-5 text-slate-600">
                  Patient Portal account
                  creation and password support
                  are handled by authorized
                  GalenMed staff.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
