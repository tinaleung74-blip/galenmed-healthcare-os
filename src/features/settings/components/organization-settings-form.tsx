"use client"

import {
  useEffect,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
} from "react-hook-form"
import {
  Building2,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  SETTINGS_SYNTHETIC_NOTICE,
} from "@/features/settings/constants/settings.constants"
import {
  organizationSettingsFormSchema,
  type OrganizationSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import type {
  OrganizationSettings,
} from "@/features/settings/types/settings.types"

interface OrganizationSettingsFormProps {
  organization:
    OrganizationSettings

  onSubmitOrganization: (
    values:
      OrganizationSettingsFormValues
  ) => Promise<void>
}

function getDefaultValues(
  organization:
    OrganizationSettings
): OrganizationSettingsFormValues {
  return {
    legalName:
      organization.legalName,

    displayName:
      organization.displayName,

    registrationNumber:
      organization.registrationNumber ??
      "",

    taxIdentificationNumber:
      organization.taxIdentificationNumber ??
      "",

    phoneNumber:
      organization.phoneNumber ??
      "",

    emailAddress:
      organization.emailAddress ??
      "",

    website:
      organization.website ??
      "",

    address:
      organization.address,

    timezone:
      organization.timezone,

    currency: "PHP",
    locale: "en-PH",

    updatedBy: "",
  }
}

function FieldError({
  message,
}: {
  message?: string
}) {
  if (!message) {
    return null
  }

  return (
    <p
      role="alert"
      className="text-xs font-medium text-destructive"
    >
      {message}
    </p>
  )
}

export function OrganizationSettingsForm({
  organization,
  onSubmitOrganization,
}: OrganizationSettingsFormProps) {
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
    useForm<OrganizationSettingsFormValues>(
      {
        resolver: zodResolver(
          organizationSettingsFormSchema
        ),

        defaultValues:
          getDefaultValues(
            organization
          ),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    reset(
      getDefaultValues(
        organization
      )
    )
  }, [
    organization,
    reset,
  ])

  async function submitOrganization(
    values:
      OrganizationSettingsFormValues
  ) {
    try {
      await onSubmitOrganization(
        values
      )

      reset({
        ...values,
        updatedBy: "",
      })
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The organization profile could not be saved.",
      })
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
          <Building2
            className="size-5"
            aria-hidden="true"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            Organization Profile
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure the organization
            identity, contact information,
            address, locale, and timezone.
          </p>
        </div>
      </div>

      <form
        noValidate
        className="space-y-6 rounded-xl border bg-background p-5"
        onSubmit={handleSubmit(
          submitOrganization
        )}
      >
        <section className="space-y-4">
          <h3 className="text-sm font-semibold">
            Organization identity
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-legal-name">
                Legal name
              </Label>

              <Input
                id="settings-legal-name"
                {...register(
                  "legalName"
                )}
              />

              <FieldError
                message={
                  errors.legalName
                    ?.message
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-display-name">
                Display name
              </Label>

              <Input
                id="settings-display-name"
                {...register(
                  "displayName"
                )}
              />

              <FieldError
                message={
                  errors.displayName
                    ?.message
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-registration-number">
                Registration number
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="settings-registration-number"
                {...register(
                  "registrationNumber"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-tax-number">
                Tax identification number
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="settings-tax-number"
                {...register(
                  "taxIdentificationNumber"
                )}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-5">
          <h3 className="text-sm font-semibold">
            Contact information
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-phone">
                Phone number
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="settings-phone"
                {...register(
                  "phoneNumber"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-email">
                Email address
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="settings-email"
                type="email"
                {...register(
                  "emailAddress"
                )}
              />

              <FieldError
                message={
                  errors.emailAddress
                    ?.message
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="settings-website">
                Website
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="settings-website"
                placeholder="https://example.com"
                {...register(
                  "website"
                )}
              />

              <FieldError
                message={
                  errors.website
                    ?.message
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="settings-address">
                Organization address
              </Label>

              <Textarea
                id="settings-address"
                rows={4}
                {...register(
                  "address"
                )}
              />

              <FieldError
                message={
                  errors.address
                    ?.message
                }
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-5">
          <h3 className="text-sm font-semibold">
            Regional configuration
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="settings-timezone">
                Timezone
              </Label>

              <Input
                id="settings-timezone"
                {...register(
                  "timezone"
                )}
              />

              <FieldError
                message={
                  errors.timezone
                    ?.message
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-currency">
                Currency
              </Label>

              <Input
                id="settings-currency"
                readOnly
                {...register(
                  "currency"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-locale">
                Locale
              </Label>

              <Input
                id="settings-locale"
                readOnly
                {...register(
                  "locale"
                )}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-5">
          <div className="space-y-2">
            <Label htmlFor="settings-organization-updated-by">
              Responsible staff member
            </Label>

            <Input
              id="settings-organization-updated-by"
              placeholder="Synthetic Settings Administrator"
              {...register(
                "updatedBy"
              )}
            />

            <FieldError
              message={
                errors.updatedBy
                  ?.message
              }
            />
          </div>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            {SETTINGS_SYNTHETIC_NOTICE}
            Saving a change creates a new
            configuration revision and
            audit entry.
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
            className="bg-sky-700 text-white hover:bg-sky-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving profile
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save organization profile
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  )
}
