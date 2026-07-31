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
  CONSULTATION_CLINICAL_ATTESTATION_TEXT,
} from "@/features/consultations/constants/consultation-finalization.constants"
import {
  MOCK_CONSULTATION_FINALIZATION_RECORDS,
  MOCK_CONSULTATION_FINALIZATION_REVISIONS,
} from "@/features/consultations/data/consultation-finalization.mock-data"
import { useConsultationDiagnoses } from "@/features/consultations/providers/consultation-diagnosis-provider"
import { useConsultationEmr } from "@/features/consultations/providers/consultation-emr-provider"
import { useConsultationPrescriptions } from "@/features/consultations/providers/consultation-prescription-provider"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import type { ConsultationFinalizeFormValues } from "@/features/consultations/schemas/consultation-finalize.schema"
import type { ConsultationFollowUpFormValues } from "@/features/consultations/schemas/consultation-follow-up.schema"
import type {
  ConsultationFinalizationRecord,
  ConsultationFinalizationRevision,
} from "@/features/consultations/types/consultation-finalization.types"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import { buildConsultationFinalizationReadiness } from "@/features/consultations/utils/consultation-finalization.utils"

interface ConsultationFinalizationContextValue {
  finalizationRecords:
    ConsultationFinalizationRecord[]

  finalizationRevisions:
    ConsultationFinalizationRevision[]

  saveFollowUpDraft: (
    consultationId: string,
    values:
      ConsultationFollowUpFormValues
  ) => ConsultationFinalizationRecord

  finalizeEncounter: (
    consultationId: string,
    values:
      ConsultationFinalizeFormValues
  ) => ConsultationFinalizationRecord
}

const ConsultationFinalizationContext =
  createContext<ConsultationFinalizationContextValue | null>(
    null
  )

interface ConsultationFinalizationProviderProps {
  children: ReactNode
}

function createTemporaryFinalizationId(): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `consultation-finalization-${globalThis.crypto.randomUUID()}`
  }

  return `consultation-finalization-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function createTemporaryRevisionId(): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `consultation-finalization-revision-${globalThis.crypto.randomUUID()}`
  }

  return `consultation-finalization-revision-${Date.now()}-${Math.random()
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
    consultation.status !==
    "in-progress"
  ) {
    throw new Error(
      "This workflow requires an in-progress consultation."
    )
  }

  return consultation
}

function normalizeFollowUpValues(
  values:
    ConsultationFollowUpFormValues
) {
  return {
    followUpDisposition:
      values.followUpDisposition,

    followUpDate:
      values.followUpDate || null,

    followUpMode:
      values.followUpMode || null,

    followUpReason:
      values.followUpReason.trim() ||
      null,

    patientInstructions:
      values.patientInstructions.trim(),

    returnPrecautions:
      values.returnPrecautions.trim(),

    referralFacility:
      values.referralFacility.trim() ||
      null,

    referralProvider:
      values.referralProvider.trim() ||
      null,

    referralReason:
      values.referralReason.trim() ||
      null,
  }
}

function validateFollowUpSchedule(
  consultation:
    ConsultationEncounter,
  values:
    ConsultationFollowUpFormValues
) {
  if (
    values.followUpDisposition !==
      "scheduled" ||
    values.followUpDate === ""
  ) {
    return
  }

  const consultationDate =
    consultation.scheduledAt.slice(
      0,
      10
    )

  if (
    values.followUpDate <
    consultationDate
  ) {
    throw new Error(
      "Follow-up date cannot be earlier than the consultation date."
    )
  }
}

function normalizeSignerName(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-PH")
}

