"use client"

import {
  useEffect,
  type ReactNode,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
  type Resolver,
} from "react-hook-form"
import {
  CalendarDays,
  CreditCard,
  FlaskConical,
  LoaderCircle,
  Pill,
  Save,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  SETTINGS_SECTION_LABELS,
  SETTINGS_SYNTHETIC_NOTICE,
} from "@/features/settings/constants/settings.constants"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import {
  operationalSettingsFormSchema,
  type OperationalSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import type {
  OperationalSettings,
  SettingsSection,
} from "@/features/settings/types/settings.types"

type OperationalSection =
  Extract<
    SettingsSection,
    | "appointments"
    | "clinical"
    | "laboratory"
    | "radiology"
    | "pharmacy"
    | "billing"
  >

interface OperationalSettingsWorkspaceProps {
  section:
    OperationalSection
}

interface SectionMetadata {
  icon: LucideIcon
  description: string
  toneClassName: string
}

const sectionMetadata: Record<
  OperationalSection,
  SectionMetadata
> = {
  appointments: {
    icon: CalendarDays,

    description:
      "Configure scheduling duration, confirmation, check-in grace, and no-show timing.",

    toneClassName:
      "bg-sky-50 text-sky-700",
  },

  clinical: {
    icon: Stethoscope,

    description:
      "Configure allergy review, vital-sign requirements, walk-in consultations, and follow-up defaults.",

    toneClassName:
      "bg-indigo-50 text-indigo-700",
  },

  laboratory: {
    icon: FlaskConical,

    description:
      "Configure specimen collection, result verification, and critical-result escalation.",

    toneClassName:
      "bg-violet-50 text-violet-700",
  },

  radiology: {
    icon: ScanLine,

    description:
      "Configure preparation, technical completion, verification, and critical-finding communication.",

    toneClassName:
      "bg-cyan-50 text-cyan-700",
  },

  pharmacy: {
    icon: Pill,

    description:
      "Configure safety reviews, partial dispensing, verification, counseling, and release.",

    toneClassName:
      "bg-teal-50 text-teal-700",
  },

  billing: {
    icon: CreditCard,

    description:
      "Configure overpayment, coverage references, adjustment and reversal controls, and discount thresholds.",

    toneClassName:
      "bg-emerald-50 text-emerald-700",
  },
}

function cloneOperationalValues(
  operations:
    OperationalSettings
): OperationalSettings {
  return {
    appointments: {
      ...operations.appointments,
    },

    clinical: {
      ...operations.clinical,
    },

    laboratory: {
      ...operations.laboratory,
    },

    radiology: {
      ...operations.radiology,
    },

    pharmacy: {
      ...operations.pharmacy,
    },

    billing: {
      ...operations.billing,
    },
  }
}

function getDefaultValues(
  operations:
    OperationalSettings
): OperationalSettingsFormValues {
  return {
    ...cloneOperationalValues(
      operations
    ),

    updatedBy: "",
  }
}

function ToggleSetting({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
      <div className="mt-0.5">
        {children}
      </div>

      <span>
        <span className="block text-sm font-medium">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  )
}

export function OperationalSettingsWorkspace({
  section,
}: OperationalSettingsWorkspaceProps) {
  const {
    settings,
    updateOperationalSettings,
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
    useForm<OperationalSettingsFormValues>(
      {
        resolver:
          zodResolver(
            operationalSettingsFormSchema
          ) as Resolver<OperationalSettingsFormValues>,

        defaultValues:
          getDefaultValues(
            settings.operations
          ),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    reset(
      getDefaultValues(
        settings.operations
      )
    )
  }, [
    reset,
    settings.operations,
  ])

  const metadata =
    sectionMetadata[section]

  const Icon =
    metadata.icon

  async function submitOperationalSettings(
    values:
      OperationalSettingsFormValues
  ) {
    try {
      const updatedOperations =
        updateOperationalSettings(
          values
        )

      reset(
        getDefaultValues(
          updatedOperations
        )
      )

      toast.success(
        "Operational configuration saved",
        {
          description: `${SETTINGS_SECTION_LABELS[
            section
          ]} was updated successfully.`,
        }
      )
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The operational configuration could not be saved.",
      })
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div
          className={`rounded-xl p-2.5 ${metadata.toneClassName}`}
        >
          <Icon
            className="size-5"
            aria-hidden="true"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            {
              SETTINGS_SECTION_LABELS[
                section
              ]
            }
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {metadata.description}
          </p>
        </div>
      </div>

      <form
        noValidate
        className="space-y-6 rounded-xl border bg-background p-5"
        onSubmit={handleSubmit(
          submitOperationalSettings
        )}
      >
        {section ===
        "appointments" ? (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-default-appointment-duration">
                  Default duration in minutes
                </Label>

                <Input
                  id="settings-default-appointment-duration"
                  type="number"
                  min={5}
                  max={480}
                  {...register(
                    "appointments.defaultDurationMinutes"
                  )}
                />

                {errors.appointments
                  ?.defaultDurationMinutes
                  ?.message ? (
                  <p className="text-xs font-medium text-destructive">
                    {
                      errors.appointments
                        .defaultDurationMinutes
                        .message
                    }
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-check-in-grace">
                  Check-in grace period
                </Label>

                <Input
                  id="settings-check-in-grace"
                  type="number"
                  min={0}
                  max={240}
                  {...register(
                    "appointments.checkInGraceMinutes"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-no-show-after">
                  Mark no-show after
                </Label>

                <Input
                  id="settings-no-show-after"
                  type="number"
                  min={0}
                  max={480}
                  {...register(
                    "appointments.noShowAfterMinutes"
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <ToggleSetting
                title="Allow same-day booking"
                description="Permit appointment creation for the current operating date."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-sky-700"
                  {...register(
                    "appointments.allowSameDayBooking"
                  )}
                />
              </ToggleSetting>

              <ToggleSetting
                title="Require appointment confirmation"
                description="Keep newly scheduled appointments pending until they are explicitly confirmed."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-sky-700"
                  {...register(
                    "appointments.requireConfirmation"
                  )}
                />
              </ToggleSetting>
            </div>
          </section>
        ) : null}

        {section === "clinical" ? (
          <section className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="settings-follow-up-days">
                Default follow-up days
              </Label>

              <Input
                id="settings-follow-up-days"
                type="number"
                min={0}
                max={365}
                className="max-w-xs"
                {...register(
                  "clinical.defaultFollowUpDays"
                )}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <ToggleSetting
                title="Require allergy review"
                description="Require review of the active allergy profile during the clinical workflow."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-indigo-700"
                  {...register(
                    "clinical.requireAllergyReview"
                  )}
                />
              </ToggleSetting>

              <ToggleSetting
                title="Require vital signs before consultation"
                description="Require a current vital-sign measurement before consultation begins."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-indigo-700"
                  {...register(
                    "clinical.requireVitalSignsBeforeConsultation"
                  )}
                />
              </ToggleSetting>

              <ToggleSetting
                title="Allow consultation without appointment"
                description="Allow authorized users to create walk-in consultation encounters."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-indigo-700"
                  {...register(
                    "clinical.allowConsultationWithoutAppointment"
                  )}
                />
              </ToggleSetting>
            </div>
          </section>
        ) : null}

        {section ===
        "laboratory" ? (
          <section className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="settings-lab-escalation-minutes">
                Critical-result escalation minutes
              </Label>

              <Input
                id="settings-lab-escalation-minutes"
                type="number"
                min={1}
                max={1440}
                className="max-w-xs"
                {...register(
                  "laboratory.criticalResultEscalationMinutes"
                )}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <ToggleSetting
                title="Require specimen collection"
                description="Require a specimen record before laboratory processing begins."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-violet-700"
                  {...register(
                    "laboratory.requireSpecimenCollection"
                  )}
                />
              </ToggleSetting>

              <ToggleSetting
                title="Require result verification"
                description="Require verification before laboratory results can be released."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-violet-700"
                  {...register(
                    "laboratory.requireResultVerification"
                  )}
                />
              </ToggleSetting>

              <ToggleSetting
                title="Require critical-result acknowledgement"
                description="Require documented acknowledgement of critical laboratory results."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-violet-700"
                  {...register(
                    "laboratory.requireCriticalResultAcknowledgement"
                  )}
                />
              </ToggleSetting>
            </div>
          </section>
        ) : null}

        {section ===
        "radiology" ? (
          <section className="grid gap-3 lg:grid-cols-2">
            <ToggleSetting
              title="Require preparation checklist"
              description="Require preparation confirmation before imaging acquisition."
            >
              <input
                type="checkbox"
                className="size-4 accent-cyan-700"
                {...register(
                  "radiology.requirePreparationChecklist"
                )}
              />
            </ToggleSetting>

            <ToggleSetting
              title="Require technical completion"
              description="Require technical completion before radiology reporting begins."
            >
              <input
                type="checkbox"
                className="size-4 accent-cyan-700"
                {...register(
                  "radiology.requireTechnicalCompletion"
                )}
              />
            </ToggleSetting>

            <ToggleSetting
              title="Require report verification"
              description="Require report verification before the radiology report can be released."
            >
              <input
                type="checkbox"
                className="size-4 accent-cyan-700"
                {...register(
                  "radiology.requireReportVerification"
                )}
              />
            </ToggleSetting>

            <ToggleSetting
              title="Require critical-finding communication"
              description="Require documented communication of critical radiology findings."
            >
              <input
                type="checkbox"
                className="size-4 accent-cyan-700"
                {...register(
                  "radiology.requireCriticalFindingCommunication"
                )}
              />
            </ToggleSetting>
          </section>
        ) : null}

        {section ===
        "pharmacy" ? (
          <section className="grid gap-3 lg:grid-cols-2">
            <ToggleSetting
              title="Require allergy review"
              description="Require a medication-allergy review before dispensing."
            >
              <input
                type="checkbox"
                className="size-4 accent-teal-700"
                {...register(
                  "pharmacy.requireAllergyReview"
                )}
              />
            </ToggleSetting>

            <ToggleSetting
              title="Require interaction review"
              description="Require a medication-interaction review before dispensing."
            >
              <input
                type="checkbox"
                className="size-4 accent-teal-700"
                {...register(
                  "pharmacy.requireInteractionReview"
                )}
              />
            </ToggleSetting>

            <ToggleSetting
              title="Allow partial dispensing"
              description="Allow prescribed quantities to be released through multiple dispensing events."
            >
              <input
                type="checkbox"
                className="size-4 accent-teal-700"
                {...register(
                  "pharmacy.allowPartialDispensing"
                )}
              />
            </ToggleSetting>

            <ToggleSetting
              title="Require pharmacist verification"
              description="Require final pharmacist verification after all prescription items are dispensed."
            >
              <input
                type="checkbox"
                className="size-4 accent-teal-700"
                {...register(
                  "pharmacy.requirePharmacistVerification"
                )}
              />
            </ToggleSetting>

            <ToggleSetting
              title="Require counseling before release"
              description="Require documented medication counseling before final release."
            >
              <input
                type="checkbox"
                className="size-4 accent-teal-700"
                {...register(
                  "pharmacy.requireCounselingBeforeRelease"
                )}
              />
            </ToggleSetting>
          </section>
        ) : null}

        {section === "billing" ? (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-billing-currency">
                  Currency
                </Label>

                <Input
                  id="settings-billing-currency"
                  readOnly
                  {...register(
                    "billing.currency"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-max-discount-centavos">
                  Maximum unapproved discount in centavos
                </Label>

                <Input
                  id="settings-max-discount-centavos"
                  type="number"
                  min={0}
                  max={100000000}
                  {...register(
                    "billing.maxUnapprovedDiscountCentavos"
                  )}
                />

                <p className="text-xs text-muted-foreground">
                  100 centavos is equal to
                  PHP 1.00.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <ToggleSetting
                title="Allow overpayment"
                description="Allow posted payments to create a patient credit balance."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-emerald-700"
                  {...register(
                    "billing.allowOverpayment"
                  )}
                />
              </ToggleSetting>

              <ToggleSetting
                title="Require coverage reference"
                description="Require an insurance or company reference when coverage is allocated."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-emerald-700"
                  {...register(
                    "billing.requireCoverageReference"
                  )}
                />
              </ToggleSetting>

              <ToggleSetting
                title="Require adjustment reason"
                description="Require documentation for discounts, write-offs, and billing corrections."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-emerald-700"
                  {...register(
                    "billing.requireAdjustmentReason"
                  )}
                />
              </ToggleSetting>

              <ToggleSetting
                title="Require reversal reason"
                description="Require documentation before any financial record is reversed or voided."
              >
                <input
                  type="checkbox"
                  className="size-4 accent-emerald-700"
                  {...register(
                    "billing.requireReversalReason"
                  )}
                />
              </ToggleSetting>
            </div>
          </section>
        ) : null}

        <section className="space-y-2 border-t pt-5">
          <Label htmlFor={`settings-${section}-updated-by`}>
            Responsible staff member
          </Label>

          <Input
            id={`settings-${section}-updated-by`}
            placeholder="Synthetic Settings Administrator"
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

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            {SETTINGS_SYNTHETIC_NOTICE}
            Saving this section updates the
            shared operational configuration
            and creates audit records only
            for changed modules.
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
                Saving configuration
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save configuration
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  )
}
