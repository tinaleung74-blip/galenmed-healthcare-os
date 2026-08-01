"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react"

import { useAppointments } from "@/features/appointments/providers/appointment-provider"
import type { AppointmentRecord } from "@/features/appointments/types/appointment.types"
import { MOCK_CONSULTATIONS } from "@/features/consultations/data/consultation.mock-data"
import { usePersistentDevelopmentState } from "@/hooks/use-persistent-development-state"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"

const CONSULTATION_STORAGE_KEY =
  "galenmed:development:consultations:v2"

const INITIAL_CONSULTATIONS:
  ConsultationEncounter[] = [
  ...MOCK_CONSULTATIONS,
]

interface ConsultationContextValue {
  consultations: ConsultationEncounter[]

  queueAppointmentConsultation: (
    appointment: AppointmentRecord
  ) => ConsultationEncounter

  startConsultation: (
    consultationId: string
  ) => ConsultationEncounter

  completeConsultation: (
    consultationId: string,
    completedAt?: string
  ) => ConsultationEncounter

  cancelConsultation: (
    consultationId: string,
    cancellationReason: string
  ) => ConsultationEncounter

  markConsultationNoShow: (
    consultationId: string
  ) => ConsultationEncounter
}

const ConsultationContext =
  createContext<ConsultationContextValue | null>(
    null
  )

interface ConsultationProviderProps {
  children: ReactNode
}

