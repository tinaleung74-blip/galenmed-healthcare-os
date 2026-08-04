"use client"

import {
  useEffect,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  CalendarClock,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  RADIOLOGY_MODALITY_LABELS,
  RADIOLOGY_PROCEDURE_CATALOG,
  RADIOLOGY_ROOMS,
} from "@/features/radiology/constants/radiology.constants"
import { useRadiology } from "@/features/radiology/providers/radiology-provider"
import {
  radiologyScheduleFormSchema,
  type RadiologyScheduleFormValues,
} from "@/features/radiology/schemas/radiology-schedule.schema"
import type {
  RadiologyOrder,
} from "@/features/radiology/types/radiology.types"
import {
  buildRadiologySchedule,
  findRadiologyScheduleConflicts,
  formatRadiologyScheduleRange,
} from "@/features/radiology/utils/radiology.utils"

interface RadiologyScheduleDialogProps {
  order: RadiologyOrder | null

  defaultDate: string

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitSchedule: (
    values:
      RadiologyScheduleFormValues
  ) => Promise<void>
}

function toLocalDateInput(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const offset =
    date.getTimezoneOffset() *
    60 *
    1000

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 10)
}

function toLocalTimeInput(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return [
    String(
      date.getHours()
    ).padStart(2, "0"),

    String(
      date.getMinutes()
    ).padStart(2, "0"),
  ].join(":")
}

function getDefaultValues(
  order: RadiologyOrder | null,
  defaultDate: string
): RadiologyScheduleFormValues {
  const procedure =
    order
      ? RADIOLOGY_PROCEDURE_CATALOG.find(
          (candidateProcedure) =>
            candidateProcedure.code ===
            order.procedureCode
        ) ?? null
      : null

  return {
    scheduledDate:
      order?.scheduledStartAt
        ? toLocalDateInput(
            order.scheduledStartAt
          )
        : defaultDate,

    startTime:
      order?.scheduledStartAt
        ? toLocalTimeInput(
            order.scheduledStartAt
          )
        : "09:00",

    durationMinutes:
      String(
        order?.durationMinutes ??
        procedure?.defaultDurationMinutes ??
        30
      ),

    roomId:
      order?.roomId ?? "",

    schedulingNotes:
      order?.schedulingNotes ?? "",
  }
}

