import {
  PHARMACY_MEDICATION_CATALOG,
} from "@/features/pharmacy/constants/pharmacy.constants"
import type {
  PharmacyPrescription,
  PharmacyPrescriptionItem,
} from "@/features/pharmacy/types/pharmacy.types"

function createMockPrescriptionItem(
  id: string,
  medicationId: string,
  values: {
    dose: string
    frequency: string
    durationDays: number | null

    quantityPrescribed: number
    quantityDispensed: number

    instructions: string
    substitutionAllowed: boolean
  }
): PharmacyPrescriptionItem {
  const medication =
    PHARMACY_MEDICATION_CATALOG.find(
      (candidateMedication) =>
        candidateMedication.id ===
        medicationId
    )

  if (!medication) {
    throw new Error(
      `Unknown synthetic medication: ${medicationId}.`
    )
  }

  const remaining =
    Math.max(
      0,
      values.quantityPrescribed -
        values.quantityDispensed
    )

  return {
    id,

    medicationId:
      medication.id,

    medicationSku:
      medication.sku,

    genericName:
      medication.genericName,

    brandName:
      medication.brandName,

    strength:
      medication.strength,

    dosageForm:
      medication.dosageForm,

    dose: values.dose,

    route:
      medication.defaultRoute,

    frequency:
      values.frequency,

    durationDays:
      values.durationDays,

    quantityPrescribed:
      values.quantityPrescribed,

    quantityDispensed:
      values.quantityDispensed,

    instructions:
      values.instructions,

    substitutionAllowed:
      values.substitutionAllowed,

    status:
      remaining === 0
        ? "dispensed"
        : values.quantityDispensed >
            0
          ? "partially-dispensed"
          : "pending",
  }
}

/**
 * All prescriptions, medications, clinicians,
 * review decisions, dispensing records, and
 * timestamps are synthetic development data.
 */
