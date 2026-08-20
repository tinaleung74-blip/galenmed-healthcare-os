"use client"

import {
  useMemo,
  useState,
  type FormEvent,
} from "react"
import {
  ArrowLeft,
  LoaderCircle,
  MailCheck,
  Send,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  resetStaffPasswordSchema,
} from "@/features/auth/schemas/reset-staff-password.schema"
import {
  createClient,
} from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const GENERIC_SUCCESS_MESSAGE =
  "If that email belongs to an active GalenMed staff account, a secure password-reset link has been sent."

export function StaffResetPasswordForm() {
  const supabase = useMemo(
    () => createClient(),
    []
  )

  const [email, setEmail] =
    useState("")

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const parsedValues =
      resetStaffPasswordSchema.safeParse({
        email,
      })

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          "Enter a valid work email address."
      )

      return
    }

    setIsSubmitting(true)

    try {
      const redirectTo =
        `${window.location.origin}/auth/callback?next=/staff/account/change-password`

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
        setErrorMessage(
          "The password-reset request could not be sent. Try again later or contact the System Administrator."
        )

        return
      }

      setSuccessMessage(
        GENERIC_SUCCESS_MESSAGE
      )
    } catch {
      setErrorMessage(
        "The password-reset request could not be completed."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <Card className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <CardContent className="p-7 sm:p-10 lg:p-12">
            <div className="flex items-center gap-4">
              <GalenMedLogo
                size="lg"
                priority
                className="rounded-2xl bg-white p-1.5 ring-1 ring-teal-100"
              />

              <div>
                <p className="font-semibold tracking-tight">
                  GalenMed
                </p>

                <p className="text-xs uppercase tracking-[0.18em] text-teal-700">
                  Secure Staff Portal
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                <ShieldCheck
                  className="size-3.5"
                  aria-hidden="true"
                />
                Verified email recovery
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                Forgot or change your password?
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Enter your GalenMed work email. A secure link will be sent to the account owner before any password can be changed.
              </p>
            </div>

            <form
              noValidate
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
            >
              <div className="space-y-2.5">
                <Label
                  htmlFor="staff-reset-email"
                  className="text-sm font-semibold text-slate-800"
                >
                  Work email
                </Label>

                <Input
                  id="staff-reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={isSubmitting}
                  placeholder="name@hospital.com"
                  className="h-12 rounded-xl px-4 text-base"
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                />
              </div>

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
                >
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                >
                  <MailCheck
                    className="mt-0.5 size-5 shrink-0"
                    aria-hidden="true"
                  />
                  {successMessage}
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-teal-700 text-base font-semibold text-white hover:bg-teal-800"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      className="size-5 animate-spin"
                      aria-hidden="true"
                    />
                    Sending secure link
                  </>
                ) : (
                  <>
                    <Send
                      className="size-5"
                      aria-hidden="true"
                    />
                    Send password-reset link
                  </>
                )}
              </Button>
            </form>

            <Link
              href="/staff/login"
              className={cn(
                buttonVariants({
                  variant: "ghost",
                }),
                "mt-5 w-full"
              )}
            >
              <ArrowLeft
                aria-hidden="true"
              />
              Back to staff sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
