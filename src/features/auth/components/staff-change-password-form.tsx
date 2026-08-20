"use client"

import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  changeRequiredStaffPasswordAction,
} from "@/features/auth/actions/change-staff-password.actions"
import {
  changeStaffPasswordSchema,
} from "@/features/auth/schemas/change-staff-password.schema"
import {
  createClient,
} from "@/lib/supabase/client"

interface StaffChangePasswordFormProps {
  fullName: string
  workEmail: string
}

const PASSWORD_RULES = [
  "At least 12 characters",
  "At least one uppercase letter",
  "At least one lowercase letter",
  "At least one number",
  "At least one special character",
] as const

export function StaffChangePasswordForm({
  fullName,
  workEmail,
}: StaffChangePasswordFormProps) {
  const router = useRouter()

  const supabase = useMemo(
    () => createClient(),
    []
  )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const [
    newPassword,
    setNewPassword,
  ] = useState("")

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("")

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  )

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)

    const values = {
      newPassword,
      confirmNewPassword,
    }

    const parsedValues =
      changeStaffPasswordSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
        "The new password is invalid."
      )

      return
    }

    startTransition(async () => {
      const result =
        await changeRequiredStaffPasswordAction(
          parsedValues.data
        )

      if (!result.success) {
        setErrorMessage(
          result.message
        )

        return
      }

      const {
        error: refreshError,
      } =
        await supabase.auth.refreshSession()

      if (refreshError) {
        await supabase.auth.signOut({
          scope: "local",
        })

        router.replace(
          "/staff/login?error=session-refresh"
        )

        router.refresh()
        return
      }

      router.replace(
        result.dashboardPath ??
          "/staff"
      )

      router.refresh()
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <CardContent className="grid p-0 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300 ring-1 ring-teal-300/30">
                <ShieldCheck
                  className="size-6"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
                Required security step
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                Create your permanent password
              </h1>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Your administrator issued a temporary password. You must replace it before accessing hospital operations.
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
                    Change temporary password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use a strong password that is unique to your GalenMed staff account.
                  </p>
                </div>
              </div>

              <form
                noValidate
                className="mt-8 space-y-5"
                onSubmit={handleSubmit}
              >
                <div className="space-y-2.5">
                  <Label
                    htmlFor="staff-new-password"
                    className="text-sm font-semibold text-slate-800"
                  >
                    New password
                  </Label>

                  <div className="relative">
                    <Input
                      id="staff-new-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={newPassword}
                      disabled={isPending}
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
                      disabled={isPending}
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

                <div className="space-y-2.5">
                  <Label
                    htmlFor="staff-confirm-password"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Confirm new password
                  </Label>

                  <Input
                    id="staff-confirm-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    disabled={isPending}
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
                    aria-live="polite"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className="h-12 w-full rounded-xl bg-teal-700 text-base font-semibold text-white hover:bg-teal-800"
                >
                  {isPending ? (
                    <>
                      <LoaderCircle
                        className="size-5 animate-spin"
                        aria-hidden="true"
                      />

                      Saving new password
                    </>
                  ) : (
                    <>
                      Save and continue

                      <ArrowRight
                        className="size-5"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                <LockKeyhole
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />

                Do not reuse your temporary password or share your permanent password with another staff member.
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
