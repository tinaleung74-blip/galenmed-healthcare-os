"use client"

import {
  useEffect,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
  type Resolver,
} from "react-hook-form"
import {
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  SETTINGS_SYNTHETIC_NOTICE,
} from "@/features/settings/constants/settings.constants"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import {
  securitySettingsFormSchema,
  type SecuritySettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import type {
  SecuritySettings,
} from "@/features/settings/types/settings.types"

function getDefaultValues(
  security:
    SecuritySettings
): SecuritySettingsFormValues {
  return {
    ...security,

    updatedBy: "",
  }
}

export function SecuritySettingsWorkspace() {
  const {
    settings,
    updateSecuritySettings,
  } = useSettings()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isDirty,
      isSubmitting,
    },
  } =
    useForm<SecuritySettingsFormValues>(
      {
        resolver:
          zodResolver(
            securitySettingsFormSchema
          ) as Resolver<SecuritySettingsFormValues>,

        defaultValues:
          getDefaultValues(
            settings.security
          ),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    reset(
      getDefaultValues(
        settings.security
      )
    )
  }, [
    reset,
    settings.security,
  ])

  async function submitSecuritySettings(
    values:
      SecuritySettingsFormValues
  ) {
    try {
      const updatedSecurity =
        updateSecuritySettings(
          values
        )

      reset(
        getDefaultValues(
          updatedSecurity
        )
      )

      toast.success(
        "Security configuration saved",
        {
          description:
            "Session, sign-in, MFA, and password controls were updated.",
        }
      )
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The security configuration could not be saved.",
      })
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-rose-50 p-2.5 text-rose-700">
          <LockKeyhole
            className="size-5"
            aria-hidden="true"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            Security and Sessions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure session expiry,
            failed-sign-in controls, MFA
            requirements, and password
            policy.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <TimerReset
              className="size-4 text-sky-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Session timeout
              </p>

              <p className="mt-1 text-xl font-semibold">
                {
                  settings.security
                    .sessionTimeoutMinutes
                }{" "}
                min
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldAlert
              className="size-4 text-amber-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Failed sign-in limit
              </p>

              <p className="mt-1 text-xl font-semibold">
                {
                  settings.security
                    .maxFailedSignInAttempts
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <KeyRound
              className="size-4 text-violet-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Minimum password
              </p>

              <p className="mt-1 text-xl font-semibold">
                {
                  settings.security
                    .passwordMinimumLength
                }{" "}
                characters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            settings.security
              .requireMfaForPrivilegedRoles
              ? "border-emerald-200 bg-emerald-50/40 shadow-none"
              : "border-amber-200 bg-amber-50/40 shadow-none"
          }
        >
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldCheck
              className="size-4 text-emerald-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Privileged-role MFA
              </p>

              <p className="mt-1 font-semibold">
                {settings.security
                  .requireMfaForPrivilegedRoles
                  ? "Required"
                  : "Not required"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <form
        noValidate
        className="space-y-6 rounded-xl border bg-background p-5"
        onSubmit={handleSubmit(
          submitSecuritySettings
        )}
      >
        <section className="space-y-4">
          <h3 className="text-sm font-semibold">
            Session controls
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-session-timeout">
                Session timeout in minutes
              </Label>

              <Input
                id="settings-session-timeout"
                type="number"
                min={5}
                max={1440}
                {...register(
                  "sessionTimeoutMinutes"
                )}
              />

              {errors.sessionTimeoutMinutes
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors
                      .sessionTimeoutMinutes
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-idle-warning">
                Idle-warning minute
              </Label>

              <Input
                id="settings-idle-warning"
                type="number"
                min={1}
                max={1439}
                {...register(
                  "idleWarningMinutes"
                )}
              />

              {errors.idleWarningMinutes
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors
                      .idleWarningMinutes
                      .message
                  }
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-5">
          <h3 className="text-sm font-semibold">
            Sign-in protection
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-failed-sign-ins">
                Maximum failed sign-in attempts
              </Label>

              <Input
                id="settings-failed-sign-ins"
                type="number"
                min={1}
                max={20}
                {...register(
                  "maxFailedSignInAttempts"
                )}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-rose-700"
                {...register(
                  "requireMfaForPrivilegedRoles"
                )}
              />

              <span>
                <span className="block text-sm font-medium text-rose-900">
                  Require MFA for privileged roles
                </span>

                <span className="mt-1 block text-xs text-rose-800">
                  Require additional
                  authentication for
                  administrative and
                  security-sensitive roles.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section className="space-y-4 border-t pt-5">
          <h3 className="text-sm font-semibold">
            Password policy
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-password-minimum">
                Minimum password length
              </Label>

              <Input
                id="settings-password-minimum"
                type="number"
                min={8}
                max={128}
                {...register(
                  "passwordMinimumLength"
                )}
              />
            </div>

            <div className="grid gap-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-rose-700"
                  {...register(
                    "passwordRequireNumber"
                  )}
                />

                <span className="text-sm font-medium">
                  Require at least one number
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-rose-700"
                  {...register(
                    "passwordRequireSpecialCharacter"
                  )}
                />

                <span className="text-sm font-medium">
                  Require a special character
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t pt-5">
          <Label htmlFor="settings-security-updated-by">
            Responsible staff member
          </Label>

          <Input
            id="settings-security-updated-by"
            placeholder="Synthetic Security Administrator"
            {...register("updatedBy")}
          />

          {errors.updatedBy
            ?.message ? (
            <p className="text-xs font-medium text-destructive">
              {
                errors.updatedBy
                  .message
              }
            </p>
          ) : null}
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <ShieldAlert
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            {SETTINGS_SYNTHETIC_NOTICE}
            These controls do not yet enforce
            production authentication or
            session behavior. Every change
            creates a security audit record.
          </p>
        </div>

        {errors.root?.message ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {errors.root.message}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !isDirty
            }
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving security controls
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save security controls
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  )
}
