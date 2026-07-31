import type {
  ConsultationSoapNote,
  ConsultationSoapNoteRevision,
} from "@/features/consultations/types/consultation-emr.types"

/**
 * All SOAP notes in this file are synthetic.
 * They do not represent real patients, diagnoses, or encounters.
 */
export const MOCK_CONSULTATION_SOAP_NOTES: readonly ConsultationSoapNote[] =
  [
    {
      id: "mock-soap-note-0002",
      consultationId: "mock-consultation-0002",
      patientId: "mock-patient-0002",
      subjective:
        "Synthetic patient reports intermittent dizziness beginning several days before the consultation. No real clinical information is represented.",
      objective:
        "Synthetic observation placeholder recorded for Consultation EMR interface testing.",
      assessment:
        "Synthetic preliminary assessment pending structured diagnosis workflow.",
      plan:
        "Synthetic plan to continue assessment and review relevant records.",
      status: "draft",
      version: 1,
      createdBy: "Dr. Rafael Cruz",
      createdAt: "2026-07-31T08:50:00+08:00",
      updatedBy: "Dr. Rafael Cruz",
      updatedAt: "2026-07-31T08:50:00+08:00",
      finalizedBy: null,
      finalizedAt: null,
    },
    {
      id: "mock-soap-note-0004",
      consultationId: "mock-consultation-0004",
      patientId: "mock-patient-0004",
      subjective:
        "Synthetic respiratory symptom history created only for completed-encounter UI testing.",
      objective:
        "Synthetic examination and measurement summary. No real patient findings are represented.",
      assessment:
        "Synthetic completed assessment retained as a read-only example.",
      plan:
        "Synthetic follow-up and safety instructions retained as a finalized example.",
      status: "finalized",
      version: 1,
      createdBy: "Dr. Elena Reyes",
      createdAt: "2026-07-31T09:20:00+08:00",
      updatedBy: "Dr. Elena Reyes",
      updatedAt: "2026-07-31T09:34:00+08:00",
      finalizedBy: "Dr. Elena Reyes",
      finalizedAt: "2026-07-31T09:34:00+08:00",
    },
    {
      id: "mock-soap-note-0009",
      consultationId: "mock-consultation-0009",
      patientId: "mock-patient-0009",
      subjective:
        "Synthetic telemedicine medication follow-up history.",
      objective:
        "Synthetic remote-observation placeholder. No physical examination is implied.",
      assessment:
        "Synthetic draft assessment for EMR interface development.",
      plan:
        "Synthetic plan pending diagnosis and prescription workflow.",
      status: "draft",
      version: 1,
      createdBy: "Dr. Maria Santos",
      createdAt: "2026-07-31T10:28:00+08:00",
      updatedBy: "Dr. Maria Santos",
      updatedAt: "2026-07-31T10:28:00+08:00",
      finalizedBy: null,
      finalizedAt: null,
    },
    {
      id: "mock-soap-note-0011",
      consultationId: "mock-consultation-0011",
      patientId: "mock-patient-0011",
      subjective:
        "Synthetic follow-up history for completed-encounter UI testing.",
      objective:
        "Synthetic clinical observation summary.",
      assessment:
        "Synthetic finalized assessment for interface demonstration only.",
      plan:
        "Synthetic follow-up plan retained as a read-only finalized note.",
      status: "finalized",
      version: 1,
      createdBy: "Dr. Rafael Cruz",
      createdAt: "2026-07-31T13:08:00+08:00",
      updatedBy: "Dr. Rafael Cruz",
      updatedAt: "2026-07-31T13:22:00+08:00",
      finalizedBy: "Dr. Rafael Cruz",
      finalizedAt: "2026-07-31T13:22:00+08:00",
    },
  ]

export const MOCK_CONSULTATION_SOAP_REVISIONS: readonly ConsultationSoapNoteRevision[] =
  MOCK_CONSULTATION_SOAP_NOTES.map(
    (note) => ({
      id: `mock-soap-revision-${note.id}`,
      soapNoteId: note.id,
      consultationId: note.consultationId,
      patientId: note.patientId,
      version: note.version,
      action:
        note.status === "finalized"
          ? "finalized"
          : "created",
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
      changedBy: note.updatedBy,
      changedAt: note.updatedAt,
    })
  )
