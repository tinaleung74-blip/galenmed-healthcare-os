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
  PATIENT_DOCUMENT_MOCK_ACTOR,
} from "@/features/patients/constants/patient-document.constants"
import { MOCK_PATIENT_DOCUMENT_RECORDS } from "@/features/patients/data/patient-document.mock-data"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { PatientDocumentFormValues } from "@/features/patients/schemas/patient-document.schema"
import type { PatientDocumentRecord } from "@/features/patients/types/patient-document.types"
import {
  getDocumentFileExtension,
  parseDocumentSizeKilobytes,
} from "@/features/patients/utils/patient-document.utils"

interface PatientDocumentsContextValue {
  documentRecords: PatientDocumentRecord[]

  createDocumentRecord: (
    patientId: string,
    values: PatientDocumentFormValues
  ) => PatientDocumentRecord

  updateDocumentRecord: (
    recordId: string,
    values: PatientDocumentFormValues
  ) => PatientDocumentRecord

  archiveDocumentRecord: (
    recordId: string,
    archiveReason: string
  ) => PatientDocumentRecord
}

const PatientDocumentsContext =
  createContext<PatientDocumentsContextValue | null>(
    null
  )

interface PatientDocumentsProviderProps {
  children: ReactNode
}

type PatientDocumentFields = Pick<
  PatientDocumentRecord,
  | "title"
  | "description"
  | "category"
  | "documentStatus"
  | "verificationStatus"
  | "confidentialityLevel"
  | "issuedBy"
  | "issueDate"
  | "expirationDate"
  | "fileName"
  | "mimeType"
  | "fileSizeBytes"
  | "fileExtension"
  | "source"
  | "sourceDetails"
  | "relatedEncounterReference"
  | "verificationReference"
  | "notes"
>

function createTemporaryDocumentId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `patient-document-${globalThis.crypto.randomUUID()}`
  }

  return `patient-document-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function normalizeDocumentValues(
  values: PatientDocumentFormValues
): PatientDocumentFields {
  const fileName = values.fileName.trim()

  return {
    title: values.title.trim(),
    description:
      values.description.trim() || null,
    category: values.category,
    documentStatus: values.documentStatus,
    verificationStatus:
      values.verificationStatus,
    confidentialityLevel:
      values.confidentialityLevel,
    issuedBy: values.issuedBy.trim() || null,
    issueDate: values.issueDate || null,
    expirationDate:
      values.expirationDate || null,
    fileName,
    mimeType: values.mimeType
      .trim()
      .toLowerCase(),
    fileSizeBytes:
      parseDocumentSizeKilobytes(
        values.fileSizeKilobytes
      ),
    fileExtension:
      getDocumentFileExtension(fileName),
    source: values.source,
    sourceDetails:
      values.sourceDetails.trim() || null,
    relatedEncounterReference:
      values.relatedEncounterReference.trim() ||
      null,
    verificationReference:
      values.verificationReference.trim() ||
      null,
    notes: values.notes.trim() || null,
  }
}

export function PatientDocumentsProvider({
  children,
}: PatientDocumentsProviderProps) {
  const { patients } = usePatients()

  const [
    documentRecords,
    setDocumentRecords,
  ] = useState<PatientDocumentRecord[]>(
    () => [...MOCK_PATIENT_DOCUMENT_RECORDS]
  )

  const recordsRef =
    useRef<PatientDocumentRecord[]>(
      documentRecords
    )

  const createDocumentRecord = useCallback(
    (
      patientId: string,
      values: PatientDocumentFormValues
    ): PatientDocumentRecord => {
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
        normalizeDocumentValues(values)

      const isVerified =
        normalizedValues.verificationStatus ===
        "verified"

      const newRecord: PatientDocumentRecord = {
        id: createTemporaryDocumentId(),
        patientId,
        ...normalizedValues,
        binaryAvailable: false,
        storageObjectKey: null,
        versionNumber: 1,
        supersedesDocumentId: null,
        verifiedBy: isVerified
          ? PATIENT_DOCUMENT_MOCK_ACTOR
          : null,
        verifiedAt: isVerified ? now : null,
        recordStatus: "current",
        uploadedBy:
          PATIENT_DOCUMENT_MOCK_ACTOR,
        uploadedAt: now,
        updatedBy:
          PATIENT_DOCUMENT_MOCK_ACTOR,
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
      setDocumentRecords(nextRecords)

      return newRecord
    },
    [patients]
  )

  const updateDocumentRecord = useCallback(
    (
      recordId: string,
      values: PatientDocumentFormValues
    ): PatientDocumentRecord => {
      const existingRecord =
        recordsRef.current.find(
          (record) => record.id === recordId
        )

      if (!existingRecord) {
        throw new Error(
          "The patient-document record was not found."
        )
      }

      if (
        existingRecord.recordStatus ===
        "archived"
      ) {
        throw new Error(
          "Archived patient-document records cannot be edited."
        )
      }

      const normalizedValues =
        normalizeDocumentValues(values)

      const isVerified =
        normalizedValues.verificationStatus ===
        "verified"

      const wasVerified =
        existingRecord.verificationStatus ===
        "verified"

      const now = new Date().toISOString()

      const updatedRecord: PatientDocumentRecord = {
        ...existingRecord,
        ...normalizedValues,
        verifiedBy: isVerified
          ? existingRecord.verifiedBy ??
            PATIENT_DOCUMENT_MOCK_ACTOR
          : null,
        verifiedAt: isVerified
          ? wasVerified
            ? existingRecord.verifiedAt ?? now
            : now
          : null,
        updatedBy:
          PATIENT_DOCUMENT_MOCK_ACTOR,
        updatedAt: now,
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? updatedRecord
            : record
      )

      recordsRef.current = nextRecords
      setDocumentRecords(nextRecords)

      return updatedRecord
    },
    []
  )

  const archiveDocumentRecord = useCallback(
    (
      recordId: string,
      archiveReason: string
    ): PatientDocumentRecord => {
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
          "The patient-document record was not found."
        )
      }

      if (
        existingRecord.recordStatus ===
        "archived"
      ) {
        return existingRecord
      }

      const now = new Date().toISOString()

      const archivedRecord: PatientDocumentRecord = {
        ...existingRecord,
        recordStatus: "archived",
        updatedBy:
          PATIENT_DOCUMENT_MOCK_ACTOR,
        updatedAt: now,
        archivedAt: now,
        archivedBy:
          PATIENT_DOCUMENT_MOCK_ACTOR,
        archiveReason: normalizedReason,
      }

      const nextRecords = recordsRef.current.map(
        (record) =>
          record.id === recordId
            ? archivedRecord
            : record
      )

      recordsRef.current = nextRecords
      setDocumentRecords(nextRecords)

      return archivedRecord
    },
    []
  )

  const contextValue =
    useMemo<PatientDocumentsContextValue>(
      () => ({
        documentRecords,
        createDocumentRecord,
        updateDocumentRecord,
        archiveDocumentRecord,
      }),
      [
        documentRecords,
        createDocumentRecord,
        updateDocumentRecord,
        archiveDocumentRecord,
      ]
    )

  return (
    <PatientDocumentsContext.Provider
      value={contextValue}
    >
      {children}
    </PatientDocumentsContext.Provider>
  )
}

export function usePatientDocuments(): PatientDocumentsContextValue {
  const context = useContext(
    PatientDocumentsContext
  )

  if (!context) {
    throw new Error(
      "usePatientDocuments must be used inside PatientDocumentsProvider."
    )
  }

  return context
}