export function ConsultationFinalizationProvider({
  children,
}: ConsultationFinalizationProviderProps) {
  const {
    consultations,
    completeConsultation,
  } = useConsultations()

  const {
    soapNotes,
    finalizeSoapNote,
  } = useConsultationEmr()

  const { diagnosisRecords } =
    useConsultationDiagnoses()

  const {
    prescriptionRecords,
    activateConsultationDrafts,
  } = useConsultationPrescriptions()

  const [
    finalizationRecords,
    setFinalizationRecords,
  ] = useState<
    ConsultationFinalizationRecord[]
  >(
    () => [
      ...MOCK_CONSULTATION_FINALIZATION_RECORDS,
    ]
  )

  const [
    finalizationRevisions,
    setFinalizationRevisions,
  ] = useState<
    ConsultationFinalizationRevision[]
  >(
    () => [
      ...MOCK_CONSULTATION_FINALIZATION_REVISIONS,
    ]
  )

  const recordsRef =
    useRef<
      ConsultationFinalizationRecord[]
    >(finalizationRecords)

  const revisionsRef =
    useRef<
      ConsultationFinalizationRevision[]
    >(finalizationRevisions)

  const saveFollowUpDraft =
    useCallback(
      (
        consultationId: string,
        values:
          ConsultationFollowUpFormValues
      ): ConsultationFinalizationRecord => {
        const consultation =
          getEditableConsultation(
            consultations,
            consultationId
          )

        validateFollowUpSchedule(
          consultation,
          values
        )

        const existingRecord =
          recordsRef.current.find(
            (record) =>
              record.consultationId ===
              consultationId
          ) ?? null

        if (
          existingRecord?.status ===
          "finalized"
        ) {
          throw new Error(
            "A finalized encounter cannot be changed through the draft workflow."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedValues =
          normalizeFollowUpValues(values)

        const nextVersion =
          existingRecord
            ? existingRecord.version + 1
            : 1

        const savedRecord:
          ConsultationFinalizationRecord =
          existingRecord
            ? {
                ...existingRecord,
                ...normalizedValues,
                version:
                  nextVersion,
                updatedBy:
                  consultation.doctorName,
                updatedAt: now,
              }
            : {
                id:
                  createTemporaryFinalizationId(),
                consultationId:
                  consultation.id,
                patientId:
                  consultation.patientId,
                ...normalizedValues,
                status: "draft",
                version:
                  nextVersion,
                signature: null,
                createdBy:
                  consultation.doctorName,
                createdAt: now,
                updatedBy:
                  consultation.doctorName,
                updatedAt: now,
                finalizedBy: null,
                finalizedAt: null,
              }

        const nextRecords =
          existingRecord
            ? recordsRef.current.map(
                (record) =>
                  record.id ===
                  existingRecord.id
                    ? savedRecord
                    : record
              )
            : [
                savedRecord,
                ...recordsRef.current,
              ]

        const revision:
          ConsultationFinalizationRevision =
          {
            id:
              createTemporaryRevisionId(),
            finalizationRecordId:
              savedRecord.id,
            consultationId:
              savedRecord.consultationId,
            patientId:
              savedRecord.patientId,
            version:
              savedRecord.version,
            action:
              existingRecord
                ? "saved"
                : "created",
            followUpDisposition:
              savedRecord.followUpDisposition,
            followUpDate:
              savedRecord.followUpDate,
            followUpMode:
              savedRecord.followUpMode,
            followUpReason:
              savedRecord.followUpReason,
            patientInstructions:
              savedRecord.patientInstructions,
            returnPrecautions:
              savedRecord.returnPrecautions,
            referralFacility:
              savedRecord.referralFacility,
            referralProvider:
              savedRecord.referralProvider,
            referralReason:
              savedRecord.referralReason,
            changedBy:
              consultation.doctorName,
            changedAt: now,
          }

        const nextRevisions = [
          revision,
          ...revisionsRef.current,
        ]

        recordsRef.current =
          nextRecords

        revisionsRef.current =
          nextRevisions

        setFinalizationRecords(
          nextRecords
        )

        setFinalizationRevisions(
          nextRevisions
        )

        return savedRecord
      },
      [consultations]
    )

  const finalizeEncounter =
    useCallback(
      (
        consultationId: string,
        values:
          ConsultationFinalizeFormValues
      ): ConsultationFinalizationRecord => {
        const consultation =
          getEditableConsultation(
            consultations,
            consultationId
          )

        const finalizationRecord =
          recordsRef.current.find(
            (record) =>
              record.consultationId ===
              consultationId
          ) ?? null

        if (!finalizationRecord) {
          throw new Error(
            "Save the follow-up and discharge plan before finalizing the encounter."
          )
        }

        if (
          finalizationRecord.status ===
          "finalized"
        ) {
          return finalizationRecord
        }

        const soapNote =
          soapNotes.find(
            (note) =>
              note.consultationId ===
              consultationId
          ) ?? null

        const readiness =
          buildConsultationFinalizationReadiness(
            {
              consultation,
              finalizationRecord,
              soapNote,
              diagnosisRecords,
              prescriptionRecords,
            }
          )

        if (!readiness.ready) {
          const firstIncomplete =
            readiness.requirements.find(
              (requirement) =>
                !requirement.met
            )

          throw new Error(
            firstIncomplete?.description ??
              "The encounter is not ready for finalization."
          )
        }

        if (
          normalizeSignerName(
            values.signerName
          ) !==
          normalizeSignerName(
            consultation.doctorName
          )
        ) {
          throw new Error(
            `Typed signer name must match ${consultation.doctorName}.`
          )
        }

        const finalizedAt =
          new Date().toISOString()

        finalizeSoapNote(
          consultationId,
          finalizedAt
        )

        activateConsultationDrafts(
          consultationId,
          finalizedAt
        )

        completeConsultation(
          consultationId,
          finalizedAt
        )

        const finalizedRecord:
          ConsultationFinalizationRecord =
          {
            ...finalizationRecord,
            status: "finalized",
            version:
              finalizationRecord.version +
              1,
            signature: {
              signerName:
                values.signerName.trim(),
              signerRole:
                values.signerRole.trim(),
              professionalRegistrationNumber:
                values.professionalRegistrationNumber
                  .trim()
                  .toUpperCase(),
              signatureMethod:
                "typed-name",
              attestationText:
                CONSULTATION_CLINICAL_ATTESTATION_TEXT,
              signedAt: finalizedAt,
            },
            updatedBy:
              consultation.doctorName,
            updatedAt: finalizedAt,
            finalizedBy:
              consultation.doctorName,
            finalizedAt,
          }

        const nextRecords =
          recordsRef.current.map(
            (record) =>
              record.id ===
              finalizationRecord.id
                ? finalizedRecord
                : record
          )

        const revision:
          ConsultationFinalizationRevision =
          {
            id:
              createTemporaryRevisionId(),
            finalizationRecordId:
              finalizedRecord.id,
            consultationId:
              finalizedRecord.consultationId,
            patientId:
              finalizedRecord.patientId,
            version:
              finalizedRecord.version,
            action: "finalized",
            followUpDisposition:
              finalizedRecord.followUpDisposition,
            followUpDate:
              finalizedRecord.followUpDate,
            followUpMode:
              finalizedRecord.followUpMode,
            followUpReason:
              finalizedRecord.followUpReason,
            patientInstructions:
              finalizedRecord.patientInstructions,
            returnPrecautions:
              finalizedRecord.returnPrecautions,
            referralFacility:
              finalizedRecord.referralFacility,
            referralProvider:
              finalizedRecord.referralProvider,
            referralReason:
              finalizedRecord.referralReason,
            changedBy:
              consultation.doctorName,
            changedAt: finalizedAt,
          }

        const nextRevisions = [
          revision,
          ...revisionsRef.current,
        ]

        recordsRef.current =
          nextRecords

        revisionsRef.current =
          nextRevisions

        setFinalizationRecords(
          nextRecords
        )

        setFinalizationRevisions(
          nextRevisions
        )

        return finalizedRecord
      },
      [
        consultations,
        soapNotes,
        diagnosisRecords,
        prescriptionRecords,
        finalizeSoapNote,
        activateConsultationDrafts,
        completeConsultation,
      ]
    )

  const contextValue =
    useMemo<ConsultationFinalizationContextValue>(
      () => ({
        finalizationRecords,
        finalizationRevisions,
        saveFollowUpDraft,
        finalizeEncounter,
      }),
      [
        finalizationRecords,
        finalizationRevisions,
        saveFollowUpDraft,
        finalizeEncounter,
      ]
    )

  return (
    <ConsultationFinalizationContext.Provider
      value={contextValue}
    >
      {children}
    </ConsultationFinalizationContext.Provider>
  )
}

export function useConsultationFinalization(): ConsultationFinalizationContextValue {
  const context = useContext(
    ConsultationFinalizationContext
  )

  if (!context) {
    throw new Error(
      "useConsultationFinalization must be used inside ConsultationFinalizationProvider."
    )
  }

  return context
}
