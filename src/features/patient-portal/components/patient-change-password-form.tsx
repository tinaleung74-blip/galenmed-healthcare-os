"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
} from "lucide-react"
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
  changeRequiredPatientPasswordAction,
} from "@/features/patient-portal/actions/patient-auth.actions"
import {
  changePatientPasswordSchema,
} from "@/features/patient-portal/schemas/patient-portal.schema"
import type {
  ChangePatientPasswordValues,
  PatientPortalContext,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  getPatientPortalFullName,
} from "@/features/patient-portal/utils/patient-portal.utils"

interface PatientChangePasswordFormProps {
  context:
    PatientPortalContext
}

export function PatientChangePasswordForm({
  context,
}: PatientChangePasswordFormProps) {
  const router =
    useRouter()

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const [
    values,
    setValues,
  ] = useState<
    ChangePatientPasswordValues
  >({
    newPassword:
      "",
    confirmNewPassword:
      "",
  })

  const [
    showPassword,
    setShowPassword,
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

  const patientName =
    getPatientPortalFullName(
      context.patient
    )

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage(
      null
    )

    const parsedValues =
      changePatientPasswordSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setIsError(
        true
      )

      setMessage(
        parsedValues.error.issues[0]
          ?.message ??
        "The new password is invalid."
      )

      return
    }

    startTransition(
      async () => {
        const result =
          await changeRequiredPatientPasswordAction(
            parsedValues.data
          )

        setIsError(
          !result.success
        )

        setMessage(
          result.message
        )

        if (
          result.success &&
          result.dashboardPath
        ) {
          router.replace(
            result.dashboardPath
          )

          router.refresh()
        }
      }
    )
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

          <div className="mt-8">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <KeyRound
                className="size-6"
                aria-hidden="true"
              />
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight">
              Create your private password
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {patientName} — {
                context.patient
                  .medicalRecordNumber
              }
            </p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={
              handleSubmit
            }
          >
            <div className="space-y-2">
              <Label
                htmlFor="patient-new-password"
              >
                New password
              </Label>

              <div className="relative">
                <Input
                  id="patient-new-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={
                    values.newPassword
                  }
                  disabled={
                    isPending
                  }
                  className="h-12 pr-12"
                  onChange={(
                    event
                  ) =>
                    setValues(
                      (
                        currentValues
                      ) => ({
                        ...currentValues,
                        newPassword:
                          event.target
                            .value,
                      })
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

            <div className="space-y-2">
              <Label
                htmlFor="patient-confirm-password"
              >
                Confirm new password
              </Label>

              <Input
                id="patient-confirm-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                value={
                  values.confirmNewPassword
                }
                disabled={
                  isPending
                }
                className="h-12"
                onChange={(
                  event
                ) =>
                  setValues(
                    (
                      currentValues
                    ) => ({
                      ...currentValues,
                      confirmNewPassword:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </div>

            {message ? (
              <div
                role="alert"
                className={
                  isError
                    ? "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                    : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                }
              >
                {message}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={
                isPending
              }
              className="h-12 w-full"
            >
              {isPending ? (
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <KeyRound
                  aria-hidden="true"
                />
              )}

              {isPending
                ? "Saving password"
                : "Change password and continue"}
            </Button>
          </form>

          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Use at least 12 characters
            with uppercase, lowercase,
            number, and special character.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
