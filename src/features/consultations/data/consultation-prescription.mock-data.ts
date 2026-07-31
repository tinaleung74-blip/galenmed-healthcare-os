import type { ConsultationPrescriptionRecord } from "@/features/consultations/types/consultation-prescription.types"

/**
 * All prescription records in this file are synthetic.
 * They do not represent real patients, medication orders,
 * treatment recommendations, or prescribing guidance.
 */
export const MOCK_CONSULTATION_PRESCRIPTIONS: readonly ConsultationPrescriptionRecord[] =
  [
    {
      id: "mock-prescription-0002-01",
      prescriptionNumber:
        "GM-RX-2026-000001",

      consultationId:
        "mock-consultation-0002",

      patientId: "mock-patient-0002",

      medicationName:
        "Synthetic Meclizine",

      strength: "25 mg tablet",

      doseAmount: 1,
      doseUnit: "tablet",
      route: "oral",

      frequency: "as-needed",

      frequencyDetails:
        "Synthetic interface instruction only.",

      durationValue: 3,
      durationUnit: "days",

      quantity: 6,
      quantityUnit: "tablet(s)",

      refillsAllowed: 0,

      startDate: "2026-07-31",
      endDate: "2026-08-02",

      indication:
        "Synthetic dizziness interface test",

      patientInstructions:
        "Synthetic patient instruction for UI testing only.",

      prescriberNotes:
        "No real medication order exists.",

      substitutionAllowed: false,

      allergyReviewStatus:
        "reviewed-no-conflict",

      allergyWarningNote: null,

      status: "draft",
      recordStatus: "current",

      prescribedBy:
        "Dr. Rafael Cruz",

      prescribedAt:
        "2026-07-31T09:00:00+08:00",

      updatedBy:
        "Dr. Rafael Cruz",

      updatedAt:
        "2026-07-31T09:00:00+08:00",

      discontinuedAt: null,
      discontinuedBy: null,
      discontinuationReason: null,

      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-prescription-0004-01",
      prescriptionNumber:
        "GM-RX-2026-000002",

      consultationId:
        "mock-consultation-0004",

      patientId: "mock-patient-0004",

      medicationName:
        "Synthetic Paracetamol",

      strength: "500 mg tablet",

      doseAmount: 1,
      doseUnit: "tablet",
      route: "oral",

      frequency: "every-6-hours",

      frequencyDetails:
        "Synthetic completed-order example.",

      durationValue: 3,
      durationUnit: "days",

      quantity: 12,
      quantityUnit: "tablet(s)",

      refillsAllowed: 0,

      startDate: "2026-07-31",
      endDate: "2026-08-02",

      indication:
        "Synthetic symptom management example",

      patientInstructions:
        "Synthetic finalized prescription instruction.",

      prescriberNotes:
        "Completed-encounter UI example only.",

      substitutionAllowed: true,

      allergyReviewStatus:
        "reviewed-no-conflict",

      allergyWarningNote: null,

      status: "active",
      recordStatus: "current",

      prescribedBy:
        "Dr. Elena Reyes",

      prescribedAt:
        "2026-07-31T09:30:00+08:00",

      updatedBy:
        "Dr. Elena Reyes",

      updatedAt:
        "2026-07-31T09:30:00+08:00",

      discontinuedAt: null,
      discontinuedBy: null,
      discontinuationReason: null,

      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-prescription-0009-01",
      prescriptionNumber:
        "GM-RX-2026-000003",

      consultationId:
        "mock-consultation-0009",

      patientId: "mock-patient-0009",

      medicationName:
        "Synthetic Amlodipine",

      strength: "5 mg tablet",

      doseAmount: 1,
      doseUnit: "tablet",
      route: "oral",

      frequency: "once-daily",

      frequencyDetails: null,

      durationValue: null,
      durationUnit: "ongoing",

      quantity: 30,
      quantityUnit: "tablet(s)",

      refillsAllowed: 0,

      startDate: "2026-07-31",
      endDate: null,

      indication:
        "Synthetic hypertension interface test",

      patientInstructions:
        "Synthetic medication instruction for UI testing.",

      prescriberNotes:
        "No real prescription exists.",

      substitutionAllowed: true,

      allergyReviewStatus:
        "reviewed-no-conflict",

      allergyWarningNote: null,

      status: "draft",
      recordStatus: "current",

      prescribedBy:
        "Dr. Maria Santos",

      prescribedAt:
        "2026-07-31T10:40:00+08:00",

      updatedBy:
        "Dr. Maria Santos",

      updatedAt:
        "2026-07-31T10:40:00+08:00",

      discontinuedAt: null,
      discontinuedBy: null,
      discontinuationReason: null,

      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-prescription-0011-01",
      prescriptionNumber:
        "GM-RX-2026-000004",

      consultationId:
        "mock-consultation-0011",

      patientId: "mock-patient-0011",

      medicationName:
        "Synthetic Ferrous Sulfate",

      strength: "325 mg tablet",

      doseAmount: 1,
      doseUnit: "tablet",
      route: "oral",

      frequency: "once-daily",

      frequencyDetails: null,

      durationValue: 3,
      durationUnit: "months",

      quantity: 90,
      quantityUnit: "tablet(s)",

      refillsAllowed: 0,

      startDate: "2026-07-31",
      endDate: "2026-10-31",

      indication:
        "Synthetic anemia interface example",

      patientInstructions:
        "Synthetic finalized instruction for UI testing.",

      prescriberNotes:
        "Completed-encounter example only.",

      substitutionAllowed: true,

      allergyReviewStatus:
        "reviewed-no-conflict",

      allergyWarningNote: null,

      status: "active",
      recordStatus: "current",

      prescribedBy:
        "Dr. Rafael Cruz",

      prescribedAt:
        "2026-07-31T13:18:00+08:00",

      updatedBy:
        "Dr. Rafael Cruz",

      updatedAt:
        "2026-07-31T13:18:00+08:00",

      discontinuedAt: null,
      discontinuedBy: null,
      discontinuationReason: null,

      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
  ]
