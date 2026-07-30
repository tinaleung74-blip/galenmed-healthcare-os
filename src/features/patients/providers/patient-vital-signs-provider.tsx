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
  VITAL_SIGNS_MOCK_CLINICAL_ACTOR,
} from "@/features/patients/constants/vital-signs.constants"
import { MOCK_VITAL_SIGNS_RECORDS } from "@/features/patients/data/vital-signs.mock-data"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { VitalSignsFormValues } from "@/features/patients/schemas/vital-signs.schema"
import type { VitalSignsRecord } from "@/features/patients/types/vital-signs.types"
import {
  buildNotEvaluatedVitalSignInterpretations,
  calculateBmi,
  parseOptionalVitalMeasurement,
} from "@/features/patients/utils/vital-signs.utils"

interface PatientVitalSignsContextValue {
  vitalSignsRecords: VitalSignsRecord[]
  createVitalSignsRecord: (
    patientId: string,
    values: VitalSignsFormValues
  ) => VitalSignsRecord
  updateVitalSignsRecord: (
    recordId: string,
    values: VitalSignsFormValues
  ) => VitalSignsRecord
  archiveVitalSignsRecord: (
    recordId: string,
    archiveReason: string
  ) => VitalSignsRecord
}

const PatientVitalSignsContext =
  createContext<PatientVitalSignsContextValue | null>(
    null
  )

interface PatientVitalSignsProviderProps {
  children: ReactNode
}

type VitalSignsClinicalFields = Pick<
  VitalSignsRecord,
  | "measuredAt"
  | "context"
  | "systolicBloodPressureMmHg"
  | "diastolicBloodPressureMmHg"
  | "bloodPressurePosition"
  | "heartRateBpm"
  | "respiratoryRatePerMinute"
  | "temperatureCelsius"
  | "temperatureSite"
  | "oxygenSaturationPercent"
  | "oxygenSupport"
  | "supplementalOxygenLitersPerMinute"
  | "heightCm"
  | "weightKg"
  | "bmi"
  | "painScore"
  | "notes"
  | "interpretations"
>

