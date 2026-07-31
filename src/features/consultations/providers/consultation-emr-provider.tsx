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

import {
  MOCK_CONSULTATION_SOAP_NOTES,
  MOCK_CONSULTATION_SOAP_REVISIONS,
} from "@/features/consultations/data/consultation-emr.mock-data"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import type { ConsultationSoapNoteFormValues } from "@/features/consultations/schemas/consultation-soap-note.schema"
import type {
  ConsultationSoapNote,
  ConsultationSoapNoteRevision,
} from "@/features/consultations/types/consultation-emr.types"

interface ConsultationEmrContextValue {
  soapNotes: ConsultationSoapNote[]
  soapNoteRevisions:
    ConsultationSoapNoteRevision[]

  saveSoapDraft: (
    consultationId: string,
    values: ConsultationSoapNoteFormValues
  ) => ConsultationSoapNote

  finalizeSoapNote: (
    consultationId: string,
    finalizedAt?: string
  ) => ConsultationSoapNote
}

const ConsultationEmrContext =
  createContext<ConsultationEmrContextValue | null>(
    null
  )

interface ConsultationEmrProviderProps {
  children: ReactNode
}

function createTemporarySoapNoteId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `soap-note-${globalThis.crypto.randomUUID()}`
  }

  return `soap-note-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function createTemporarySoapRevisionId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `soap-revision-${globalThis.crypto.randomUUID()}`
  }

  return `soap-revision-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function normalizeSoapValues(
  values: ConsultationSoapNoteFormValues
) {
  return {
    subjective: values.subjective.trim(),
    objective: values.objective.trim(),
    assessment: values.assessment.trim(),
    plan: values.plan.trim(),
  }
}

