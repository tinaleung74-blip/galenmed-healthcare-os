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
  BellRing,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  SETTINGS_NOTIFICATION_CHANNEL_LABELS,
  SETTINGS_NOTIFICATION_EVENT_LABELS,
  SETTINGS_SYNTHETIC_NOTICE,
} from "@/features/settings/constants/settings.constants"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import {
  notificationSettingsFormSchema,
  type NotificationSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import {
  SETTINGS_NOTIFICATION_CHANNELS,
  SETTINGS_NOTIFICATION_EVENTS,
  type NotificationSettings,
} from "@/features/settings/types/settings.types"

function getDefaultValues(
  notifications:
    NotificationSettings
): NotificationSettingsFormValues {
  return {
    channels: {
      ...notifications.channels,
    },

    events: {
      ...notifications.events,
    },

    updatedBy: "",
  }
}

export function NotificationSettingsWorkspace() {
  const {
    settings,
    updateNotificationSettings,
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
    useForm<NotificationSettingsFormValues>(
      {
        resolver: zodResolver(
          notificationSettingsFormSchema
        ),

        defaultValues:
          getDefaultValues(
            settings.notifications
          ),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    reset(
      getDefaultValues(
        settings.notifications
      )
    )
  }, [
    reset,
    settings.notifications,
  ])

  const channelError =
    (
      errors.channels as
        | {
            message?: string
          }
        | undefined
    )?.message

  async function submitNotifications(
    values:
      NotificationSettingsFormValues
  ) {
    try {
      const updatedNotifications =
        updateNotificationSettings(
          values
        )

      reset(
        getDefaultValues(
          updatedNotifications
        )
      )

      toast.success(
        "Notification preferences saved",
        {
          description:
            "Notification channels and event preferences were updated successfully.",
        }
      )
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The notification preferences could not be saved.",
      })
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
          <BellRing
            className="size-5"
            aria-hidden="true"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            Notification Preferences
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure enabled delivery
            channels and operational events
            that generate notifications.
          </p>
        </div>
      </div>

      <form
        noValidate
        className="space-y-6 rounded-xl border bg-background p-5"
        onSubmit={handleSubmit(
          submitNotifications
        )}
      >
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">
              Delivery channels
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              At least one channel must be
              enabled when notification
              events are active.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {SETTINGS_NOTIFICATION_CHANNELS.map(
              (channel) => (
                <label
                  key={channel}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-amber-700"
                    {...register(
                      `channels.${channel}` as const
                    )}
                  />

                  <span>
                    <span className="block text-sm font-medium">
                      {
                        SETTINGS_NOTIFICATION_CHANNEL_LABELS[
                          channel
                        ]
                      }
                    </span>

                    <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                      {channel}
                    </span>
                  </span>
                </label>
              )
            )}
          </div>

          {channelError ? (
            <p className="text-xs font-medium text-destructive">
              {channelError}
            </p>
          ) : null}
        </section>

        <section className="space-y-4 border-t pt-5">
          <div>
            <h3 className="text-sm font-semibold">
              Notification events
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Enable only the operational
              events that should generate
              notifications.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {SETTINGS_NOTIFICATION_EVENTS.map(
              (eventName) => (
                <label
                  key={eventName}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-amber-700"
                    {...register(
                      `events.${eventName}` as const
                    )}
                  />

                  <span>
                    <span className="block text-sm font-medium">
                      {
                        SETTINGS_NOTIFICATION_EVENT_LABELS[
                          eventName
                        ]
                      }
                    </span>

                    <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                      {eventName}
                    </span>
                  </span>
                </label>
              )
            )}
          </div>
        </section>

        <section className="space-y-2 border-t pt-5">
          <Label htmlFor="settings-notifications-updated-by">
            Responsible staff member
          </Label>

          <Input
            id="settings-notifications-updated-by"
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
            These preferences do not send
            real email or SMS messages.
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
            className="bg-amber-700 text-white hover:bg-amber-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving preferences
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save notification preferences
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  )
}