function createTemporaryVitalSignsId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `vital-signs-${globalThis.crypto.randomUUID()}`
  }

  return `vital-signs-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function normalizeVitalSignsValues(
  values: VitalSignsFormValues
): VitalSignsClinicalFields {
  const systolicBloodPressureMmHg =
    parseOptionalVitalMeasurement(
      values.systolicBloodPressure
    )

  const diastolicBloodPressureMmHg =
    parseOptionalVitalMeasurement(
      values.diastolicBloodPressure
    )

  const heartRateBpm =
    parseOptionalVitalMeasurement(
      values.heartRate
    )

  const respiratoryRatePerMinute =
    parseOptionalVitalMeasurement(
      values.respiratoryRate
    )

  const temperatureCelsius =
    parseOptionalVitalMeasurement(
      values.temperatureCelsius
    )

  const oxygenSaturationPercent =
    parseOptionalVitalMeasurement(
      values.oxygenSaturation
    )

  const supplementalOxygenLitersPerMinute =
    parseOptionalVitalMeasurement(
      values.supplementalOxygenLitersPerMinute
    )

  const heightCm =
    parseOptionalVitalMeasurement(
      values.heightCm
    )

  const weightKg =
    parseOptionalVitalMeasurement(
      values.weightKg
    )

  const painScore =
    parseOptionalVitalMeasurement(
      values.painScore
    )

  const bmi = calculateBmi(
    heightCm,
    weightKg
  )

  const interpretationInput = {
    systolicBloodPressureMmHg,
    diastolicBloodPressureMmHg,
    heartRateBpm,
    respiratoryRatePerMinute,
    temperatureCelsius,
    oxygenSaturationPercent,
    heightCm,
    weightKg,
    bmi,
    painScore,
  }

  return {
    measuredAt: new Date(
      values.measuredAt
    ).toISOString(),
    context: values.context,
    systolicBloodPressureMmHg,
    diastolicBloodPressureMmHg,
    bloodPressurePosition:
      values.bloodPressurePosition,
    heartRateBpm,
    respiratoryRatePerMinute,
    temperatureCelsius,
    temperatureSite: values.temperatureSite,
    oxygenSaturationPercent,
    oxygenSupport: values.oxygenSupport,
    supplementalOxygenLitersPerMinute,
    heightCm,
    weightKg,
    bmi,
    painScore,
    notes: values.notes.trim() || null,
    interpretations:
      buildNotEvaluatedVitalSignInterpretations(
        interpretationInput
      ),
  }
}

export function PatientVitalSignsProvider({
  children,
}: PatientVitalSignsProviderProps) {
  const { patients } = usePatients()

  const [
    vitalSignsRecords,
    setVitalSignsRecords,
  ] = useState<VitalSignsRecord[]>(
    () => [...MOCK_VITAL_SIGNS_RECORDS]
  )

  const recordsRef = useRef<VitalSignsRecord[]>(
    vitalSignsRecords
  )

  const createVitalSignsRecord = useCallback(
    (
      patientId: string,
      values: VitalSignsFormValues
    ): VitalSignsRecord => {
      const patientExists = patients.some(
        (patient) => patient.id === patientId
      )

      if (!patientExists) {
        throw new Error(
          "The patient record was not found."
        )
      }

      const now = new Date().toISOString()

      const newRecord: VitalSignsRecord = {
        id: createTemporaryVitalSignsId(),
        patientId,
        ...normalizeVitalSignsValues(values),
        recordStatus: "current",
        recordedBy:
          VITAL_SIGNS_MOCK_CLINICAL_ACTOR,
        recordedAt: now,
        updatedBy:
          VITAL_SIGNS_MOCK_CLINICAL_ACTOR,
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
      setVitalSignsRecords(nextRecords)

      return newRecord
    },
    [patients]
  )

  const updateVitalSignsRecord = useCallback(
    (
      recordId: string,
      values: VitalSignsFormValues
    ): VitalSignsRecord => {
      const existingRecord =
        recordsRef.current.find(
          (record) => record.id === recordId
        )

      if (!existingRecord) {
        throw new Error(
          "The vital-sign record was not found."
        )
      }

      if (
        existingRecord.recordStatus ===
        "archived"
      ) {
        throw new Error(
          "Archived vital-sign records cannot be edited."
        )
      }

      const updatedRecord: VitalSignsRecord = {
        ...existingRecord,
        ...normalizeVitalSignsValues(values),
        updatedBy:
          VITAL_SIGNS_MOCK_CLINICAL_ACTOR,
        updatedAt: new Date().toISOString(),
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? updatedRecord
            : record
      )

      recordsRef.current = nextRecords
      setVitalSignsRecords(nextRecords)

      return updatedRecord
    },
    []
  )

  const archiveVitalSignsRecord = useCallback(
    (
      recordId: string,
      archiveReason: string
    ): VitalSignsRecord => {
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
          "The vital-sign record was not found."
        )
      }

      if (
        existingRecord.recordStatus ===
        "archived"
      ) {
        return existingRecord
      }

      const now = new Date().toISOString()

      const archivedRecord: VitalSignsRecord = {
        ...existingRecord,
        recordStatus: "archived",
        updatedBy:
          VITAL_SIGNS_MOCK_CLINICAL_ACTOR,
        updatedAt: now,
        archivedAt: now,
        archivedBy:
          VITAL_SIGNS_MOCK_CLINICAL_ACTOR,
        archiveReason: normalizedReason,
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? archivedRecord
            : record
      )

      recordsRef.current = nextRecords
      setVitalSignsRecords(nextRecords)

      return archivedRecord
    },
    []
  )

  const contextValue =
    useMemo<PatientVitalSignsContextValue>(
      () => ({
        vitalSignsRecords,
        createVitalSignsRecord,
        updateVitalSignsRecord,
        archiveVitalSignsRecord,
      }),
      [
        vitalSignsRecords,
        createVitalSignsRecord,
        updateVitalSignsRecord,
        archiveVitalSignsRecord,
      ]
    )

  return (
    <PatientVitalSignsContext.Provider
      value={contextValue}
    >
      {children}
    </PatientVitalSignsContext.Provider>
  )
}

export function usePatientVitalSigns(): PatientVitalSignsContextValue {
  const context = useContext(
    PatientVitalSignsContext
  )

  if (!context) {
    throw new Error(
      "usePatientVitalSigns must be used inside PatientVitalSignsProvider."
    )
  }

  return context
}
