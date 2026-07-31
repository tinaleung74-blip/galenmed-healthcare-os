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

import { MOCK_CONSULTATION_PRESCRIPTIONS } from "@/features/consultations/data/consultation-prescription.mock-data"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import type { ConsultationPrescriptionFormValues } from "@/features/consultations/schemas/consultation-prescription.schema"
import type {
  ConsultationPrescriptionRecord,
  ConsultationPrescriptionStatus,
} from "@/features/consultations/types/consultation-prescription.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"

interface ConsultationPrescriptionContextValue {
  prescriptionRecords:
    ConsultationPrescriptionRecord[]

  createPrescriptionRecord: (
    consultationId: string,
    values:
      ConsultationPrescriptionFormValues
  ) => ConsultationPrescriptionRecord

  updatePrescriptionRecord: (
    recordId: string,
    values:
      ConsultationPrescriptionFormValues
  ) => ConsultationPrescriptionRecord

  archivePrescriptionRecord: (
    recordId: string,
    archiveReason: string
  ) => ConsultationPrescriptionRecord

  activateConsultationDrafts: (
    consultationId: string,
    activatedAt?: string
  ) => ConsultationPrescriptionRecord[]
}

const ConsultationPrescriptionContext =
  createContext<ConsultationPrescriptionContextValue | null>(
    null
  )

interface ConsultationPrescriptionProviderProps {
  children: ReactNode
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
      "Prescriptions can only be changed during an in-progress consultation."
    )
  }

  return consultation
}

