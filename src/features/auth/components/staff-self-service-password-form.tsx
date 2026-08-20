"use client"

import {
  useMemo,
  useState,
  type FormEvent,
} from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"

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
  changeStaffPasswordSchema,
} from "@/features/auth/schemas/change-staff-password.schema"
import {
  createClient,
} from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface StaffSelfServicePasswordFormProps {
  fullName: string
  workEmail: string
  dashboardPath: string
}

const PASSWORD_RULES = [
  "At least 12 characters",
  "At least one uppercase letter",
  "At least one lowercase letter",
  "At least one number",
  "At least one special character",
] as const

export function StaffSelfServicePasswordForm({
  fullName,
  workEmail,
  dashboardPath,
}: StaffSelfServicePasswordFormProps) {
  const router = useRouter()

  const supabase = useMemo(
    () => createClient(),
    []
  )

  const [newPassword, setNewPassword] =
    useState("")

  const [confirmNewPassword, setConfirmNewPassword] =
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
      changeStaffPasswordSchema.safeParse({
        newPassword,
        confirmNewPassword,
      })

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          "The new password is invalid."
      )

      return
    }

    setIsSubmitting(true)

    try {
      const changedAt =
        new Date().toISOString()

      const {
        error: passwordError,
      } = await supabase.auth.updateUser({
        password:
          parsedValues.data.newPassword,
      })

      if (passwordError) {
        setErrorMessage(
          "The password could not be changed. Request a new secure link or contact the System Administrator."
        )

        return
      }

      await supabase.rpc(
        "record_staff_session_event",
        {
          p_event_type:
            "password_changed",

          p_session_id:
            null,

          p_user_agent:
            navigator.userAgent,

          p_metadata: {
            source:
              "staff_self_service_password_change",

            changed_at:
              changedAt,
          },
        }
      )

      await supabase.auth.refreshSession()

      router.replace(
        dashboardPath
      )

      router.refresh()
    } catch {
      setErrorMessage(
        "The password change could not be completed."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <Card className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <CardContent className="grid p-0 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
              <GalenMedLogo
                size="lg"
                priority
                className="rounded-2xl bg-white/95 p-1.5 ring-1 ring-white/20"
              />

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
                Staff account security
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                Change your GalenMed password
              </h1>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                This page is available only after a verified staff login or secure email-recovery link.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">
                  Signed in staff
                </p>

                <p className="mt-2 break-words text-sm text-slate-300">
                  {fullName}
                </p>

                <p className="mt-1 break-words text-xs text-slate-400">
                  {workEmail}
                </p>
              </div>
            </section>

            <section className="p-7 sm:p-10 lg:p-12">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <KeyRound
                    className="size-6"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    Set a new password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use a strong password that is unique to this staff account.
                  </p>
                </div>
              </div>

              <form
                noValidate
                className="mt-8 space-y-5"
                onSubmit={handleSubmit}
              >
                <div className="space-y-2.5">
                  <Label htmlFor="staff-self-password">
                    New password
                  </Label>

                  <div className="relative">
                    <Input
                      id="staff-self-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={newPassword}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl pr-12 text-base"
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide passwords"
                          : "Show passwords"
                      }
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      disabled={isSubmitting}
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
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

                <div className="space-y-2.5">
                  <Label htmlFor="staff-self-confirm-password">
                    Confirm new password
                  </Label>

                  <Input
                    id="staff-self-confirm-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    disabled={isSubmitting}
                    className="h-12 rounded-xl text-base"
                    onChange={(event) =>
                      setConfirmNewPassword(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Password requirements
                  </p>

                  <ul className="mt-3 space-y-2">
                    {PASSWORD_RULES.map(
                      (rule) => (
                        <li
                          key={rule}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          <CheckCircle2
                            className="size-4 text-teal-700"
                            aria-hidden="true"
                          />
                          {rule}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
                  >
                    {errorMessage}
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
                      Saving password
                    </>
                  ) : (
                    <>
                      <KeyRound
                        className="size-5"
                        aria-hidden="true"
                      />
                      Save new password
                    </>
                  )}
                </Button>
              </form>

              <Link
                href={dashboardPath}
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
                Return to dashboard
              </Link>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                <LockKeyhole
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                Never reuse a temporary password or share your permanent password.
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
