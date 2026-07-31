import type { ConsultationDiagnosisRecord } from "@/features/consultations/types/consultation-diagnosis.types"

/**
 * All diagnosis records in this file are synthetic.
 * They do not represent real patients or medical diagnoses.
 */
export const MOCK_CONSULTATION_DIAGNOSES: readonly ConsultationDiagnosisRecord[] =
  [
    {
      id: "mock-diagnosis-0002-01",
      consultationId:
        "mock-consultation-0002",
      patientId: "mock-patient-0002",
      diagnosisName:
        "Dizziness and giddiness",
      icd10Code: "R42",
      codeSystem: "ICD-10",
      role: "differential",
      verificationStatus:
        "provisional",
      onsetDate: "2026-07-27",
      clinicalNotes:
        "Synthetic differential diagnosis created for Consultation EMR interface testing.",
      recordStatus: "current",
      recordedBy: "Dr. Rafael Cruz",
      recordedAt:
        "2026-07-31T08:55:00+08:00",
      updatedBy: "Dr. Rafael Cruz",
      updatedAt:
        "2026-07-31T08:55:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-diagnosis-0004-01",
      consultationId:
        "mock-consultation-0004",
      patientId: "mock-patient-0004",
      diagnosisName:
        "Acute upper respiratory infection, unspecified",
      icd10Code: "J06.9",
      codeSystem: "ICD-10",
      role: "primary",
      verificationStatus:
        "confirmed",
      onsetDate: "2026-07-28",
      clinicalNotes:
        "Synthetic finalized primary diagnosis for completed-encounter testing.",
      recordStatus: "current",
      recordedBy: "Dr. Elena Reyes",
      recordedAt:
        "2026-07-31T09:28:00+08:00",
      updatedBy: "Dr. Elena Reyes",
      updatedAt:
        "2026-07-31T09:28:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-diagnosis-0009-01",
      consultationId:
        "mock-consultation-0009",
      patientId: "mock-patient-0009",
      diagnosisName:
        "Essential hypertension",
      icd10Code: "I10",
      codeSystem: "ICD-10",
      role: "primary",
      verificationStatus:
        "confirmed",
      onsetDate: "2022-03-15",
      clinicalNotes:
        "Synthetic diagnosis used for telemedicine encounter testing.",
      recordStatus: "current",
      recordedBy: "Dr. Maria Santos",
      recordedAt:
        "2026-07-31T10:35:00+08:00",
      updatedBy: "Dr. Maria Santos",
      updatedAt:
        "2026-07-31T10:35:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-diagnosis-0011-01",
      consultationId:
        "mock-consultation-0011",
      patientId: "mock-patient-0011",
      diagnosisName:
        "Iron deficiency anemia, unspecified",
      icd10Code: "D50.9",
      codeSystem: "ICD-10",
      role: "primary",
      verificationStatus:
        "confirmed",
      onsetDate: "2025-12-03",
      clinicalNotes:
        "Synthetic finalized diagnosis for completed-encounter testing.",
      recordStatus: "current",
      recordedBy: "Dr. Rafael Cruz",
      recordedAt:
        "2026-07-31T13:16:00+08:00",
      updatedBy: "Dr. Rafael Cruz",
      updatedAt:
        "2026-07-31T13:16:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
  ]