export function ConsultationEmrProvider({
  children,
}: ConsultationEmrProviderProps) {
  const { consultations } = useConsultations()

  const [soapNotes, setSoapNotes] =
    useState<ConsultationSoapNote[]>(
      () => [...MOCK_CONSULTATION_SOAP_NOTES]
    )

  const [
    soapNoteRevisions,
    setSoapNoteRevisions,
  ] = useState<
    ConsultationSoapNoteRevision[]
  >(
    () => [
      ...MOCK_CONSULTATION_SOAP_REVISIONS,
    ]
  )

  const notesRef =
    useRef<ConsultationSoapNote[]>(
      soapNotes
    )

  const revisionsRef =
    useRef<ConsultationSoapNoteRevision[]>(
      soapNoteRevisions
    )

  const saveSoapDraft = useCallback(
    (
      consultationId: string,
      values: ConsultationSoapNoteFormValues
    ): ConsultationSoapNote => {
      const consultation =
        consultations.find(
          (candidateConsultation) =>
            candidateConsultation.id ===
            consultationId
        )

      if (!consultation) {
        throw new Error(
          "The consultation record was not found."
        )
      }

      if (
        consultation.status !==
        "in-progress"
      ) {
        throw new Error(
          "SOAP drafts can only be saved for an in-progress consultation."
        )
      }

      const existingNote =
        notesRef.current.find(
          (note) =>
            note.consultationId ===
            consultationId
        ) ?? null

      if (
        existingNote?.status ===
        "finalized"
      ) {
        throw new Error(
          "A finalized SOAP note cannot be edited through the draft workflow."
        )
      }

      const now = new Date().toISOString()
      const normalizedValues =
        normalizeSoapValues(values)

      const nextVersion =
        existingNote
          ? existingNote.version + 1
          : 1

      const savedNote: ConsultationSoapNote =
        existingNote
          ? {
              ...existingNote,
              ...normalizedValues,
              version: nextVersion,
              updatedBy:
                consultation.doctorName,
              updatedAt: now,
            }
          : {
              id: createTemporarySoapNoteId(),
              consultationId:
                consultation.id,
              patientId:
                consultation.patientId,
              ...normalizedValues,
              status: "draft",
              version: nextVersion,
              createdBy:
                consultation.doctorName,
              createdAt: now,
              updatedBy:
                consultation.doctorName,
              updatedAt: now,
              finalizedBy: null,
              finalizedAt: null,
            }

      const nextNotes = existingNote
        ? notesRef.current.map((note) =>
            note.id === existingNote.id
              ? savedNote
              : note
          )
        : [
            savedNote,
            ...notesRef.current,
          ]

      const revision:
        ConsultationSoapNoteRevision = {
        id: createTemporarySoapRevisionId(),
        soapNoteId: savedNote.id,
        consultationId:
          savedNote.consultationId,
        patientId: savedNote.patientId,
        version: savedNote.version,
        action: existingNote
          ? "saved"
          : "created",
        subjective:
          savedNote.subjective,
        objective: savedNote.objective,
        assessment:
          savedNote.assessment,
        plan: savedNote.plan,
        changedBy:
          consultation.doctorName,
        changedAt: now,
      }

      const nextRevisions = [
        revision,
        ...revisionsRef.current,
      ]

      notesRef.current = nextNotes
      revisionsRef.current =
        nextRevisions

      setSoapNotes(nextNotes)
      setSoapNoteRevisions(
        nextRevisions
      )

      return savedNote
    },
    [consultations]
  )

  const finalizeSoapNote = useCallback(
    (
      consultationId: string,
      finalizedAt = new Date().toISOString()
    ): ConsultationSoapNote => {
      const consultation =
        consultations.find(
          (candidateConsultation) =>
            candidateConsultation.id ===
            consultationId
        )

      if (!consultation) {
        throw new Error(
          "The consultation record was not found."
        )
      }

      if (
        consultation.status !==
        "in-progress"
      ) {
        throw new Error(
          "SOAP notes can only be finalized during an in-progress consultation."
        )
      }

      const existingNote =
        notesRef.current.find(
          (note) =>
            note.consultationId ===
            consultationId
        ) ?? null

      if (!existingNote) {
        throw new Error(
          "A SOAP note is required before finalizing the encounter."
        )
      }

      if (
        existingNote.status ===
        "finalized"
      ) {
        return existingNote
      }

      const soapSections = [
        existingNote.subjective,
        existingNote.objective,
        existingNote.assessment,
        existingNote.plan,
      ]

      const hasIncompleteSection =
        soapSections.some(
          (section) =>
            section.trim().length < 2
        )

      if (hasIncompleteSection) {
        throw new Error(
          "Subjective, Objective, Assessment, and Plan must all be completed before finalization."
        )
      }

      const finalizedNote:
        ConsultationSoapNote = {
        ...existingNote,
        status: "finalized",
        version: existingNote.version + 1,
        updatedBy:
          consultation.doctorName,
        updatedAt: finalizedAt,
        finalizedBy:
          consultation.doctorName,
        finalizedAt,
      }

      const nextNotes =
        notesRef.current.map((note) =>
          note.id === existingNote.id
            ? finalizedNote
            : note
        )

      const revision:
        ConsultationSoapNoteRevision = {
        id: createTemporarySoapRevisionId(),
        soapNoteId: finalizedNote.id,
        consultationId:
          finalizedNote.consultationId,
        patientId:
          finalizedNote.patientId,
        version: finalizedNote.version,
        action: "finalized",
        subjective:
          finalizedNote.subjective,
        objective:
          finalizedNote.objective,
        assessment:
          finalizedNote.assessment,
        plan: finalizedNote.plan,
        changedBy:
          consultation.doctorName,
        changedAt: finalizedAt,
      }

      const nextRevisions = [
        revision,
        ...revisionsRef.current,
      ]

      notesRef.current = nextNotes
      revisionsRef.current =
        nextRevisions

      setSoapNotes(nextNotes)
      setSoapNoteRevisions(
        nextRevisions
      )

      return finalizedNote
    },
    [consultations]
  )
  const contextValue =
    useMemo<ConsultationEmrContextValue>(
      () => ({
        soapNotes,
        soapNoteRevisions,
        saveSoapDraft,
        finalizeSoapNote,
      }),
      [
        soapNotes,
        soapNoteRevisions,
        saveSoapDraft,
        finalizeSoapNote,
      ]
    )

  return (
    <ConsultationEmrContext.Provider
      value={contextValue}
    >
      {children}
    </ConsultationEmrContext.Provider>
  )
}

export function useConsultationEmr(): ConsultationEmrContextValue {
  const context = useContext(
    ConsultationEmrContext
  )

  if (!context) {
    throw new Error(
      "useConsultationEmr must be used inside ConsultationEmrProvider."
    )
  }

  return context
}
