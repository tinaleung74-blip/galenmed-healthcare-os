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
  ALLERGY_MOCK_CLINICAL_ACTOR,
} from "@/features/patients/constants/patient-allergy.constants"
import { MOCK_PATIENT_ALLERGY_RECORDS } from "@/features/patients/data/patient-allergy.mock-data"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { PatientAllergyFormValues } from "@/features/patients/schemas/patient-allergy.schema"
import type { PatientAllergyRecord } from "@/features/patients/types/patient-allergy.types"

interface PatientAllergyContextValue {
  allergyRecords: PatientAllergyRecord[]
  createAllergyRecord: (
    patientId: string,
    values: PatientAllergyFormValues
  ) => PatientAllergyRecord
  updateAllergyRecord: (
    recordId: string,
    values: PatientAllergyFormValues
  ) => PatientAllergyRecord
  archiveAllergyRecord: (
    recordId: string,
    archiveReason: string
  ) => PatientAllergyRecord
}

const PatientAllergyContext =
  createContext<PatientAllergyContextValue | null>(
    null
  )

interface PatientAllergyProviderProps {
  children: ReactNode
}

type AllergyClinicalFields = Pick<
  PatientAllergyRecord,
  | "allergenName"
  | "allergenCode"
  | "codeSystem"
  | "type"
  | "category"
  | "clinicalStatus"
  | "verificationStatus"
  | "criticality"
  | "onsetDate"
  | "lastOccurrenceDate"
  | "reactionManifestations"
  | "reactionSeverity"
  | "exposureRoute"
  | "source"
  | "sourceDetails"
  | "notes"
>

function createTemporaryAllergyId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `allergy-${globalThis.crypto.randomUUID()}`
  }

  return `allergy-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function parseReactionManifestations(
  value: string
): string[] {
  return value
    .split(/[,;\n]+/)
    .map((manifestation) => manifestation.trim())
    .filter(
      (manifestation) =>
        manifestation.length > 0
    )
}

function normalizeAllergyValues(
  values: PatientAllergyFormValues
): AllergyClinicalFields {
  return {
    allergenName: values.allergenName.trim(),
    allergenCode:
      values.allergenCode.trim() || null,
    codeSystem:
      values.codeSystem.trim() || null,
    type: values.type,
    category: values.category,
    clinicalStatus: values.clinicalStatus,
    verificationStatus:
      values.verificationStatus,
    criticality: values.criticality,
    onsetDate: values.onsetDate || null,
    lastOccurrenceDate:
      values.lastOccurrenceDate || null,
    reactionManifestations:
      parseReactionManifestations(
        values.reactionManifestations
      ),
    reactionSeverity:
      values.reactionSeverity || null,
    exposureRoute:
      values.exposureRoute.trim() || null,
    source: values.source,
    sourceDetails:
      values.sourceDetails.trim() || null,
    notes: values.notes.trim() || null,
  }
}

export function PatientAllergyProvider({
  children,
}: PatientAllergyProviderProps) {
  const { patients } = usePatients()

  const [allergyRecords, setAllergyRecords] =
    useState<PatientAllergyRecord[]>(
      () => [...MOCK_PATIENT_ALLERGY_RECORDS]
    )

  const recordsRef =
    useRef<PatientAllergyRecord[]>(
      allergyRecords
    )

  const createAllergyRecord = useCallback(
    (
      patientId: string,
      values: PatientAllergyFormValues
    ): PatientAllergyRecord => {
      const patientExists = patients.some(
        (patient) => patient.id === patientId
      )

      if (!patientExists) {
        throw new Error(
          "The patient record was not found."
        )
      }

      const now = new Date().toISOString()

      const newRecord: PatientAllergyRecord = {
        id: createTemporaryAllergyId(),
        patientId,
        ...normalizeAllergyValues(values),
        recordStatus: "current",
        recordedBy: ALLERGY_MOCK_CLINICAL_ACTOR,
        recordedAt: now,
        updatedBy: ALLERGY_MOCK_CLINICAL_ACTOR,
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
      setAllergyRecords(nextRecords)

      return newRecord
    },
    [patients]
  )

  const updateAllergyRecord = useCallback(
    (
      recordId: string,
      values: PatientAllergyFormValues
    ): PatientAllergyRecord => {
      const existingRecord =
        recordsRef.current.find(
          (record) => record.id === recordId
        )

      if (!existingRecord) {
        throw new Error(
          "The allergy record was not found."
        )
      }

      if (
        existingRecord.recordStatus ===
        "archived"
      ) {
        throw new Error(
          "Archived allergy records cannot be edited."
        )
      }

      const updatedRecord: PatientAllergyRecord = {
        ...existingRecord,
        ...normalizeAllergyValues(values),
        updatedBy: ALLERGY_MOCK_CLINICAL_ACTOR,
        updatedAt: new Date().toISOString(),
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? updatedRecord
            : record
      )

      recordsRef.current = nextRecords
      setAllergyRecords(nextRecords)

      return updatedRecord
    },
    []
  )

  const archiveAllergyRecord = useCallback(
    (
      recordId: string,
      archiveReason: string
    ): PatientAllergyRecord => {
      const normalizedReason =
        archiveReason.trim()

      if (normalizedReason.length < 5) {
        throw new Error(
          "An archive reason of at least five characters is required."
        )
      }

      const existingRecord =
        recordsRef.current.find(
          (record) => record.id === recordId
        )

      if (!existingRecord) {
        throw new Error(
          "The allergy record was not found."
        )
      }

      if (
        existingRecord.recordStatus ===
        "archived"
      ) {
        return existingRecord
      }

      const now = new Date().toISOString()

      const archivedRecord: PatientAllergyRecord = {
        ...existingRecord,
        recordStatus: "archived",
        updatedBy: ALLERGY_MOCK_CLINICAL_ACTOR,
        updatedAt: now,
        archivedAt: now,
        archivedBy: ALLERGY_MOCK_CLINICAL_ACTOR,
        archiveReason: normalizedReason,
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? archivedRecord
            : record
      )

      recordsRef.current = nextRecords
      setAllergyRecords(nextRecords)

      return archivedRecord
    },
    []
  )

  const contextValue =
    useMemo<PatientAllergyContextValue>(
      () => ({
        allergyRecords,
        createAllergyRecord,
        updateAllergyRecord,
        archiveAllergyRecord,
      }),
      [
        allergyRecords,
        createAllergyRecord,
        updateAllergyRecord,
        archiveAllergyRecord,
      ]
    )

  return (
    <PatientAllergyContext.Provider
      value={contextValue}
    >
      {children}
    </PatientAllergyContext.Provider>
  )
}

export function usePatientAllergies(): PatientAllergyContextValue {
  const context = useContext(
    PatientAllergyContext
  )

  if (!context) {
    throw new Error(
      "usePatientAllergies must be used inside PatientAllergyProvider."
    )
  }

  return context
}
