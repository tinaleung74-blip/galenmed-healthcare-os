"use client"

import {
  useMemo,
  useState,
  type FormEvent,
} from "react"
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"

import {
  Button,
} from "@/components/ui/button"
import {
  Input,
} from "@/components/ui/input"
import {
  Label,
} from "@/components/ui/label"
import {
  patientSelfServicePasswordSchema,
} from "@/features/patient-portal/schemas/patient-account-settings.schema"
import type {
  PatientPortalContext,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  getPatientPortalFullName,
} from "@/features/patient-portal/utils/patient-portal.utils"
import {
  createClient,
} from "@/lib/supabase/client"

interface PatientSelfServicePasswordFormProps {
  context:
    PatientPortalContext
}

export function PatientSelfServicePasswordForm({
  context,
}: PatientSelfServicePasswordFormProps) {
  const router =
    useRouter()

  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    )

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

  const patientName =
    getPatientPortalFullName(
      context.patient
    )

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage(
      null
    )

    const parsedValues =
      patientSelfServicePasswordSchema.safeParse({
        newPassword,
        confirmNewPassword,
      })

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

    setIsSubmitting(
      true
    )

    try {
      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password:
            parsedValues.data
              .newPassword,
        })

      if (updateError) {
        setIsError(
          true
        )

        setMessage(
          "The new password could not be saved by the authentication service."
        )

        return
      }

      const changedAt =
        new Date().toISOString()

      const {
        error: auditError,
      } = await supabase.rpc(
        "record_patient_portal_session_event",
        {
          p_event_type:
            "password_changed",

          p_user_agent:
            navigator.userAgent,

          p_metadata: {
            source:
              "patient_self_service_password_change",

            changed_at:
              changedAt,
          },
        }
      )

      setIsError(
        false
      )

      setMessage(
        auditError
          ? "Password changed. GalenMed could not confirm the audit entry; contact support if needed."
          : "Password changed successfully."
      )

      setNewPassword(
        ""
      )

      setConfirmNewPassword(
        ""
      )

      setTimeout(
        () => {
          router.replace(
            "/patient/dashboard"
          )

          router.refresh()
        },
        700
      )
    } catch {
      setIsError(
        true
      )

      setMessage(
        "The password change could not be completed. Try again."
      )
    } finally {
      setIsSubmitting(
        false
      )
    }
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={
        handleSubmit
      }
    >
      <div className="rounded-2xl border bg-slate-50 p-4">
        <p className="font-semibold">
          {patientName}
        </p>

        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {
            context.patient
              .medicalRecordNumber
          }
        </p>

        <p className="mt-2 break-all text-xs text-muted-foreground">
          {
            context.loginEmail
          }
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="patient-self-service-new-password"
        >
          New password
        </Label>

        <div className="relative">
          <Input
            id="patient-self-service-new-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            autoComplete="new-password"
            value={
              newPassword
            }
            disabled={
              isSubmitting
            }
            className="h-12 pr-12"
            onChange={(
              inputEvent
            ) =>
              setNewPassword(
                inputEvent.target
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

      <div className="space-y-2">
        <Label
          htmlFor="patient-self-service-confirm-password"
        >
          Confirm new password
        </Label>

        <Input
          id="patient-self-service-confirm-password"
          type={
            showPassword
              ? "text"
              : "password"
          }
          autoComplete="new-password"
          value={
            confirmNewPassword
          }
          disabled={
            isSubmitting
          }
          className="h-12"
          onChange={(
            inputEvent
          ) =>
            setConfirmNewPassword(
              inputEvent.target
                .value
            )
          }
        />
      </div>

      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-teal-700"
            aria-hidden="true"
          />

          <p className="text-xs leading-5 text-teal-900">
            Use at least 12
            characters with uppercase,
            lowercase, number, and
            special character. Do not
            reuse a staff or personal
            account password.
          </p>
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
          <div className="flex items-start gap-2">
            {isError ? (
              <KeyRound
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
            )}

            <span>
              {message}
            </span>
          </div>
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
          <KeyRound
            aria-hidden="true"
          />
        )}

        {isSubmitting
          ? "Saving password"
          : "Save new password"}
      </Button>
    </form>
  )
}
