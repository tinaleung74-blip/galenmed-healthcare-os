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
  CONSULTATION_DIAGNOSIS_CODE_SYSTEM,
} from "@/features/consultations/constants/consultation-diagnosis.constants"
import { MOCK_CONSULTATION_DIAGNOSES } from "@/features/consultations/data/consultation-diagnosis.mock-data"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import type { ConsultationDiagnosisFormValues } from "@/features/consultations/schemas/consultation-diagnosis.schema"
import type { ConsultationDiagnosisRecord } from "@/features/consultations/types/consultation-diagnosis.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"

interface ConsultationDiagnosisContextValue {
  diagnosisRecords:
    ConsultationDiagnosisRecord[]

  createDiagnosisRecord: (
    consultationId: string,
    values:
      ConsultationDiagnosisFormValues
  ) => ConsultationDiagnosisRecord

  updateDiagnosisRecord: (
    recordId: string,
    values:
      ConsultationDiagnosisFormValues
  ) => ConsultationDiagnosisRecord

  archiveDiagnosisRecord: (
    recordId: string,
    archiveReason: string
  ) => ConsultationDiagnosisRecord
}

const ConsultationDiagnosisContext =
  createContext<ConsultationDiagnosisContextValue | null>(
    null
  )

interface ConsultationDiagnosisProviderProps {
  children: ReactNode
}

