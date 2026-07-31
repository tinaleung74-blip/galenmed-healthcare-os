import {
  CONSULTATION_CLINICAL_ATTESTATION_TEXT,
} from "@/features/consultations/constants/consultation-finalization.constants"
import type {
  ConsultationFinalizationRecord,
  ConsultationFinalizationRevision,
} from "@/features/consultations/types/consultation-finalization.types"

/**
 * All finalization, follow-up, and signature records
 * in this file are synthetic development data.
 *
 * They do not represent real clinical instructions,
 * real professional registration numbers, or legally
 * validated digital signatures.
 */
export const MOCK_CONSULTATION_FINALIZATION_RECORDS: readonly ConsultationFinalizationRecord[] =
  [
    {
      id: "mock-finalization-0002",

      consultationId:
        "mock-consultation-0002",

      patientId: "mock-patient-0002",

      followUpDisposition:
        "scheduled",

      followUpDate: "2026-08-07",

      followUpMode: "in-person",

      followUpReason:
        "Synthetic reassessment follow-up for interface testing.",

      patientInstructions:
        "Synthetic patient instructions for Consultation EMR interface testing only.",

      returnPrecautions:
        "Synthetic return precautions. No real clinical guidance is represented.",

      referralFacility: null,
      referralProvider: null,
      referralReason: null,

      status: "draft",
      version: 1,

      signature: null,

      createdBy: "Dr. Rafael Cruz",

      createdAt:
        "2026-07-31T09:05:00+08:00",

      updatedBy: "Dr. Rafael Cruz",

      updatedAt:
        "2026-07-31T09:05:00+08:00",

      finalizedBy: null,
      finalizedAt: null,
    },
    {
      id: "mock-finalization-0004",

      consultationId:
        "mock-consultation-0004",

      patientId: "mock-patient-0004",

      followUpDisposition:
        "as-needed",

      followUpDate: null,
      followUpMode: null,

      followUpReason:
        "Synthetic follow-up as needed example.",

      patientInstructions:
        "Synthetic finalized patient instructions for completed-encounter UI testing.",

      returnPrecautions:
        "Synthetic finalized return precautions for interface testing.",

      referralFacility: null,
      referralProvider: null,
      referralReason: null,

      status: "finalized",
      version: 1,

      signature: {
        signerName: "Dr. Elena Reyes",

        signerRole:
          "Attending Physician",

        professionalRegistrationNumber:
          "SYNTH-PRC-0004",

        signatureMethod:
          "typed-name",

        attestationText:
          CONSULTATION_CLINICAL_ATTESTATION_TEXT,

        signedAt:
          "2026-07-31T09:34:00+08:00",
      },

      createdBy: "Dr. Elena Reyes",

      createdAt:
        "2026-07-31T09:31:00+08:00",

      updatedBy: "Dr. Elena Reyes",

      updatedAt:
        "2026-07-31T09:34:00+08:00",

      finalizedBy: "Dr. Elena Reyes",

      finalizedAt:
        "2026-07-31T09:34:00+08:00",
    },
    {
      id: "mock-finalization-0009",

      consultationId:
        "mock-consultation-0009",

      patientId: "mock-patient-0009",

      followUpDisposition:
        "scheduled",

      followUpDate: "2026-08-14",

      followUpMode: "telemedicine",

      followUpReason:
        "Synthetic telemedicine follow-up for interface testing.",

      patientInstructions:
        "Synthetic follow-up instructions for UI development only.",

      returnPrecautions:
        "Synthetic return precautions. No real clinical advice is represented.",

      referralFacility: null,
      referralProvider: null,
      referralReason: null,

      status: "draft",
      version: 1,

      signature: null,

      createdBy: "Dr. Maria Santos",

      createdAt:
        "2026-07-31T10:45:00+08:00",

      updatedBy: "Dr. Maria Santos",

      updatedAt:
        "2026-07-31T10:45:00+08:00",

      finalizedBy: null,
      finalizedAt: null,
    },
    {
      id: "mock-finalization-0011",

      consultationId:
        "mock-consultation-0011",

      patientId: "mock-patient-0011",

      followUpDisposition:
        "external-referral",

      followUpDate: null,
      followUpMode: null,

      followUpReason:
        "Synthetic specialist follow-up workflow.",

      patientInstructions:
        "Synthetic completed-encounter patient instructions.",

      returnPrecautions:
        "Synthetic completed-encounter return precautions.",

      referralFacility:
        "Synthetic Hematology Center",

      referralProvider:
        "Synthetic Specialist",

      referralReason:
        "Synthetic referral reason for completed-encounter UI testing.",

      status: "finalized",
      version: 1,

      signature: {
        signerName: "Dr. Rafael Cruz",

        signerRole:
          "Attending Physician",

        professionalRegistrationNumber:
          "SYNTH-PRC-0011",

        signatureMethod:
          "typed-name",

        attestationText:
          CONSULTATION_CLINICAL_ATTESTATION_TEXT,

        signedAt:
          "2026-07-31T13:22:00+08:00",
      },

      createdBy: "Dr. Rafael Cruz",

      createdAt:
        "2026-07-31T13:19:00+08:00",

      updatedBy: "Dr. Rafael Cruz",

      updatedAt:
        "2026-07-31T13:22:00+08:00",

      finalizedBy: "Dr. Rafael Cruz",

      finalizedAt:
        "2026-07-31T13:22:00+08:00",
    },
  ]

export const MOCK_CONSULTATION_FINALIZATION_REVISIONS: readonly ConsultationFinalizationRevision[] =
  MOCK_CONSULTATION_FINALIZATION_RECORDS.map(
    (record) => ({
      id: `mock-finalization-revision-${record.id}`,

      finalizationRecordId:
        record.id,

      consultationId:
        record.consultationId,

      patientId:
        record.patientId,

      version:
        record.version,

      action:
        record.status === "finalized"
          ? "finalized"
          : "created",

      followUpDisposition:
        record.followUpDisposition,

      followUpDate:
        record.followUpDate,

      followUpMode:
        record.followUpMode,

      followUpReason:
        record.followUpReason,

      patientInstructions:
        record.patientInstructions,

      returnPrecautions:
        record.returnPrecautions,

      referralFacility:
        record.referralFacility,

      referralProvider:
        record.referralProvider,

      referralReason:
        record.referralReason,

      changedBy:
        record.updatedBy,

      changedAt:
        record.updatedAt,
    })
  )