function generatePrescriptionNumber(
  records:
    readonly ConsultationPrescriptionRecord[],
  year = new Date().getFullYear()
): string {
  const prefix = `GM-RX-${year}-`

  const highestSequence = records.reduce(
    (highest, record) => {
      if (
        !record.prescriptionNumber.startsWith(
          prefix
        )
      ) {
        return highest
      }

      const sequence = Number(
        record.prescriptionNumber.slice(
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

function normalizePrescriptionValues(
  values:
    ConsultationPrescriptionFormValues
) {
  return {
    medicationName:
      values.medicationName.trim(),

    strength:
      values.strength.trim() || null,

    doseAmount:
      Number(values.doseAmount),

    doseUnit:
      values.doseUnit,

    route:
      values.route,

    frequency:
      values.frequency,

    frequencyDetails:
      values.frequencyDetails.trim() ||
      null,

    durationValue:
      values.durationValue === ""
        ? null
        : Number(
            values.durationValue
          ),

    durationUnit:
      values.durationUnit,

    quantity:
      Number(values.quantity),

    quantityUnit:
      values.quantityUnit.trim(),

    refillsAllowed:
      values.refillsAllowed === ""
        ? 0
        : Number(
            values.refillsAllowed
          ),

    startDate:
      values.startDate,

    endDate:
      values.endDate || null,

    indication:
      values.indication.trim(),

    patientInstructions:
      values.patientInstructions.trim(),

    prescriberNotes:
      values.prescriberNotes.trim() ||
      null,

    substitutionAllowed:
      values.substitutionAllowed,

    allergyReviewStatus:
      values.allergyReviewStatus,

    allergyWarningNote:
      values.allergyWarningNote.trim() ||
      null,
  }
}

function ensureNoDuplicateDraft(
  records:
    readonly ConsultationPrescriptionRecord[],
  consultationId: string,
  medicationName: string,
  strength: string,
  excludedRecordId?: string
) {
  const normalizedMedication =
    medicationName
      .trim()
      .toLocaleLowerCase("en-PH")

  const normalizedStrength =
    strength
      .trim()
      .toLocaleLowerCase("en-PH")

  const duplicate = records.find(
    (record) =>
      record.consultationId ===
        consultationId &&
      record.recordStatus === "current" &&
      record.status === "draft" &&
      record.id !== excludedRecordId &&
      record.medicationName
        .trim()
        .toLocaleLowerCase(
          "en-PH"
        ) === normalizedMedication &&
      (record.strength ?? "")
        .trim()
        .toLocaleLowerCase(
          "en-PH"
        ) === normalizedStrength
  )

  if (duplicate) {
    throw new Error(
      "A matching draft prescription already exists for this consultation."
    )
  }
}

export function ConsultationPrescriptionProvider({
  children,
}: ConsultationPrescriptionProviderProps) {
  const { consultations } =
    useConsultations()

  const [
    prescriptionRecords,
    setPrescriptionRecords,
  ] = useState<
    ConsultationPrescriptionRecord[]
  >(
    () => [
      ...MOCK_CONSULTATION_PRESCRIPTIONS,
    ]
  )

  const recordsRef =
    useRef<
      ConsultationPrescriptionRecord[]
    >(prescriptionRecords)

  const createPrescriptionRecord =
    useCallback(
      (
        consultationId: string,
        values:
          ConsultationPrescriptionFormValues
      ): ConsultationPrescriptionRecord => {
        const consultation =
          getEditableConsultation(
            consultations,
            consultationId
          )

        ensureNoDuplicateDraft(
          recordsRef.current,
          consultationId,
          values.medicationName,
          values.strength
        )

        const now =
          new Date().toISOString()

        const status:
          ConsultationPrescriptionStatus =
          "draft"

        const newRecord:
          ConsultationPrescriptionRecord = {
          id:
            typeof globalThis.crypto !==
              "undefined" &&
            "randomUUID" in
              globalThis.crypto
              ? `consultation-prescription-${globalThis.crypto.randomUUID()}`
              : `consultation-prescription-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2)}`,

          prescriptionNumber:
            generatePrescriptionNumber(
              recordsRef.current
            ),

          consultationId:
            consultation.id,

          patientId:
            consultation.patientId,

          ...normalizePrescriptionValues(
            values
          ),

          status,
          recordStatus: "current",

          prescribedBy:
            consultation.doctorName,

          prescribedAt: now,

          updatedBy:
            consultation.doctorName,

          updatedAt: now,

          discontinuedAt: null,
          discontinuedBy: null,
          discontinuationReason: null,

          archivedAt: null,
          archivedBy: null,
          archiveReason: null,
        }

        const nextRecords = [
          newRecord,
          ...recordsRef.current,
        ]

        recordsRef.current = nextRecords
        setPrescriptionRecords(
          nextRecords
        )

        return newRecord
      },
      [consultations]
    )

  const updatePrescriptionRecord =
    useCallback(
      (
        recordId: string,
        values:
          ConsultationPrescriptionFormValues
      ): ConsultationPrescriptionRecord => {
        const existingRecord =
          recordsRef.current.find(
            (record) =>
              record.id === recordId
          )

        if (!existingRecord) {
          throw new Error(
            "The prescription record was not found."
          )
        }

        if (
          existingRecord.recordStatus ===
          "archived"
        ) {
          throw new Error(
            "Archived prescriptions cannot be edited."
          )
        }

        if (
          existingRecord.status !== "draft"
        ) {
          throw new Error(
            "Only draft prescriptions can be edited."
          )
        }

        const consultation =
          getEditableConsultation(
            consultations,
            existingRecord.consultationId
          )

        ensureNoDuplicateDraft(
          recordsRef.current,
          consultation.id,
          values.medicationName,
          values.strength,
          existingRecord.id
        )

        const updatedRecord:
          ConsultationPrescriptionRecord = {
          ...existingRecord,

          ...normalizePrescriptionValues(
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
        setPrescriptionRecords(
          nextRecords
        )

        return updatedRecord
      },
      [consultations]
    )

  const archivePrescriptionRecord =
    useCallback(
      (
        recordId: string,
        archiveReason: string
      ): ConsultationPrescriptionRecord => {
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
            "The prescription record was not found."
          )
        }

        if (
          existingRecord.recordStatus ===
          "archived"
        ) {
          return existingRecord
        }

        if (
          existingRecord.status !== "draft"
        ) {
          throw new Error(
            "Only draft prescriptions can be archived through this workflow."
          )
        }

        const consultation =
          getEditableConsultation(
            consultations,
            existingRecord.consultationId
          )

        const now =
          new Date().toISOString()

        const archivedRecord:
          ConsultationPrescriptionRecord = {
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
        setPrescriptionRecords(
          nextRecords
        )

        return archivedRecord
      },
      [consultations]
    )

  const activateConsultationDrafts =
    useCallback(
      (
        consultationId: string,
        activatedAt =
          new Date().toISOString()
      ): ConsultationPrescriptionRecord[] => {
        const consultation =
          getEditableConsultation(
            consultations,
            consultationId
          )

        const currentDrafts =
          recordsRef.current.filter(
            (record) =>
              record.consultationId ===
                consultationId &&
              record.recordStatus ===
                "current" &&
              record.status === "draft"
          )

        const unreviewedDraft =
          currentDrafts.find(
            (record) =>
              record.allergyReviewStatus ===
              "not-reviewed"
          )

        if (unreviewedDraft) {
          throw new Error(
            `${unreviewedDraft.medicationName} requires allergy review before encounter finalization.`
          )
        }

        const nextRecords =
          recordsRef.current.map(
            (record) => {
              if (
                record.consultationId !==
                  consultationId ||
                record.recordStatus !==
                  "current" ||
                record.status !== "draft"
              ) {
                return record
              }

              return {
                ...record,
                status: "active" as const,
                updatedBy:
                  consultation.doctorName,
                updatedAt: activatedAt,
              }
            }
          )

        recordsRef.current = nextRecords

        setPrescriptionRecords(
          nextRecords
        )

        return nextRecords.filter(
          (record) =>
            record.consultationId ===
            consultationId
        )
      },
      [consultations]
    )
  const contextValue =
    useMemo<ConsultationPrescriptionContextValue>(
      () => ({
        prescriptionRecords,
        createPrescriptionRecord,
        updatePrescriptionRecord,
        archivePrescriptionRecord,
        activateConsultationDrafts,
      }),
      [
        prescriptionRecords,
        createPrescriptionRecord,
        updatePrescriptionRecord,
        archivePrescriptionRecord,
        activateConsultationDrafts,
      ]
    )

  return (
    <ConsultationPrescriptionContext.Provider
      value={contextValue}
    >
      {children}
    </ConsultationPrescriptionContext.Provider>
  )
}

export function useConsultationPrescriptions(): ConsultationPrescriptionContextValue {
  const context = useContext(
    ConsultationPrescriptionContext
  )

  if (!context) {
    throw new Error(
      "useConsultationPrescriptions must be used inside ConsultationPrescriptionProvider."
    )
  }

  return context
}