function createTemporaryConsultationId(): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `consultation-${globalThis.crypto.randomUUID()}`
  }

  return `consultation-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function generateConsultationNumber(
  consultations:
    readonly ConsultationEncounter[],
  year: number
): string {
  const prefix = `GM-CON-${year}-`

  const highestSequence =
    consultations.reduce(
      (highest, consultation) => {
        if (
          !consultation.consultationNumber.startsWith(
            prefix
          )
        ) {
          return highest
        }

        const sequence = Number(
          consultation.consultationNumber.slice(
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

function getNextQueueNumber(
  consultations:
    readonly ConsultationEncounter[],
  scheduledAt: string
): number {
  const scheduledDate =
    scheduledAt.slice(0, 10)

  const highestQueueNumber =
    consultations.reduce(
      (highest, consultation) => {
        if (
          consultation.scheduledAt.slice(
            0,
            10
          ) !== scheduledDate
        ) {
          return highest
        }

        return Math.max(
          highest,
          consultation.queueNumber ?? 0
        )
      },
      0
    )

  return highestQueueNumber + 1
}
export function ConsultationProvider({
  children,
}: ConsultationProviderProps) {
  const {
    markAppointmentInConsultation,
    completeAppointmentFromConsultation,
  } = useAppointments()

  const [
    consultations,
    setConsultations,
  ] =
    usePersistentDevelopmentState<
      ConsultationEncounter[]
    >(
      CONSULTATION_STORAGE_KEY,
      INITIAL_CONSULTATIONS
    )

  const consultationsRef =
    useRef<ConsultationEncounter[]>(
      consultations
    )

  useEffect(() => {
    consultationsRef.current =
      consultations
  }, [consultations])

  const queueAppointmentConsultation =
    useCallback(
      (
        appointment: AppointmentRecord
      ): ConsultationEncounter => {
        const existingConsultation =
          consultationsRef.current.find(
            (consultation) =>
              consultation.id ===
                appointment.linkedConsultationId ||
              consultation.consultationNumber ===
                appointment.linkedConsultationNumber
          )

        if (existingConsultation) {
          return existingConsultation
        }

        if (
          appointment.status !==
          "checked-in"
        ) {
          throw new Error(
            "Only a checked-in appointment can be sent to the consultation queue."
          )
        }

        const scheduledDate =
          new Date(
            appointment.scheduledStartAt
          )

        const scheduledYear =
          Number.isNaN(
            scheduledDate.getTime()
          )
            ? new Date().getFullYear()
            : scheduledDate.getFullYear()

        const now =
          new Date().toISOString()

        const newConsultation:
          ConsultationEncounter = {
          id:
            createTemporaryConsultationId(),

          consultationNumber:
            generateConsultationNumber(
              consultationsRef.current,
              scheduledYear
            ),

          patientId:
            appointment.patientId,

          scheduledAt:
            appointment.scheduledStartAt,

          checkedInAt:
            appointment.checkedInAt ??
            now,

          startedAt: null,
          completedAt: null,
          cancelledAt: null,

          status: "waiting",

          priority:
            appointment.priority,

          mode:
            appointment.mode,

          visitType:
            appointment.visitType,

          departmentId:
            appointment.departmentId,

          departmentName:
            appointment.departmentName,

          doctorId:
            appointment.doctorId,

          doctorName:
            appointment.doctorName,

          chiefComplaint:
            appointment.chiefComplaint,

          queueNumber:
            getNextQueueNumber(
              consultationsRef.current,
              appointment.scheduledStartAt
            ),

          roomName:
            appointment.roomName,

          administrativeNotes:
            `Created from ${appointment.appointmentNumber}.`,

          cancellationReason: null,

          createdAt: now,
          updatedAt: now,
        }

        const nextConsultations = [
          newConsultation,
          ...consultationsRef.current,
        ]

        consultationsRef.current =
          nextConsultations

        setConsultations(
          nextConsultations
        )

        return newConsultation
      },
      [setConsultations]
    )
  const startConsultation = useCallback(
    (
      consultationId: string
    ): ConsultationEncounter => {
      const existingConsultation =
        consultationsRef.current.find(
          (consultation) =>
            consultation.id === consultationId
        )

      if (!existingConsultation) {
        throw new Error(
          "The consultation record was not found."
        )
      }

      if (
        existingConsultation.status ===
        "in-progress"
      ) {
        markAppointmentInConsultation(
          existingConsultation.id,
          existingConsultation.startedAt ??
            new Date().toISOString(),
          existingConsultation.doctorName
        )

        return existingConsultation
      }

      if (
        existingConsultation.status !==
        "waiting"
      ) {
        throw new Error(
          "Only waiting consultations can be started."
        )
      }

      const now = new Date().toISOString()

      const updatedConsultation:
        ConsultationEncounter = {
        ...existingConsultation,
        status: "in-progress",
        startedAt: now,
        updatedAt: now,
      }

      markAppointmentInConsultation(
        updatedConsultation.id,
        now,
        updatedConsultation.doctorName
      )

      const nextConsultations =
        consultationsRef.current.map(
          (consultation) =>
            consultation.id === consultationId
              ? updatedConsultation
              : consultation
        )

      consultationsRef.current =
        nextConsultations

      setConsultations(nextConsultations)

      return updatedConsultation
    },
    [markAppointmentInConsultation, setConsultations]
  )

  const completeConsultation = useCallback(
    (
      consultationId: string,
      completedAt = new Date().toISOString()
    ): ConsultationEncounter => {
      const existingConsultation =
        consultationsRef.current.find(
          (consultation) =>
            consultation.id === consultationId
        )

      if (!existingConsultation) {
        throw new Error(
          "The consultation record was not found."
        )
      }

      if (
        existingConsultation.status ===
        "completed"
      ) {
        completeAppointmentFromConsultation(
          existingConsultation.id,
          existingConsultation.completedAt ??
            completedAt,
          existingConsultation.doctorName
        )

        return existingConsultation
      }

      if (
        existingConsultation.status !==
        "in-progress"
      ) {
        throw new Error(
          "Only an in-progress consultation can be completed."
        )
      }

      const completedConsultation:
        ConsultationEncounter = {
        ...existingConsultation,
        status: "completed",
        completedAt,
        updatedAt: completedAt,
      }

      completeAppointmentFromConsultation(
        completedConsultation.id,
        completedAt,
        completedConsultation.doctorName
      )

      const nextConsultations =
        consultationsRef.current.map(
          (consultation) =>
            consultation.id === consultationId
              ? completedConsultation
              : consultation
        )

      consultationsRef.current =
        nextConsultations

      setConsultations(nextConsultations)

      return completedConsultation
    },
    [completeAppointmentFromConsultation, setConsultations]
  )
  const cancelConsultation = useCallback(
    (
      consultationId: string,
      cancellationReason: string
    ): ConsultationEncounter => {
      const normalizedReason =
        cancellationReason.trim()

      if (normalizedReason.length < 5) {
        throw new Error(
          "A cancellation reason of at least five characters is required."
        )
      }

      const existingConsultation =
        consultationsRef.current.find(
          (consultation) =>
            consultation.id === consultationId
        )

      if (!existingConsultation) {
        throw new Error(
          "The consultation record was not found."
        )
      }

      if (
        existingConsultation.status ===
          "completed" ||
        existingConsultation.status ===
          "cancelled" ||
        existingConsultation.status ===
          "no-show"
      ) {
        throw new Error(
          "The selected consultation cannot be cancelled."
        )
      }

      const now = new Date().toISOString()

      const updatedConsultation:
        ConsultationEncounter = {
        ...existingConsultation,
        status: "cancelled",
        cancelledAt: now,
        cancellationReason:
          normalizedReason,
        updatedAt: now,
      }

      const nextConsultations =
        consultationsRef.current.map(
          (consultation) =>
            consultation.id === consultationId
              ? updatedConsultation
              : consultation
        )

      consultationsRef.current =
        nextConsultations

      setConsultations(nextConsultations)

      return updatedConsultation
    },
    [setConsultations]
  )

  const markConsultationNoShow =
    useCallback(
      (
        consultationId: string
      ): ConsultationEncounter => {
        const existingConsultation =
          consultationsRef.current.find(
            (consultation) =>
              consultation.id === consultationId
          )

        if (!existingConsultation) {
          throw new Error(
            "The consultation record was not found."
          )
        }

        if (
          existingConsultation.status !==
          "waiting"
        ) {
          throw new Error(
            "Only waiting consultations can be marked as no-show."
          )
        }

        const now = new Date().toISOString()

        const updatedConsultation:
          ConsultationEncounter = {
          ...existingConsultation,
          status: "no-show",
          updatedAt: now,
        }

        const nextConsultations =
          consultationsRef.current.map(
            (consultation) =>
              consultation.id ===
              consultationId
                ? updatedConsultation
                : consultation
          )

        consultationsRef.current =
          nextConsultations

        setConsultations(nextConsultations)

        return updatedConsultation
      },
      [setConsultations]
    )

  const contextValue =
    useMemo<ConsultationContextValue>(
      () => ({
        consultations,
        queueAppointmentConsultation,
        startConsultation,
        completeConsultation,
        cancelConsultation,
        markConsultationNoShow,
      }),
      [
        consultations,
        queueAppointmentConsultation,
        startConsultation,
        completeConsultation,
        cancelConsultation,
        markConsultationNoShow,
      ]
    )

  return (
    <ConsultationContext.Provider
      value={contextValue}
    >
      {children}
    </ConsultationContext.Provider>
  )
}

export function useConsultations(): ConsultationContextValue {
  const context = useContext(
    ConsultationContext
  )

  if (!context) {
    throw new Error(
      "useConsultations must be used inside ConsultationProvider."
    )
  }

  return context
}