export function RadiologyScheduleDialog({
  order,
  defaultDate,
  open,
  onOpenChange,
  onSubmitSchedule,
}: RadiologyScheduleDialogProps) {
  const { radiologyOrders } =
    useRadiology()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<RadiologyScheduleFormValues>(
      {
        resolver: zodResolver(
          radiologyScheduleFormSchema
        ),

        defaultValues:
          getDefaultValues(
            order,
            defaultDate
          ),

        mode: "onTouched",
      }
    )

  const scheduledDate =
    useWatch({
      control,
      name: "scheduledDate",
    })

  const startTime =
    useWatch({
      control,
      name: "startTime",
    })

  const durationMinutes =
    useWatch({
      control,
      name: "durationMinutes",
    })

  const roomId =
    useWatch({
      control,
      name: "roomId",
    })

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(
          order,
          defaultDate
        )
      )
    }
  }, [
    defaultDate,
    open,
    order,
    reset,
  ])

  if (!order) {
    return null
  }

  const availableRooms =
    RADIOLOGY_ROOMS.filter(
      (room) =>
        room.branchId ===
          order.branchId &&
        room.supportedModalities.some(
          (modality) =>
            modality ===
            order.modality
        )
    )

  let liveConflicts:
    ReturnType<
      typeof findRadiologyScheduleConflicts
    > = []

  const duration =
    Number(durationMinutes)

  if (
    scheduledDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      scheduledDate
    ) &&
    startTime &&
    /^\d{2}:\d{2}$/.test(
      startTime
    ) &&
    Number.isInteger(duration) &&
    duration >= 10 &&
    roomId
  ) {
    try {
      const schedule =
        buildRadiologySchedule({
          scheduledDate,
          startTime,
          durationMinutes,
        })

      liveConflicts =
        findRadiologyScheduleConflicts(
          radiologyOrders,
          {
            patientId:
              order.patientId,

            roomId,

            scheduledStartAt:
              schedule.scheduledStartAt,

            scheduledEndAt:
              schedule.scheduledEndAt,
          },
          order.id
        )
    } catch {
      liveConflicts = []
    }
  }

  async function submitSchedule(
    values:
      RadiologyScheduleFormValues
  ) {
    try {
      await onSubmitSchedule(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The radiology schedule could not be saved.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <CalendarClock
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            {order.status ===
            "scheduled"
              ? "Reschedule imaging"
              : "Schedule imaging"}
          </DialogTitle>

          <DialogDescription>
            {order.orderNumber}
            {" · "}
            {order.procedureName}
            {" · "}
            {
              RADIOLOGY_MODALITY_LABELS[
                order.modality
              ]
            }
          </DialogDescription>
        </DialogHeader>

        <form
          id="radiology-schedule-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitSchedule
          )}
        >
          {order.scheduledStartAt ? (
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current schedule
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatRadiologyScheduleRange(
                  order
                )}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {order.roomName ??
                  "Room not assigned"}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="radiology-scheduled-date">
                Imaging date
              </Label>

              <Input
                id="radiology-scheduled-date"
                type="date"
                {...register(
                  "scheduledDate"
                )}
              />

              {errors.scheduledDate
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.scheduledDate
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="radiology-start-time">
                Start time
              </Label>

              <Input
                id="radiology-start-time"
                type="time"
                {...register(
                  "startTime"
                )}
              />

              {errors.startTime
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.startTime
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="radiology-duration">
                Duration
              </Label>

              <Input
                id="radiology-duration"
                type="number"
                min={10}
                max={240}
                step={5}
                inputMode="numeric"
                {...register(
                  "durationMinutes"
                )}
              />

              {errors.durationMinutes
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors
                      .durationMinutes
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="radiology-room">
                Imaging room
              </Label>

              <select
                id="radiology-room"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                {...register("roomId")}
              >
                <option value="">
                  Select room
                </option>

                {availableRooms.map(
                  (room) => (
                    <option
                      key={room.id}
                      value={room.id}
                    >
                      {room.name}
                    </option>
                  )
                )}
              </select>

              {errors.roomId
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.roomId
                      .message
                  }
                </p>
              ) : null}
            </div>
          </div>

          {liveConflicts.length > 0 ? (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-2 text-rose-800">
                <ShieldAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-sm font-semibold">
                    Scheduling conflict detected
                  </p>

                  <p className="mt-1 text-xs">
                    Change the date, time,
                    duration, or room before
                    saving.
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {liveConflicts.map(
                  (
                    conflict,
                    index
                  ) => (
                    <div
                      key={`${conflict.resource}-${conflict.order.id}-${index}`}
                      className="rounded-lg border border-rose-200 bg-white p-3 text-xs text-rose-800"
                    >
                      <strong className="capitalize">
                        {conflict.resource}
                      </strong>

                      {" conflict with "}

                      {
                        conflict.order
                          .orderNumber
                      }

                      {": "}

                      {formatRadiologyScheduleRange(
                        conflict.order
                      )}
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="radiology-scheduling-notes">
              Scheduling notes
              <span className="ml-1 font-normal text-muted-foreground">
                Optional
              </span>
            </Label>

            <Textarea
              id="radiology-scheduling-notes"
              rows={3}
              {...register(
                "schedulingNotes"
              )}
            />
          </div>

          {errors.root?.message ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="radiology-schedule-form"
            disabled={
              isSubmitting ||
              liveConflicts.length > 0
            }
            className="bg-sky-700 text-white hover:bg-sky-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving schedule
              </>
            ) : (
              <>
                <CalendarClock
                  aria-hidden="true"
                />

                {order.status ===
                "scheduled"
                  ? "Save reschedule"
                  : "Save schedule"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