export const MOCK_PHARMACY_PRESCRIPTIONS: readonly PharmacyPrescription[] =
  [
    {
      id:
        "mock-pharmacy-prescription-0001",

      prescriptionNumber:
        "GM-RX-2026-000001",

      patientId:
        "mock-patient-0002",

      consultationId:
        "mock-consultation-0002",

      consultationNumber:
        "GM-CON-2026-000002",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      prescriberName:
        "Dr. Rafael Cruz",

      source: "consultation",
      priority: "urgent",

      status:
        "pending-review",

      clinicalNotes:
        "Synthetic prescription awaiting pharmacy safety review.",

      items: [
        createMockPrescriptionItem(
          "mock-rx-item-0001-amox",
          "medication-amoxicillin-500-capsule",
          {
            dose: "500 mg",
            frequency:
              "Three times daily",
            durationDays: 7,

            quantityPrescribed: 21,
            quantityDispensed: 0,

            instructions:
              "Synthetic instructions for Pharmacy UI testing.",

            substitutionAllowed:
              true,
          }
        ),
      ],

      allergyReviewStatus:
        "pending",

      allergyReviewAt: null,
      allergyReviewBy: null,
      allergyReviewNotes: null,

      interactionReviewStatus:
        "pending",

      interactionReviewAt: null,
      interactionReviewBy: null,
      interactionReviewNotes: null,

      pharmacistVerifiedAt: null,
      pharmacistVerifiedBy: null,
      pharmacistVerificationNotes: null,

      counselingCompletedAt: null,
      counselingCompletedBy: null,
      counselingNotes: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-08-04T08:00:00+08:00",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "Dr. Rafael Cruz",
    },
    {
      id:
        "mock-pharmacy-prescription-0002",

      prescriptionNumber:
        "GM-RX-2026-000002",

      patientId:
        "mock-patient-0004",

      consultationId:
        "mock-consultation-0004",

      consultationNumber:
        "GM-CON-2026-000004",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      prescriberName:
        "Dr. Elena Reyes",

      source: "consultation",
      priority: "routine",
      status: "approved",

      clinicalNotes:
        "Synthetic approved prescription.",

      items: [
        createMockPrescriptionItem(
          "mock-rx-item-0002-para",
          "medication-paracetamol-500-tablet",
          {
            dose: "500 mg",

            frequency:
              "As recorded in synthetic prescription",

            durationDays: 3,

            quantityPrescribed: 10,
            quantityDispensed: 0,

            instructions:
              "Synthetic medication-label instruction.",

            substitutionAllowed:
              true,
          }
        ),
      ],

      allergyReviewStatus:
        "clear",

      allergyReviewAt:
        "2026-08-04T08:25:00+08:00",

      allergyReviewBy:
        "Synthetic Pharmacist A",

      allergyReviewNotes:
        "Synthetic allergy review clear.",

      interactionReviewStatus:
        "clear",

      interactionReviewAt:
        "2026-08-04T08:25:00+08:00",

      interactionReviewBy:
        "Synthetic Pharmacist A",

      interactionReviewNotes:
        "Synthetic interaction review clear.",

      pharmacistVerifiedAt: null,
      pharmacistVerifiedBy: null,
      pharmacistVerificationNotes: null,

      counselingCompletedAt: null,
      counselingCompletedBy: null,
      counselingNotes: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-08-04T08:15:00+08:00",

      updatedAt:
        "2026-08-04T08:25:00+08:00",

      updatedBy:
        "Synthetic Pharmacist A",
    },
    {
      id:
        "mock-pharmacy-prescription-0003",

      prescriptionNumber:
        "GM-RX-2026-000003",

      patientId:
        "mock-patient-0005",

      consultationId:
        "mock-consultation-0005",

      consultationNumber:
        "GM-CON-2026-000005",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      prescriberName:
        "Dr. Maria Santos",

      source: "consultation",
      priority: "routine",

      status:
        "partially-dispensed",

      clinicalNotes:
        "Synthetic partial-dispensing workflow.",

      items: [
        createMockPrescriptionItem(
          "mock-rx-item-0003-omep",
          "medication-omeprazole-20-capsule",
          {
            dose: "20 mg",

            frequency:
              "Once daily",

            durationDays: 14,

            quantityPrescribed: 14,
            quantityDispensed: 7,

            instructions:
              "Synthetic partial-dispensing instruction.",

            substitutionAllowed:
              false,
          }
        ),
      ],

      allergyReviewStatus:
        "warning",

      allergyReviewAt:
        "2026-08-04T08:40:00+08:00",

      allergyReviewBy:
        "Synthetic Pharmacist B",

      allergyReviewNotes:
        "Synthetic non-blocking allergy warning documented.",

      interactionReviewStatus:
        "clear",

      interactionReviewAt:
        "2026-08-04T08:40:00+08:00",

      interactionReviewBy:
        "Synthetic Pharmacist B",

      interactionReviewNotes:
        "Synthetic interaction review clear.",

      pharmacistVerifiedAt: null,
      pharmacistVerifiedBy: null,
      pharmacistVerificationNotes: null,

      counselingCompletedAt: null,
      counselingCompletedBy: null,
      counselingNotes: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-08-04T08:30:00+08:00",

      updatedAt:
        "2026-08-04T08:50:00+08:00",

      updatedBy:
        "Synthetic Pharmacist B",
    },
    {
      id:
        "mock-pharmacy-prescription-0004",

      prescriptionNumber:
        "GM-RX-2026-000004",

      patientId:
        "mock-patient-0007",

      consultationId:
        "mock-consultation-0007",

      consultationNumber:
        "GM-CON-2026-000007",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      prescriberName:
        "Dr. Rafael Cruz",

      source: "consultation",
      priority: "urgent",
      status: "on-hold",

      clinicalNotes:
        "Synthetic blocked interaction-review workflow.",

      items: [
        createMockPrescriptionItem(
          "mock-rx-item-0004-salb",
          "medication-salbutamol-inhaler",
          {
            dose:
              "Synthetic recorded dose",

            frequency:
              "As recorded",

            durationDays: null,

            quantityPrescribed: 1,
            quantityDispensed: 0,

            instructions:
              "Synthetic inhaler instruction.",

            substitutionAllowed:
              false,
          }
        ),
      ],

      allergyReviewStatus:
        "clear",

      allergyReviewAt:
        "2026-08-04T09:05:00+08:00",

      allergyReviewBy:
        "Synthetic Pharmacist C",

      allergyReviewNotes:
        "Synthetic allergy review clear.",

      interactionReviewStatus:
        "blocked",

      interactionReviewAt:
        "2026-08-04T09:05:00+08:00",

      interactionReviewBy:
        "Synthetic Pharmacist C",

      interactionReviewNotes:
        "Synthetic blocking interaction retained for UI testing.",

      pharmacistVerifiedAt: null,
      pharmacistVerifiedBy: null,
      pharmacistVerificationNotes: null,

      counselingCompletedAt: null,
      counselingCompletedBy: null,
      counselingNotes: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-08-04T08:55:00+08:00",

      updatedAt:
        "2026-08-04T09:05:00+08:00",

      updatedBy:
        "Synthetic Pharmacist C",
    },
    {
      id:
        "mock-pharmacy-prescription-0005",

      prescriptionNumber:
        "GM-RX-2026-000005",

      patientId:
        "mock-patient-0001",

      consultationId: null,
      consultationNumber: null,

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      prescriberName:
        "Dr. Maria Santos",

      source: "outpatient",
      priority: "routine",
      status: "dispensed",

      clinicalNotes:
        "Synthetic completed Pharmacy workflow.",

      items: [
        createMockPrescriptionItem(
          "mock-rx-item-0005-ors",
          "medication-oral-rehydration-salts",
          {
            dose:
              "One synthetic sachet",

            frequency:
              "As documented",

            durationDays: 2,

            quantityPrescribed: 6,
            quantityDispensed: 6,

            instructions:
              "Synthetic counseling and release workflow instruction.",

            substitutionAllowed:
              true,
          }
        ),
      ],

      allergyReviewStatus:
        "not-applicable",

      allergyReviewAt:
        "2026-08-04T09:20:00+08:00",

      allergyReviewBy:
        "Synthetic Pharmacist D",

      allergyReviewNotes:
        "Synthetic review marked not applicable.",

      interactionReviewStatus:
        "clear",

      interactionReviewAt:
        "2026-08-04T09:20:00+08:00",

      interactionReviewBy:
        "Synthetic Pharmacist D",

      interactionReviewNotes:
        "Synthetic interaction review clear.",

      pharmacistVerifiedAt:
        "2026-08-04T09:30:00+08:00",

      pharmacistVerifiedBy:
        "Synthetic Pharmacist D",

      pharmacistVerificationNotes:
        "Synthetic dispensing verification completed.",

      counselingCompletedAt:
        "2026-08-04T09:35:00+08:00",

      counselingCompletedBy:
        "Synthetic Pharmacist D",

      counselingNotes:
        "Synthetic medication counseling completed.",

      releasedAt:
        "2026-08-04T09:40:00+08:00",

      releasedBy:
        "Synthetic Pharmacist D",

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-08-04T09:10:00+08:00",

      updatedAt:
        "2026-08-04T09:40:00+08:00",

      updatedBy:
        "Synthetic Pharmacist D",
    },
    {
      id:
        "mock-pharmacy-prescription-0006",

      prescriptionNumber:
        "GM-RX-2026-000006",

      patientId:
        "mock-patient-0008",

      consultationId: null,
      consultationNumber: null,

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      prescriberName:
        "Dr. Elena Reyes",

      source: "outpatient",
      priority: "routine",
      status: "cancelled",

      clinicalNotes:
        "Synthetic cancelled prescription.",

      items: [
        createMockPrescriptionItem(
          "mock-rx-item-0006-ceti",
          "medication-cetirizine-10-tablet",
          {
            dose: "10 mg",
            frequency:
              "Once daily",

            durationDays: 5,

            quantityPrescribed: 5,
            quantityDispensed: 0,

            instructions:
              "Synthetic cancelled prescription instruction.",

            substitutionAllowed:
              true,
          }
        ),
      ],

      allergyReviewStatus:
        "pending",

      allergyReviewAt: null,
      allergyReviewBy: null,
      allergyReviewNotes: null,

      interactionReviewStatus:
        "pending",

      interactionReviewAt: null,
      interactionReviewBy: null,
      interactionReviewNotes: null,

      pharmacistVerifiedAt: null,
      pharmacistVerifiedBy: null,
      pharmacistVerificationNotes: null,

      counselingCompletedAt: null,
      counselingCompletedBy: null,
      counselingNotes: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt:
        "2026-08-04T10:10:00+08:00",

      cancelledBy:
        "GalenMed Pharmacy Desk",

      cancellationReason:
        "Synthetic prescription withdrawn before dispensing.",

      createdAt:
        "2026-08-04T10:00:00+08:00",

      updatedAt:
        "2026-08-04T10:10:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
  ]
