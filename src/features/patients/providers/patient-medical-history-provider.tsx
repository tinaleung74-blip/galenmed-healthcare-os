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
  MOCK_CLINICAL_ACTOR,
} from "@/features/patients/constants/medical-history.constants"
import { MOCK_MEDICAL_HISTORY_RECORDS } from "@/features/patients/data/medical-history.mock-data"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { MedicalHistoryFormValues } from "@/features/patients/schemas/medical-history.schema"
import type { MedicalHistoryRecord } from "@/features/patients/types/medical-history.types"

interface PatientMedicalHistoryContextValue {
  medicalHistoryRecords: MedicalHistoryRecord[]
  createMedicalHistoryRecord: (
    patientId: string,
    values: MedicalHistoryFormValues
  ) => MedicalHistoryRecord
  updateMedicalHistoryRecord: (
    recordId: string,
    values: MedicalHistoryFormValues
  ) => MedicalHistoryRecord
  archiveMedicalHistoryRecord: (
    recordId: string,
    archiveReason: string
  ) => MedicalHistoryRecord
}

const PatientMedicalHistoryContext =
  createContext<PatientMedicalHistoryContextValue | null>(
    null
  )

interface PatientMedicalHistoryProviderProps {
  children: ReactNode
}

function createTemporaryMedicalHistoryId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `medical-history-${globalThis.crypto.randomUUID()}`
  }

  return `medical-history-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function normalizeMedicalHistoryValues(
  values: MedicalHistoryFormValues
) {
  return {
    conditionName: values.conditionName.trim(),
    icd10Code:
      values.icd10Code.trim().toUpperCase() || null,
    clinicalStatus: values.clinicalStatus,
    verificationStatus: values.verificationStatus,
    onsetDate: values.onsetDate || null,
    resolutionDate: values.resolutionDate || null,
    notes: values.notes.trim() || null,
    source: values.source,
    sourceDetails:
      values.sourceDetails.trim() || null,
  }
}

export function PatientMedicalHistoryProvider({
  children,
}: PatientMedicalHistoryProviderProps) {
  const { patients } = usePatients()

  const [
    medicalHistoryRecords,
    setMedicalHistoryRecords,
  ] = useState<MedicalHistoryRecord[]>(
    () => [...MOCK_MEDICAL_HISTORY_RECORDS]
  )

  const recordsRef = useRef<MedicalHistoryRecord[]>(
    medicalHistoryRecords
  )

  const createMedicalHistoryRecord = useCallback(
    (
      patientId: string,
      values: MedicalHistoryFormValues
    ): MedicalHistoryRecord => {
      const patientExists = patients.some(
        (patient) => patient.id === patientId
      )

      if (!patientExists) {
        throw new Error(
          "The patient record was not found."
        )
      }

      const now = new Date().toISOString()

      const newRecord: MedicalHistoryRecord = {
        id: createTemporaryMedicalHistoryId(),
        patientId,
        ...normalizeMedicalHistoryValues(values),
        recordStatus: "current",
        recordedBy: MOCK_CLINICAL_ACTOR,
        recordedAt: now,
        updatedBy: MOCK_CLINICAL_ACTOR,
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
      setMedicalHistoryRecords(nextRecords)

      return newRecord
    },
    [patients]
  )

  const updateMedicalHistoryRecord = useCallback(
    (
      recordId: string,
      values: MedicalHistoryFormValues
    ): MedicalHistoryRecord => {
      const existingRecord = recordsRef.current.find(
        (record) => record.id === recordId
      )

      if (!existingRecord) {
        throw new Error(
          "The medical-history record was not found."
        )
      }

      if (existingRecord.recordStatus === "archived") {
        throw new Error(
          "Archived medical-history records cannot be edited."
        )
      }

      const updatedRecord: MedicalHistoryRecord = {
        ...existingRecord,
        ...normalizeMedicalHistoryValues(values),
        updatedBy: MOCK_CLINICAL_ACTOR,
        updatedAt: new Date().toISOString(),
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? updatedRecord
            : record
      )

      recordsRef.current = nextRecords
      setMedicalHistoryRecords(nextRecords)

      return updatedRecord
    },
    []
  )

  const archiveMedicalHistoryRecord = useCallback(
    (
      recordId: string,
      archiveReason: string
    ): MedicalHistoryRecord => {
      const normalizedReason = archiveReason.trim()

      if (normalizedReason.length < 5) {
        throw new Error(
          "An archive reason of at least five characters is required."
        )
      }

      const existingRecord = recordsRef.current.find(
        (record) => record.id === recordId
      )

      if (!existingRecord) {
        throw new Error(
          "The medical-history record was not found."
        )
      }

      if (existingRecord.recordStatus === "archived") {
        return existingRecord
      }

      const now = new Date().toISOString()

      const archivedRecord: MedicalHistoryRecord = {
        ...existingRecord,
        recordStatus: "archived",
        updatedBy: MOCK_CLINICAL_ACTOR,
        updatedAt: now,
        archivedAt: now,
        archivedBy: MOCK_CLINICAL_ACTOR,
        archiveReason: normalizedReason,
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? archivedRecord
            : record
      )

      recordsRef.current = nextRecords
      setMedicalHistoryRecords(nextRecords)

      return archivedRecord
    },
    []
  )

  const contextValue =
    useMemo<PatientMedicalHistoryContextValue>(
      () => ({
        medicalHistoryRecords,
        createMedicalHistoryRecord,
        updateMedicalHistoryRecord,
        archiveMedicalHistoryRecord,
      }),
      [
        medicalHistoryRecords,
        createMedicalHistoryRecord,
        updateMedicalHistoryRecord,
        archiveMedicalHistoryRecord,
      ]
    )

  return (
    <PatientMedicalHistoryContext.Provider
      value={contextValue}
    >
      {children}
    </PatientMedicalHistoryContext.Provider>
  )
}

export function usePatientMedicalHistory(): PatientMedicalHistoryContextValue {
  const context = useContext(
    PatientMedicalHistoryContext
  )

  if (!context) {
    throw new Error(
      "usePatientMedicalHistory must be used inside PatientMedicalHistoryProvider."
    )
  }

  return context
}
