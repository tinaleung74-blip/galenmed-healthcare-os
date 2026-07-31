"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { MOCK_CONSULTATIONS } from "@/features/consultations/data/consultation.mock-data"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"

interface ConsultationContextValue {
  consultations: ConsultationEncounter[]

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

export function ConsultationProvider({
  children,
}: ConsultationProviderProps) {
  const [consultations, setConsultations] =
    useState<ConsultationEncounter[]>(
      () => [...MOCK_CONSULTATIONS]
    )

  const consultationsRef =
    useRef<ConsultationEncounter[]>(
      consultations
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
    []
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
    []
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
    []
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
      []
    )

  const contextValue =
    useMemo<ConsultationContextValue>(
      () => ({
        consultations,
        startConsultation,
        completeConsultation,
        cancelConsultation,
        markConsultationNoShow,
      }),
      [
        consultations,
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
