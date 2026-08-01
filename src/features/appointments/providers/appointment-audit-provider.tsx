"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react"

import type {
  AppointmentAuditEvent,
  AppointmentAuditEventDetail,
} from "@/features/appointments/types/appointment-audit.types"
import type { AppointmentRecord } from "@/features/appointments/types/appointment.types"
import { formatAppointmentRange } from "@/features/appointments/utils/appointment.utils"
import { usePersistentDevelopmentState } from "@/hooks/use-persistent-development-state"

const APPOINTMENT_AUDIT_STORAGE_KEY =
  "galenmed:development:appointment-audit-events:v1"

const INITIAL_APPOINTMENT_AUDIT_EVENTS:
  AppointmentAuditEvent[] = []

interface AppointmentAuditContextValue {
  recordedAuditEvents:
    AppointmentAuditEvent[]

  recordAppointmentRevision: (
    previousAppointment:
      AppointmentRecord,

    updatedAppointment:
      AppointmentRecord
  ) => AppointmentAuditEvent
}

const AppointmentAuditContext =
  createContext<AppointmentAuditContextValue | null>(
    null
  )

interface AppointmentAuditProviderProps {
  children: ReactNode
}

function createTemporaryAuditEventId(): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `appointment-audit-${globalThis.crypto.randomUUID()}`
  }

  return `appointment-audit-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function buildRevisionDetails(
  previousAppointment:
    AppointmentRecord,

  updatedAppointment:
    AppointmentRecord
): AppointmentAuditEventDetail[] {
  const details:
    AppointmentAuditEventDetail[] = []

  const scheduleChanged =
    previousAppointment.scheduledStartAt !==
      updatedAppointment.scheduledStartAt ||
    previousAppointment.scheduledEndAt !==
      updatedAppointment.scheduledEndAt

  if (scheduleChanged) {
    details.push(
      {
        label: "Previous schedule",
        value: formatAppointmentRange(
          previousAppointment
        ),
      },
      {
        label: "Updated schedule",
        value: formatAppointmentRange(
          updatedAppointment
        ),
      }
    )
  }

  if (
    previousAppointment.doctorId !==
    updatedAppointment.doctorId
  ) {
    details.push(
      {
        label: "Previous doctor",
        value:
          previousAppointment.doctorName,
      },
      {
        label: "Updated doctor",
        value:
          updatedAppointment.doctorName,
      }
    )
  }

  if (
    previousAppointment.departmentId !==
    updatedAppointment.departmentId
  ) {
    details.push(
      {
        label: "Previous department",
        value:
          previousAppointment.departmentName,
      },
      {
        label: "Updated department",
        value:
          updatedAppointment.departmentName,
      }
    )
  }

  if (
    previousAppointment.roomId !==
    updatedAppointment.roomId
  ) {
    details.push(
      {
        label: "Previous room",
        value:
          previousAppointment.roomName ??
          "Telemedicine",
      },
      {
        label: "Updated room",
        value:
          updatedAppointment.roomName ??
          "Telemedicine",
      }
    )
  }

  if (
    previousAppointment.mode !==
    updatedAppointment.mode
  ) {
    details.push(
      {
        label: "Previous mode",
        value:
          previousAppointment.mode,
      },
      {
        label: "Updated mode",
        value:
          updatedAppointment.mode,
      }
    )
  }

  if (
    previousAppointment.status !==
    updatedAppointment.status
  ) {
    details.push(
      {
        label: "Previous status",
        value:
          previousAppointment.status,
      },
      {
        label: "Updated status",
        value:
          updatedAppointment.status,
      }
    )
  }

  if (
    previousAppointment.chiefComplaint !==
    updatedAppointment.chiefComplaint
  ) {
    details.push({
      label:
        "Updated appointment reason",
      value:
        updatedAppointment.chiefComplaint,
      sensitive: true,
    })
  }

  if (details.length === 0) {
    details.push({
      label: "Appointment",
      value:
        updatedAppointment.appointmentNumber,
    })
  }

  return details
}

export function AppointmentAuditProvider({
  children,
}: AppointmentAuditProviderProps) {
  const [
    recordedAuditEvents,
    setRecordedAuditEvents,
  ] =
    usePersistentDevelopmentState<
      AppointmentAuditEvent[]
    >(
      APPOINTMENT_AUDIT_STORAGE_KEY,
      INITIAL_APPOINTMENT_AUDIT_EVENTS
    )

  const recordAppointmentRevision =
    useCallback(
      (
        previousAppointment:
          AppointmentRecord,

        updatedAppointment:
          AppointmentRecord
      ): AppointmentAuditEvent => {
        const scheduleChanged =
          previousAppointment.scheduledStartAt !==
            updatedAppointment.scheduledStartAt ||
          previousAppointment.scheduledEndAt !==
            updatedAppointment.scheduledEndAt

        const newEvent:
          AppointmentAuditEvent = {
          id:
            createTemporaryAuditEventId(),

          appointmentId:
            updatedAppointment.id,

          patientId:
            updatedAppointment.patientId,

          occurredAt:
            updatedAppointment.updatedAt,

          action: scheduleChanged
            ? "rescheduled"
            : "updated",

          title: scheduleChanged
            ? "Appointment rescheduled"
            : "Appointment updated",

          summary: scheduleChanged
            ? `${updatedAppointment.appointmentNumber} was rescheduled from ${formatAppointmentRange(
                previousAppointment
              )} to ${formatAppointmentRange(
                updatedAppointment
              )}.`
            : `${updatedAppointment.appointmentNumber} appointment details were updated.`,

          actor:
            updatedAppointment.updatedBy,

          reference:
            updatedAppointment.appointmentNumber,

          details: buildRevisionDetails(
            previousAppointment,
            updatedAppointment
          ),
        }

        setRecordedAuditEvents(
          (currentEvents) => [
            newEvent,
            ...currentEvents,
          ]
        )

        return newEvent
      },
      [setRecordedAuditEvents]
    )

  const contextValue =
    useMemo<AppointmentAuditContextValue>(
      () => ({
        recordedAuditEvents,
        recordAppointmentRevision,
      }),
      [
        recordedAuditEvents,
        recordAppointmentRevision,
      ]
    )

  return (
    <AppointmentAuditContext.Provider
      value={contextValue}
    >
      {children}
    </AppointmentAuditContext.Provider>
  )
}

export function useAppointmentAudit(): AppointmentAuditContextValue {
  const context = useContext(
    AppointmentAuditContext
  )

  if (!context) {
    throw new Error(
      "useAppointmentAudit must be used inside AppointmentAuditProvider."
    )
  }

  return context
}
