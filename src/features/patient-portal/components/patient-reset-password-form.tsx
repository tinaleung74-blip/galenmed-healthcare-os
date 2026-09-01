"use client"

import {
  useMemo,
  useState,
  type FormEvent,
} from "react"
import {
  ArrowLeft,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"

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
  patientPasswordRecoverySchema,
} from "@/features/patient-portal/schemas/patient-account-settings.schema"
import {
  createClient,
} from "@/lib/supabase/client"

const GENERIC_SUCCESS_MESSAGE =
  "If this email is linked to an eligible GalenMed Patient Portal account, a secure password-reset link will be sent."

export function PatientResetPasswordForm() {
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
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null)

  const [
    isError,
    setIsError,
  ] = useState(false)

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage(
      null
    )

    const parsedValues =
      patientPasswordRecoverySchema.safeParse({
        email,
      })

    if (!parsedValues.success) {
      setIsError(
        true
      )

      setMessage(
        parsedValues.error.issues[0]
          ?.message ??
        "Enter a valid Patient Portal email."
      )

      return
    }

    setIsSubmitting(
      true
    )

    try {
      const redirectTo =
        `${window.location.origin}/auth/callback?next=/patient/account/change-password`

      const {
        error,
      } =
        await supabase.auth.resetPasswordForEmail(
          parsedValues.data.email,
          {
            redirectTo,
          }
        )

      if (error) {
        setIsError(
          true
        )

        setMessage(
          "The recovery request could not be sent. Verify the callback configuration or try again later."
        )

        return
      }

      setIsError(
        false
      )

      setMessage(
        GENERIC_SUCCESS_MESSAGE
      )
    } catch {
      setIsError(
        true
      )

      setMessage(
        "The recovery request could not be completed. Try again later."
      )
    } finally {
      setIsSubmitting(
        false
      )
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-8">
      <Card className="w-full max-w-xl rounded-3xl shadow-xl shadow-slate-900/5">
        <CardContent className="p-7 sm:p-10">
          <div className="flex items-center gap-3">
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

          <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <KeyRound
              className="size-6"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Reset Patient Portal password
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Enter the email linked to
            your verified GalenMed
            Patient Portal account.
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
                htmlFor="patient-recovery-email"
              >
                Patient Portal email
              </Label>

              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <Input
                  id="patient-recovery-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={
                    isSubmitting
                  }
                  className="h-12 pl-10"
                  onChange={(
                    inputEvent
                  ) =>
                    setEmail(
                      inputEvent.target
                        .value
                    )
                  }
                />
              </div>
            </div>

            {message ? (
              <div
                role="status"
                aria-live="polite"
                className={
                  isError
                    ? "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
                    : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                }
              >
                {message}
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
                <ShieldCheck
                  aria-hidden="true"
                />
              )}

              {isSubmitting
                ? "Sending secure link"
                : "Send password-reset link"}
            </Button>
          </form>

          <Link
            href="/patient/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-teal-700 underline-offset-4 hover:text-teal-900 hover:underline"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />

            Return to Patient Login
          </Link>

          <p className="mt-6 rounded-2xl border bg-slate-50 p-4 text-xs leading-5 text-slate-600">
            For privacy, GalenMed does
            not confirm whether an email
            is linked to a patient
            account. Locked, suspended,
            and archived accounts remain
            subject to staff review.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
