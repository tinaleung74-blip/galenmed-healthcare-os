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
  INSURANCE_MOCK_CLINICAL_ACTOR,
} from "@/features/patients/constants/patient-insurance.constants"
import { MOCK_PATIENT_INSURANCE_RECORDS } from "@/features/patients/data/patient-insurance.mock-data"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { PatientInsuranceFormValues } from "@/features/patients/schemas/patient-insurance.schema"
import type { PatientInsuranceRecord } from "@/features/patients/types/patient-insurance.types"

interface PatientInsuranceContextValue {
  insuranceRecords: PatientInsuranceRecord[]
  createInsuranceRecord: (
    patientId: string,
    values: PatientInsuranceFormValues
  ) => PatientInsuranceRecord
  updateInsuranceRecord: (
    recordId: string,
    values: PatientInsuranceFormValues
  ) => PatientInsuranceRecord
  archiveInsuranceRecord: (
    recordId: string,
    archiveReason: string
  ) => PatientInsuranceRecord
}

const PatientInsuranceContext =
  createContext<PatientInsuranceContextValue | null>(
    null
  )

interface PatientInsuranceProviderProps {
  children: ReactNode
}

type InsuranceCoverageFields = Pick<
  PatientInsuranceRecord,
  | "payerName"
  | "planName"
  | "coverageType"
  | "coverageStatus"
  | "verificationStatus"
  | "priority"
  | "memberNumber"
  | "policyNumber"
  | "groupNumber"
  | "subscriberName"
  | "subscriberRelationship"
  | "subscriberDateOfBirth"
  | "effectiveFrom"
  | "effectiveTo"
  | "employerName"
  | "payerContactNumber"
  | "authorizationRequired"
  | "coveredServices"
  | "source"
  | "sourceDetails"
  | "verificationReference"
  | "notes"
>