function createTemporaryDiagnosisId(): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `consultation-diagnosis-${globalThis.crypto.randomUUID()}`
  }

  return `consultation-diagnosis-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function getEditableConsultation(
  consultations:
    readonly ConsultationEncounter[],
  consultationId: string
): ConsultationEncounter {
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
    consultation.status !== "in-progress"
  ) {
    throw new Error(
      "Diagnoses can only be changed during an in-progress consultation."
    )
  }

  return consultation
}

function ensurePrimaryDiagnosisIsUnique(
  records:
    readonly ConsultationDiagnosisRecord[],
  consultationId: string,
  role:
    ConsultationDiagnosisFormValues["role"],
  excludedRecordId?: string
) {
  if (role !== "primary") {
    return
  }

  const existingPrimary = records.find(
    (record) =>
      record.consultationId ===
        consultationId &&
      record.recordStatus === "current" &&
      record.role === "primary" &&
      record.id !== excludedRecordId
  )

  if (existingPrimary) {
    throw new Error(
      "This consultation already has a current primary diagnosis."
    )
  }
}

function normalizeDiagnosisValues(
  values:
    ConsultationDiagnosisFormValues
) {
  return {
    diagnosisName:
      values.diagnosisName.trim(),

    icd10Code:
      values.icd10Code
        .trim()
        .toUpperCase() || null,

    codeSystem:
      CONSULTATION_DIAGNOSIS_CODE_SYSTEM,

    role: values.role,

    verificationStatus:
      values.verificationStatus,

    onsetDate:
      values.onsetDate || null,

    clinicalNotes:
      values.clinicalNotes.trim() ||
      null,
  }
}

export function ConsultationDiagnosisProvider({
  children,
}: ConsultationDiagnosisProviderProps) {
  const { consultations } =
    useConsultations()

  const [
    diagnosisRecords,
    setDiagnosisRecords,
  ] = useState<
    ConsultationDiagnosisRecord[]
  >(
    () => [
      ...MOCK_CONSULTATION_DIAGNOSES,
    ]
  )

  const recordsRef =
    useRef<
      ConsultationDiagnosisRecord[]
    >(diagnosisRecords)

  const createDiagnosisRecord =
    useCallback(
      (
        consultationId: string,
        values:
          ConsultationDiagnosisFormValues
      ): ConsultationDiagnosisRecord => {
        const consultation =
          getEditableConsultation(
            consultations,
            consultationId
          )

        ensurePrimaryDiagnosisIsUnique(
          recordsRef.current,
          consultationId,
          values.role
        )

        const now =
          new Date().toISOString()

        const newRecord:
          ConsultationDiagnosisRecord = {
          id: createTemporaryDiagnosisId(),
          consultationId:
            consultation.id,
          patientId:
            consultation.patientId,

          ...normalizeDiagnosisValues(
            values
          ),

          recordStatus: "current",

          recordedBy:
            consultation.doctorName,

          recordedAt: now,

          updatedBy:
            consultation.doctorName,

          updatedAt: now,

          archivedAt: null,
          archivedBy: null,
          archiveReason: null,
        }

        const nextRecords = [
          newRecord,
          ...recordsRef.current,
        ]

        recordsRef.current = nextRecords
        setDiagnosisRecords(nextRecords)

        return newRecord
      },
      [consultations]
    )

  const updateDiagnosisRecord =
    useCallback(
      (
        recordId: string,
        values:
          ConsultationDiagnosisFormValues
      ): ConsultationDiagnosisRecord => {
        const existingRecord =
          recordsRef.current.find(
            (record) =>
              record.id === recordId
          )

        if (!existingRecord) {
          throw new Error(
            "The diagnosis record was not found."
          )
        }

        if (
          existingRecord.recordStatus ===
          "archived"
        ) {
          throw new Error(
            "Archived diagnosis records cannot be edited."
          )
        }

        const consultation =
          getEditableConsultation(
            consultations,
            existingRecord.consultationId
          )

        ensurePrimaryDiagnosisIsUnique(
          recordsRef.current,
          consultation.id,
          values.role,
          existingRecord.id
        )

        const updatedRecord:
          ConsultationDiagnosisRecord = {
          ...existingRecord,

          ...normalizeDiagnosisValues(
            values
          ),

          updatedBy:
            consultation.doctorName,

          updatedAt:
            new Date().toISOString(),
        }

        const nextRecords =
          recordsRef.current.map(
            (record) =>
              record.id === recordId
                ? updatedRecord
                : record
          )

        recordsRef.current = nextRecords
        setDiagnosisRecords(nextRecords)

        return updatedRecord
      },
      [consultations]
    )

  const archiveDiagnosisRecord =
    useCallback(
      (
        recordId: string,
        archiveReason: string
      ): ConsultationDiagnosisRecord => {
        const normalizedReason =
          archiveReason.trim()

        if (
          normalizedReason.length < 5
        ) {
          throw new Error(
            "An archive reason of at least five characters is required."
          )
        }

        const existingRecord =
          recordsRef.current.find(
            (record) =>
              record.id === recordId
          )

        if (!existingRecord) {
          throw new Error(
            "The diagnosis record was not found."
          )
        }

        if (
          existingRecord.recordStatus ===
          "archived"
        ) {
          return existingRecord
        }

        const consultation =
          getEditableConsultation(
            consultations,
            existingRecord.consultationId
          )

        const now =
          new Date().toISOString()

        const archivedRecord:
          ConsultationDiagnosisRecord = {
          ...existingRecord,

          recordStatus: "archived",

          updatedBy:
            consultation.doctorName,

          updatedAt: now,

          archivedAt: now,

          archivedBy:
            consultation.doctorName,

          archiveReason:
            normalizedReason,
        }

        const nextRecords =
          recordsRef.current.map(
            (record) =>
              record.id === recordId
                ? archivedRecord
                : record
          )

        recordsRef.current = nextRecords
        setDiagnosisRecords(nextRecords)

        return archivedRecord
      },
      [consultations]
    )

  const contextValue =
    useMemo<ConsultationDiagnosisContextValue>(
      () => ({
        diagnosisRecords,
        createDiagnosisRecord,
        updateDiagnosisRecord,
        archiveDiagnosisRecord,
      }),
      [
        diagnosisRecords,
        createDiagnosisRecord,
        updateDiagnosisRecord,
        archiveDiagnosisRecord,
      ]
    )

  return (
    <ConsultationDiagnosisContext.Provider
      value={contextValue}
    >
      {children}
    </ConsultationDiagnosisContext.Provider>
  )
}

export function useConsultationDiagnoses(): ConsultationDiagnosisContextValue {
  const context = useContext(
    ConsultationDiagnosisContext
  )

  if (!context) {
    throw new Error(
      "useConsultationDiagnoses must be used inside ConsultationDiagnosisProvider."
    )
  }

  return context
}
