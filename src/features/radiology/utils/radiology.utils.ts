import type {
  RadiologyOrder,
  RadiologyOrderStatus,
  RadiologyPreparationChecklistItem,
  RadiologyProcedureDefinition,
} from "@/features/radiology/types/radiology.types"
import type {
  RadiologyScheduleFormValues,
} from "@/features/radiology/schemas/radiology-schedule.schema"

export type RadiologyConflictResource =
  | "patient"
  | "room"

export interface RadiologyScheduleConflict {
  resource:
    RadiologyConflictResource

  order: RadiologyOrder
}

const conflictBlockingStatuses =
  new Set<RadiologyOrderStatus>([
    "scheduled",
    "checked-in",
    "ready",
    "in-progress",
  ])

export function createTemporaryRadiologyId(
  prefix: string
): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function generateRadiologyOrderNumber(
  orders:
    readonly RadiologyOrder[],

  year = new Date().getFullYear()
): string {
  const prefix =
    `GM-RAD-${year}-`

  const highestSequence =
    orders.reduce(
      (highest, order) => {
        if (
          !order.orderNumber.startsWith(
            prefix
          )
        ) {
          return highest
        }

        const sequence = Number(
          order.orderNumber.slice(
            prefix.length
          )
        )

        return (
          Number.isInteger(sequence) &&
          sequence > highest
            ? sequence
            : highest
        )
      },
      0
    )

  return `${prefix}${String(
    highestSequence + 1
  ).padStart(6, "0")}`
}

export function buildRadiologyPreparationChecklist(
  procedure:
    RadiologyProcedureDefinition
): RadiologyPreparationChecklistItem[] {
  return procedure.preparationItems.map(
    (item) => ({
      id:
        createTemporaryRadiologyId(
          "radiology-preparation"
        ),

      code: item.code,
      label: item.label,
      required: item.required,

      completed: false,
      completedAt: null,
      completedBy: null,

      notes: null,
    })
  )
}

function parseLocalDateAndTime(
  dateValue: string,
  timeValue: string
): Date {
  const [year, month, day] =
    dateValue.split("-").map(Number)

  const [hour, minute] =
    timeValue.split(":").map(Number)

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  )
}

export function buildRadiologySchedule(
  values:
    Pick<
      RadiologyScheduleFormValues,
      | "scheduledDate"
      | "startTime"
      | "durationMinutes"
    >
): {
  scheduledStartAt: string
  scheduledEndAt: string
  durationMinutes: number
} {
  const durationMinutes =
    Number(values.durationMinutes)

  const startDate =
    parseLocalDateAndTime(
      values.scheduledDate,
      values.startTime
    )

  const endDate = new Date(
    startDate.getTime() +
      durationMinutes *
        60 *
        1000
  )

  return {
    scheduledStartAt:
      startDate.toISOString(),

    scheduledEndAt:
      endDate.toISOString(),

    durationMinutes,
  }
}

export function radiologySchedulesOverlap(
  firstStartAt: string,
  firstEndAt: string,
  secondStartAt: string,
  secondEndAt: string
): boolean {
  const firstStart =
    new Date(firstStartAt).getTime()

  const firstEnd =
    new Date(firstEndAt).getTime()

  const secondStart =
    new Date(secondStartAt).getTime()

  const secondEnd =
    new Date(secondEndAt).getTime()

  if (
    [
      firstStart,
      firstEnd,
      secondStart,
      secondEnd,
    ].some(Number.isNaN)
  ) {
    return false
  }

  return (
    firstStart < secondEnd &&
    firstEnd > secondStart
  )
}

export function findRadiologyScheduleConflicts(
  orders:
    readonly RadiologyOrder[],

  candidate: {
    patientId: string
    roomId: string

    scheduledStartAt: string
    scheduledEndAt: string
  },

  excludedOrderId?: string
): RadiologyScheduleConflict[] {
  const conflicts:
    RadiologyScheduleConflict[] = []

  orders.forEach((order) => {
    if (
      order.id === excludedOrderId ||
      !conflictBlockingStatuses.has(
        order.status
      ) ||
      !order.scheduledStartAt ||
      !order.scheduledEndAt
    ) {
      return
    }

    const overlaps =
      radiologySchedulesOverlap(
        order.scheduledStartAt,
        order.scheduledEndAt,
        candidate.scheduledStartAt,
        candidate.scheduledEndAt
      )

    if (!overlaps) {
      return
    }

    if (
      order.patientId ===
      candidate.patientId
    ) {
      conflicts.push({
        resource: "patient",
        order,
      })
    }

    if (
      order.roomId ===
      candidate.roomId
    ) {
      conflicts.push({
        resource: "room",
        order,
      })
    }
  })

  return conflicts
}

const radiologyRangeFormatter =
  new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

export function formatRadiologyScheduleRange(
  order:
    Pick<
      RadiologyOrder,
      | "scheduledStartAt"
      | "scheduledEndAt"
    >
): string {
  if (
    !order.scheduledStartAt ||
    !order.scheduledEndAt
  ) {
    return "Not scheduled"
  }

  const startDate =
    new Date(
      order.scheduledStartAt
    )

  const endDate =
    new Date(
      order.scheduledEndAt
    )

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return "Schedule unavailable"
  }

  return `${radiologyRangeFormatter.format(
    startDate
  )} – ${radiologyRangeFormatter.format(
    endDate
  )}`
}
