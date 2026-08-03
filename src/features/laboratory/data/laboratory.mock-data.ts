import type { LaboratoryOrder } from "@/features/laboratory/types/laboratory.types"

/**
 * All laboratory orders, specimens, patients,
 * clinicians, and accession numbers in this file
 * are synthetic development data.
 */
export const MOCK_LABORATORY_ORDERS: readonly LaboratoryOrder[] =
  [
    {
      id: "mock-lab-order-0001",
      orderNumber:
        "GM-LAB-2026-000001",

      patientId:
        "mock-patient-0002",

      consultationId:
        "mock-consultation-0002",

      consultationNumber:
        "GM-CON-2026-000002",

      branchId: "branch-makati",
      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Rafael Cruz",

      priority: "stat",
      source: "consultation",
      status: "in-process",

      clinicalIndication:
        "Synthetic dizziness laboratory evaluation.",

      fastingRequired: true,

      patientInstructions:
        "Synthetic specimen preparation instruction.",

      internalNotes:
        "Synthetic STAT laboratory workflow record.",

      items: [
        {
          id:
            "mock-lab-item-0001-cbc",

          testCode: "LAB-CBC",

          testName:
            "Complete Blood Count",

          category: "Hematology",

          specimenType:
            "whole-blood",

          containerType:
            "Lavender-top EDTA tube",

          estimatedTurnaroundMinutes:
            90,

          status: "in-process",
        },
        {
          id:
            "mock-lab-item-0001-fbs",

          testCode: "LAB-FBS",

          testName:
            "Fasting Blood Sugar",

          category:
            "Clinical Chemistry",

          specimenType: "serum",

          containerType:
            "Serum separator tube",

          estimatedTurnaroundMinutes:
            60,

          status: "in-process",
        },
      ],

      specimens: [
        {
          id:
            "mock-lab-specimen-0001-blood",

          accessionNumber:
            "GM-ACC-2026-000001",

          orderItemIds: [
            "mock-lab-item-0001-cbc",
          ],

          specimenType:
            "whole-blood",

          collectionMethod:
            "venipuncture",

          containerType:
            "Lavender-top EDTA tube",

          status: "received",

          collectedAt:
            "2026-07-31T09:02:00+08:00",

          collectedBy:
            "Synthetic Phlebotomist A",

          receivedAt:
            "2026-07-31T09:10:00+08:00",

          receivedBy:
            "GalenMed Laboratory Desk",

          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,

          notes:
            "Synthetic whole-blood specimen.",
        },
        {
          id:
            "mock-lab-specimen-0001-serum",

          accessionNumber:
            "GM-ACC-2026-000002",

          orderItemIds: [
            "mock-lab-item-0001-fbs",
          ],

          specimenType: "serum",

          collectionMethod:
            "venipuncture",

          containerType:
            "Serum separator tube",

          status: "received",

          collectedAt:
            "2026-07-31T09:03:00+08:00",

          collectedBy:
            "Synthetic Phlebotomist A",

          receivedAt:
            "2026-07-31T09:11:00+08:00",

          receivedBy:
            "GalenMed Laboratory Desk",

          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,

          notes:
            "Synthetic serum specimen.",
        },
      ],

      processingStartedAt:
        "2026-07-31T09:15:00+08:00",

      processingStartedBy:
        "Synthetic Laboratory Analyst A",

      completedAt: null,
      completedBy: null,

      verifiedAt: null,
      verifiedBy: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-07-31T08:58:00+08:00",

      updatedAt:
        "2026-07-31T09:15:00+08:00",

      updatedBy:
        "Synthetic Laboratory Analyst A",
    },
    {
      id: "mock-lab-order-0002",
      orderNumber:
        "GM-LAB-2026-000002",

      patientId:
        "mock-patient-0004",

      consultationId:
        "mock-consultation-0004",

      consultationNumber:
        "GM-CON-2026-000004",

      branchId: "branch-makati",
      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Elena Reyes",

      priority: "routine",
      source: "consultation",
      status: "completed",

      clinicalIndication:
        "Synthetic respiratory laboratory evaluation.",

      fastingRequired: false,

      patientInstructions: null,

      internalNotes:
        "Synthetic completed laboratory order.",

      items: [
        {
          id:
            "mock-lab-item-0002-cbc",

          testCode: "LAB-CBC",

          testName:
            "Complete Blood Count",

          category: "Hematology",

          specimenType:
            "whole-blood",

          containerType:
            "Lavender-top EDTA tube",

          estimatedTurnaroundMinutes:
            90,

          status: "completed",
        },
        {
          id:
            "mock-lab-item-0002-crp",

          testCode: "LAB-CRP",

          testName:
            "C-Reactive Protein",

          category: "Immunology",

          specimenType: "serum",

          containerType:
            "Serum separator tube",

          estimatedTurnaroundMinutes:
            90,

          status: "completed",
        },
      ],

      specimens: [
        {
          id:
            "mock-lab-specimen-0002-blood",

          accessionNumber:
            "GM-ACC-2026-000003",

          orderItemIds: [
            "mock-lab-item-0002-cbc",
          ],

          specimenType:
            "whole-blood",

          collectionMethod:
            "venipuncture",

          containerType:
            "Lavender-top EDTA tube",

          status: "received",

          collectedAt:
            "2026-07-31T09:20:00+08:00",

          collectedBy:
            "Synthetic Phlebotomist B",

          receivedAt:
            "2026-07-31T09:27:00+08:00",

          receivedBy:
            "GalenMed Laboratory Desk",

          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,

          notes: null,
        },
        {
          id:
            "mock-lab-specimen-0002-serum",

          accessionNumber:
            "GM-ACC-2026-000004",

          orderItemIds: [
            "mock-lab-item-0002-crp",
          ],

          specimenType: "serum",

          collectionMethod:
            "venipuncture",

          containerType:
            "Serum separator tube",

          status: "received",

          collectedAt:
            "2026-07-31T09:21:00+08:00",

          collectedBy:
            "Synthetic Phlebotomist B",

          receivedAt:
            "2026-07-31T09:28:00+08:00",

          receivedBy:
            "GalenMed Laboratory Desk",

          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,

          notes: null,
        },
      ],

      processingStartedAt:
        "2026-07-31T09:32:00+08:00",

      processingStartedBy:
        "Synthetic Laboratory Analyst B",

      completedAt:
        "2026-07-31T10:20:00+08:00",

      completedBy:
        "Synthetic Laboratory Analyst B",

      verifiedAt: null,
      verifiedBy: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-07-31T09:18:00+08:00",

      updatedAt:
        "2026-07-31T10:20:00+08:00",

      updatedBy:
        "Synthetic Laboratory Analyst B",
    },
    {
      id: "mock-lab-order-0003",
      orderNumber:
        "GM-LAB-2026-000003",

      patientId:
        "mock-patient-0007",

      consultationId:
        "mock-consultation-0007",

      consultationNumber:
        "GM-CON-2026-000007",

      branchId: "branch-makati",
      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Rafael Cruz",

      priority: "routine",
      source: "consultation",
      status:
        "specimen-collected",

      clinicalIndication:
        "Synthetic urinalysis results-review workflow.",

      fastingRequired: false,

      patientInstructions:
        "Synthetic clean-catch specimen instruction.",

      internalNotes: null,

      items: [
        {
          id:
            "mock-lab-item-0003-ua",

          testCode: "LAB-UA",

          testName:
            "Routine Urinalysis",

          category:
            "Clinical Microscopy",

          specimenType: "urine",

          containerType:
            "Sterile urine container",

          estimatedTurnaroundMinutes:
            45,

          status: "pending",
        },
      ],

      specimens: [
        {
          id:
            "mock-lab-specimen-0003-urine",

          accessionNumber:
            "GM-ACC-2026-000005",

          orderItemIds: [
            "mock-lab-item-0003-ua",
          ],

          specimenType: "urine",

          collectionMethod:
            "clean-catch-urine",

          containerType:
            "Sterile urine container",

          status: "collected",

          collectedAt:
            "2026-08-01T08:30:00+08:00",

          collectedBy:
            "Synthetic Collector C",

          receivedAt: null,
          receivedBy: null,

          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,

          notes:
            "Synthetic urine specimen awaiting laboratory receipt.",
        },
      ],

      processingStartedAt: null,
      processingStartedBy: null,

      completedAt: null,
      completedBy: null,

      verifiedAt: null,
      verifiedBy: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-08-01T08:20:00+08:00",

      updatedAt:
        "2026-08-01T08:30:00+08:00",

      updatedBy:
        "Synthetic Collector C",
    },
    {
      id: "mock-lab-order-0004",
      orderNumber:
        "GM-LAB-2026-000004",

      patientId:
        "mock-patient-0001",

      consultationId: null,
      consultationNumber: null,

      branchId: "branch-makati",
      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Maria Santos",

      priority: "routine",
      source: "outpatient",
      status: "ordered",

      clinicalIndication:
        "Synthetic outpatient lipid profile request.",

      fastingRequired: true,

      patientInstructions:
        "Synthetic fasting instruction for interface testing.",

      internalNotes: null,

      items: [
        {
          id:
            "mock-lab-item-0004-lipid",

          testCode: "LAB-LIPID",

          testName:
            "Lipid Profile",

          category:
            "Clinical Chemistry",

          specimenType: "serum",

          containerType:
            "Serum separator tube",

          estimatedTurnaroundMinutes:
            120,

          status: "pending",
        },
      ],

      specimens: [],

      processingStartedAt: null,
      processingStartedBy: null,

      completedAt: null,
      completedBy: null,

      verifiedAt: null,
      verifiedBy: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-08-01T09:00:00+08:00",

      updatedAt:
        "2026-08-01T09:00:00+08:00",

      updatedBy:
        "Dr. Maria Santos",
    },
    {
      id: "mock-lab-order-0005",
      orderNumber:
        "GM-LAB-2026-000005",

      patientId:
        "mock-patient-0005",

      consultationId:
        "mock-consultation-0005",

      consultationNumber:
        "GM-CON-2026-000005",

      branchId: "branch-makati",
      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Maria Santos",

      priority: "urgent",
      source: "consultation",
      status: "rejected",

      clinicalIndication:
        "Synthetic urgent hematology request.",

      fastingRequired: false,

      patientInstructions: null,

      internalNotes:
        "Synthetic rejected-specimen workflow example.",

      items: [
        {
          id:
            "mock-lab-item-0005-cbc",

          testCode: "LAB-CBC",

          testName:
            "Complete Blood Count",

          category: "Hematology",

          specimenType:
            "whole-blood",

          containerType:
            "Lavender-top EDTA tube",

          estimatedTurnaroundMinutes:
            90,

          status: "pending",
        },
      ],

      specimens: [
        {
          id:
            "mock-lab-specimen-0005-blood",

          accessionNumber:
            "GM-ACC-2026-000006",

          orderItemIds: [
            "mock-lab-item-0005-cbc",
          ],

          specimenType:
            "whole-blood",

          collectionMethod:
            "venipuncture",

          containerType:
            "Lavender-top EDTA tube",

          status: "rejected",

          collectedAt:
            "2026-08-01T09:10:00+08:00",

          collectedBy:
            "Synthetic Phlebotomist D",

          receivedAt:
            "2026-08-01T09:18:00+08:00",

          receivedBy:
            "GalenMed Laboratory Desk",

          rejectedAt:
            "2026-08-01T09:20:00+08:00",

          rejectedBy:
            "Synthetic Laboratory Analyst D",

          rejectionReason:
            "Synthetic clotted specimen retained for rejection workflow testing.",

          notes: null,
        },
      ],

      processingStartedAt: null,
      processingStartedBy: null,

      completedAt: null,
      completedBy: null,

      verifiedAt: null,
      verifiedBy: null,

      releasedAt: null,
      releasedBy: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      createdAt:
        "2026-08-01T09:05:00+08:00",

      updatedAt:
        "2026-08-01T09:20:00+08:00",

      updatedBy:
        "Synthetic Laboratory Analyst D",
    },
  ]