function createTemporaryInsuranceId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `insurance-${globalThis.crypto.randomUUID()}`
  }

  return `insurance-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function parseCoveredServices(
  value: string
): string[] {
  return value
    .split(/[,;\n]+/)
    .map((service) => service.trim())
    .filter((service) => service.length > 0)
}

function normalizeInsuranceValues(
  values: PatientInsuranceFormValues
): InsuranceCoverageFields {
  return {
    payerName: values.payerName.trim(),
    planName: values.planName.trim(),
    coverageType: values.coverageType,
    coverageStatus: values.coverageStatus,
    verificationStatus:
      values.verificationStatus,
    priority: values.priority,
    memberNumber: values.memberNumber.trim(),
    policyNumber:
      values.policyNumber.trim() || null,
    groupNumber:
      values.groupNumber.trim() || null,
    subscriberName:
      values.subscriberName.trim(),
    subscriberRelationship:
      values.subscriberRelationship,
    subscriberDateOfBirth:
      values.subscriberDateOfBirth || null,
    effectiveFrom: values.effectiveFrom,
    effectiveTo: values.effectiveTo || null,
    employerName:
      values.employerName.trim() || null,
    payerContactNumber:
      values.payerContactNumber.trim() || null,
    authorizationRequired:
      values.authorizationRequired,
    coveredServices: parseCoveredServices(
      values.coveredServices
    ),
    source: values.source,
    sourceDetails:
      values.sourceDetails.trim() || null,
    verificationReference:
      values.verificationReference.trim() || null,
    notes: values.notes.trim() || null,
  }
}

export function PatientInsuranceProvider({
  children,
}: PatientInsuranceProviderProps) {
  const { patients } = usePatients()

  const [
    insuranceRecords,
    setInsuranceRecords,
  ] = useState<PatientInsuranceRecord[]>(
    () => [...MOCK_PATIENT_INSURANCE_RECORDS]
  )

  const recordsRef =
    useRef<PatientInsuranceRecord[]>(
      insuranceRecords
    )

  const createInsuranceRecord = useCallback(
    (
      patientId: string,
      values: PatientInsuranceFormValues
    ): PatientInsuranceRecord => {
      const patientExists = patients.some(
        (patient) => patient.id === patientId
      )

      if (!patientExists) {
        throw new Error(
          "The patient record was not found."
        )
      }

      const now = new Date().toISOString()

      const normalizedValues =
        normalizeInsuranceValues(values)

      const isVerified =
        normalizedValues.verificationStatus ===
        "verified"

      const newRecord: PatientInsuranceRecord = {
        id: createTemporaryInsuranceId(),
        patientId,
        ...normalizedValues,
        verifiedBy: isVerified
          ? INSURANCE_MOCK_CLINICAL_ACTOR
          : null,
        verifiedAt: isVerified ? now : null,
        recordStatus: "current",
        recordedBy:
          INSURANCE_MOCK_CLINICAL_ACTOR,
        recordedAt: now,
        updatedBy:
          INSURANCE_MOCK_CLINICAL_ACTOR,
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
      setInsuranceRecords(nextRecords)

      return newRecord
    },
    [patients]
  )

  const updateInsuranceRecord = useCallback(
    (
      recordId: string,
      values: PatientInsuranceFormValues
    ): PatientInsuranceRecord => {
      const existingRecord =
        recordsRef.current.find(
          (record) => record.id === recordId
        )

      if (!existingRecord) {
        throw new Error(
          "The insurance record was not found."
        )
      }

      if (
        existingRecord.recordStatus ===
        "archived"
      ) {
        throw new Error(
          "Archived insurance records cannot be edited."
        )
      }

      const normalizedValues =
        normalizeInsuranceValues(values)

      const isVerified =
        normalizedValues.verificationStatus ===
        "verified"

      const wasVerified =
        existingRecord.verificationStatus ===
        "verified"

      const now = new Date().toISOString()

      const updatedRecord: PatientInsuranceRecord = {
        ...existingRecord,
        ...normalizedValues,
        verifiedBy: isVerified
          ? existingRecord.verifiedBy ??
            INSURANCE_MOCK_CLINICAL_ACTOR
          : null,
        verifiedAt: isVerified
          ? wasVerified
            ? existingRecord.verifiedAt ?? now
            : now
          : null,
        updatedBy:
          INSURANCE_MOCK_CLINICAL_ACTOR,
        updatedAt: now,
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? updatedRecord
            : record
      )

      recordsRef.current = nextRecords
      setInsuranceRecords(nextRecords)

      return updatedRecord
    },
    []
  )

  const archiveInsuranceRecord = useCallback(
    (
      recordId: string,
      archiveReason: string
    ): PatientInsuranceRecord => {
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
          "The insurance record was not found."
        )
      }

      if (
        existingRecord.recordStatus ===
        "archived"
      ) {
        return existingRecord
      }

      const now = new Date().toISOString()

      const archivedRecord: PatientInsuranceRecord = {
        ...existingRecord,
        recordStatus: "archived",
        updatedBy:
          INSURANCE_MOCK_CLINICAL_ACTOR,
        updatedAt: now,
        archivedAt: now,
        archivedBy:
          INSURANCE_MOCK_CLINICAL_ACTOR,
        archiveReason: normalizedReason,
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? archivedRecord
            : record
      )

      recordsRef.current = nextRecords
      setInsuranceRecords(nextRecords)

      return archivedRecord
    },
    []
  )

  const contextValue =
    useMemo<PatientInsuranceContextValue>(
      () => ({
        insuranceRecords,
        createInsuranceRecord,
        updateInsuranceRecord,
        archiveInsuranceRecord,
      }),
      [
        insuranceRecords,
        createInsuranceRecord,
        updateInsuranceRecord,
        archiveInsuranceRecord,
      ]
    )

  return (
    <PatientInsuranceContext.Provider
      value={contextValue}
    >
      {children}
    </PatientInsuranceContext.Provider>
  )
}

export function usePatientInsurance(): PatientInsuranceContextValue {
  const context = useContext(
    PatientInsuranceContext
  )

  if (!context) {
    throw new Error(
      "usePatientInsurance must be used inside PatientInsuranceProvider."
    )
  }

  return context
}
