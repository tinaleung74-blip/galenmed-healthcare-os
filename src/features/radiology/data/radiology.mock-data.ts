import {
  RADIOLOGY_PROCEDURE_CATALOG,
} from "@/features/radiology/constants/radiology.constants"
import type {
  RadiologyOrder,
  RadiologyPreparationChecklistItem,
} from "@/features/radiology/types/radiology.types"

function createMockChecklist(
  orderPrefix: string,
  procedureCode: string,
  completedCodes:
    readonly string[],
  completedAt: string | null,
  completedBy: string | null
): RadiologyPreparationChecklistItem[] {
  const procedure =
    RADIOLOGY_PROCEDURE_CATALOG.find(
      (candidateProcedure) =>
        candidateProcedure.code ===
        procedureCode
    )

  if (!procedure) {
    throw new Error(
      `Unknown synthetic radiology procedure: ${procedureCode}.`
    )
  }

  const completedCodeSet =
    new Set(completedCodes)

  return procedure.preparationItems.map(
    (item, index) => {
      const completed =
        completedCodeSet.has(
          item.code
        )

      return {
        id:
          `${orderPrefix}-preparation-${index + 1}`,

        code: item.code,
        label: item.label,
        required: item.required,

        completed,

        completedAt:
          completed
            ? completedAt
            : null,

        completedBy:
          completed
            ? completedBy
            : null,

        notes: null,
      }
    }
  )
}

/**
 * All radiology orders, schedules, rooms,
 * preparation records, clinicians, and
 * timestamps in this file are synthetic
 * development data.
 */
export const MOCK_RADIOLOGY_ORDERS: readonly RadiologyOrder[] =
  [
    {
      id:
        "mock-radiology-order-0001",

      orderNumber:
        "GM-RAD-2026-000001",

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

      orderedByName:
        "Dr. Rafael Cruz",

      priority: "urgent",
      source: "consultation",
      status: "scheduled",

      procedureCode:
        "RAD-CT-BRAIN-NC",

      procedureName:
        "CT Brain Without Contrast",

      modality: "ct",
      bodyRegion: "Head",

      contrastProtocol:
        "without-contrast",

      clinicalIndication:
        "Synthetic persistent dizziness imaging evaluation.",

      specialInstructions:
        "Synthetic neurologic imaging workflow.",

      requiresFasting: false,

      requiresPregnancyScreening:
        true,

      requiresRenalFunctionReview:
        false,

      preparationChecklist:
        createMockChecklist(
          "mock-radiology-order-0001",
          "RAD-CT-BRAIN-NC",
          [],
          null,
          null
        ),

      scheduledStartAt:
        "2026-08-04T08:00:00+08:00",

      scheduledEndAt:
        "2026-08-04T08:30:00+08:00",

      durationMinutes: 30,

      roomId:
        "radiology-room-ct-01",

      roomName:
        "CT Suite 1",

      schedulingNotes:
        "Synthetic urgent CT schedule.",

      checkedInAt: null,
      checkedInBy: null,

      readyAt: null,
      readyBy: null,

      imagingStartedAt: null,
      imagingStartedBy: null,

      imagesAcquiredAt: null,
      imagesAcquiredBy: null,

      technicalCompletedAt: null,
      technicalCompletedBy: null,

      reportId: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdAt:
        "2026-08-03T14:00:00+08:00",

      updatedAt:
        "2026-08-03T14:15:00+08:00",

      updatedBy:
        "GalenMed Radiology Desk",
    },
    {
      id:
        "mock-radiology-order-0002",

      orderNumber:
        "GM-RAD-2026-000002",

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

      orderedByName:
        "Dr. Elena Reyes",

      priority: "routine",
      source: "consultation",
      status: "checked-in",

      procedureCode:
        "RAD-XR-CHEST-2V",

      procedureName:
        "Chest Radiograph — PA and Lateral",

      modality: "x-ray",
      bodyRegion: "Chest",

      contrastProtocol:
        "not-required",

      clinicalIndication:
        "Synthetic respiratory imaging assessment.",

      specialInstructions: null,

      requiresFasting: false,

      requiresPregnancyScreening:
        true,

      requiresRenalFunctionReview:
        false,

      preparationChecklist:
        createMockChecklist(
          "mock-radiology-order-0002",
          "RAD-XR-CHEST-2V",
          [
            "identity-confirmed",
          ],
          "2026-08-04T08:22:00+08:00",
          "Synthetic Radiology Staff A"
        ),

      scheduledStartAt:
        "2026-08-04T08:30:00+08:00",

      scheduledEndAt:
        "2026-08-04T08:50:00+08:00",

      durationMinutes: 20,

      roomId:
        "radiology-room-xray-01",

      roomName:
        "X-ray Room 1",

      schedulingNotes: null,

      checkedInAt:
        "2026-08-04T08:18:00+08:00",

      checkedInBy:
        "GalenMed Radiology Desk",

      readyAt: null,
      readyBy: null,

      imagingStartedAt: null,
      imagingStartedBy: null,

      imagesAcquiredAt: null,
      imagesAcquiredBy: null,

      technicalCompletedAt: null,
      technicalCompletedBy: null,

      reportId: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdAt:
        "2026-08-03T15:00:00+08:00",

      updatedAt:
        "2026-08-04T08:22:00+08:00",

      updatedBy:
        "Synthetic Radiology Staff A",
    },
    {
      id:
        "mock-radiology-order-0003",

      orderNumber:
        "GM-RAD-2026-000003",

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

      orderedByName:
        "Dr. Maria Santos",

      priority: "routine",
      source: "consultation",
      status: "ready",

      procedureCode:
        "RAD-US-ABD-COMPLETE",

      procedureName:
        "Complete Abdominal Ultrasound",

      modality: "ultrasound",
      bodyRegion: "Abdomen",

      contrastProtocol:
        "not-required",

      clinicalIndication:
        "Synthetic abdominal discomfort imaging request.",

      specialInstructions:
        "Synthetic fasting preparation confirmed.",

      requiresFasting: true,

      requiresPregnancyScreening:
        false,

      requiresRenalFunctionReview:
        false,

      preparationChecklist:
        createMockChecklist(
          "mock-radiology-order-0003",
          "RAD-US-ABD-COMPLETE",
          [
            "identity-confirmed",
            "fasting-confirmed",
            "procedure-explained",
          ],
          "2026-08-04T08:55:00+08:00",
          "Synthetic Radiology Staff B"
        ),

      scheduledStartAt:
        "2026-08-04T09:00:00+08:00",

      scheduledEndAt:
        "2026-08-04T09:45:00+08:00",

      durationMinutes: 45,

      roomId:
        "radiology-room-ultrasound-01",

      roomName:
        "Ultrasound Room 1",

      schedulingNotes: null,

      checkedInAt:
        "2026-08-04T08:45:00+08:00",

      checkedInBy:
        "GalenMed Radiology Desk",

      readyAt:
        "2026-08-04T08:56:00+08:00",

      readyBy:
        "Synthetic Radiology Staff B",

      imagingStartedAt: null,
      imagingStartedBy: null,

      imagesAcquiredAt: null,
      imagesAcquiredBy: null,

      technicalCompletedAt: null,
      technicalCompletedBy: null,

      reportId: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdAt:
        "2026-08-03T15:30:00+08:00",

      updatedAt:
        "2026-08-04T08:56:00+08:00",

      updatedBy:
        "Synthetic Radiology Staff B",
    },
    {
      id:
        "mock-radiology-order-0004",

      orderNumber:
        "GM-RAD-2026-000004",

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

      orderedByName:
        "Dr. Rafael Cruz",

      priority: "routine",
      source: "consultation",
      status: "in-progress",

      procedureCode:
        "RAD-MRI-BRAIN-NC",

      procedureName:
        "MRI Brain Without Contrast",

      modality: "mri",
      bodyRegion: "Brain",

      contrastProtocol:
        "without-contrast",

      clinicalIndication:
        "Synthetic neurologic MRI workflow.",

      specialInstructions: null,

      requiresFasting: false,

      requiresPregnancyScreening:
        true,

      requiresRenalFunctionReview:
        false,

      preparationChecklist:
        createMockChecklist(
          "mock-radiology-order-0004",
          "RAD-MRI-BRAIN-NC",
          [
            "identity-confirmed",
            "mri-metal-screening",
            "claustrophobia-screening",
            "pregnancy-screening",
          ],
          "2026-08-04T09:10:00+08:00",
          "Synthetic MRI Technologist"
        ),

      scheduledStartAt:
        "2026-08-04T09:15:00+08:00",

      scheduledEndAt:
        "2026-08-04T10:00:00+08:00",

      durationMinutes: 45,

      roomId:
        "radiology-room-mri-01",

      roomName:
        "MRI Suite 1",

      schedulingNotes: null,

      checkedInAt:
        "2026-08-04T08:58:00+08:00",

      checkedInBy:
        "GalenMed Radiology Desk",

      readyAt:
        "2026-08-04T09:10:00+08:00",

      readyBy:
        "Synthetic MRI Technologist",

      imagingStartedAt:
        "2026-08-04T09:16:00+08:00",

      imagingStartedBy:
        "Synthetic MRI Technologist",

      imagesAcquiredAt: null,
      imagesAcquiredBy: null,

      technicalCompletedAt: null,
      technicalCompletedBy: null,

      reportId: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdAt:
        "2026-08-03T16:00:00+08:00",

      updatedAt:
        "2026-08-04T09:16:00+08:00",

      updatedBy:
        "Synthetic MRI Technologist",
    },
    {
      id:
        "mock-radiology-order-0005",

      orderNumber:
        "GM-RAD-2026-000005",

      patientId:
        "mock-patient-0001",

      consultationId: null,
      consultationNumber: null,

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Maria Santos",

      priority: "stat",
      source: "emergency",
      status: "images-acquired",

      procedureCode:
        "RAD-CT-CHEST-CONTRAST",

      procedureName:
        "CT Chest With Contrast",

      modality: "ct",
      bodyRegion: "Chest",

      contrastProtocol:
        "with-contrast",

      clinicalIndication:
        "Synthetic emergency chest imaging workflow.",

      specialInstructions:
        "Synthetic contrast workflow. No real contrast was administered.",

      requiresFasting: true,

      requiresPregnancyScreening:
        true,

      requiresRenalFunctionReview:
        true,

      preparationChecklist:
        createMockChecklist(
          "mock-radiology-order-0005",
          "RAD-CT-CHEST-CONTRAST",
          [
            "identity-confirmed",
            "contrast-allergy-review",
            "renal-function-review",
            "pregnancy-screening",
            "fasting-confirmed",
          ],
          "2026-08-04T09:55:00+08:00",
          "Synthetic CT Technologist"
        ),

      scheduledStartAt:
        "2026-08-04T10:00:00+08:00",

      scheduledEndAt:
        "2026-08-04T10:45:00+08:00",

      durationMinutes: 45,

      roomId:
        "radiology-room-ct-01",

      roomName:
        "CT Suite 1",

      schedulingNotes:
        "Synthetic STAT CT slot.",

      checkedInAt:
        "2026-08-04T09:40:00+08:00",

      checkedInBy:
        "GalenMed Radiology Desk",

      readyAt:
        "2026-08-04T09:55:00+08:00",

      readyBy:
        "Synthetic CT Technologist",

      imagingStartedAt:
        "2026-08-04T10:02:00+08:00",

      imagingStartedBy:
        "Synthetic CT Technologist",

      imagesAcquiredAt:
        "2026-08-04T10:28:00+08:00",

      imagesAcquiredBy:
        "Synthetic CT Technologist",

      technicalCompletedAt: null,
      technicalCompletedBy: null,

      reportId: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdAt:
        "2026-08-04T09:30:00+08:00",

      updatedAt:
        "2026-08-04T10:28:00+08:00",

      updatedBy:
        "Synthetic CT Technologist",
    },
    {
      id:
        "mock-radiology-order-0006",

      orderNumber:
        "GM-RAD-2026-000006",

      patientId:
        "mock-patient-0008",

      consultationId: null,
      consultationNumber: null,

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Elena Reyes",

      priority: "routine",
      source: "outpatient",

      status:
        "technically-completed",

      procedureCode:
        "RAD-MAMMO-BILATERAL",

      procedureName:
        "Bilateral Screening Mammography",

      modality: "mammography",
      bodyRegion: "Breast",

      contrastProtocol:
        "not-required",

      clinicalIndication:
        "Synthetic screening mammography workflow.",

      specialInstructions: null,

      requiresFasting: false,

      requiresPregnancyScreening:
        true,

      requiresRenalFunctionReview:
        false,

      preparationChecklist:
        createMockChecklist(
          "mock-radiology-order-0006",
          "RAD-MAMMO-BILATERAL",
          [
            "identity-confirmed",
            "pregnancy-screening",
            "deodorant-removal",
          ],
          "2026-08-04T10:25:00+08:00",
          "Synthetic Mammography Technologist"
        ),

      scheduledStartAt:
        "2026-08-04T10:30:00+08:00",

      scheduledEndAt:
        "2026-08-04T11:00:00+08:00",

      durationMinutes: 30,

      roomId:
        "radiology-room-mammography-01",

      roomName:
        "Mammography Room 1",

      schedulingNotes: null,

      checkedInAt:
        "2026-08-04T10:15:00+08:00",

      checkedInBy:
        "GalenMed Radiology Desk",

      readyAt:
        "2026-08-04T10:25:00+08:00",

      readyBy:
        "Synthetic Mammography Technologist",

      imagingStartedAt:
        "2026-08-04T10:31:00+08:00",

      imagingStartedBy:
        "Synthetic Mammography Technologist",

      imagesAcquiredAt:
        "2026-08-04T10:50:00+08:00",

      imagesAcquiredBy:
        "Synthetic Mammography Technologist",

      technicalCompletedAt:
        "2026-08-04T10:55:00+08:00",

      technicalCompletedBy:
        "Synthetic Mammography Technologist",

      reportId: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdAt:
        "2026-08-02T11:00:00+08:00",

      updatedAt:
        "2026-08-04T10:55:00+08:00",

      updatedBy:
        "Synthetic Mammography Technologist",
    },
    {
      id:
        "mock-radiology-order-0007",

      orderNumber:
        "GM-RAD-2026-000007",

      patientId:
        "mock-patient-0013",

      consultationId: null,
      consultationNumber: null,

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Maria Santos",

      priority: "routine",
      source: "outpatient",
      status: "ordered",

      procedureCode:
        "RAD-US-ABD-COMPLETE",

      procedureName:
        "Complete Abdominal Ultrasound",

      modality: "ultrasound",
      bodyRegion: "Abdomen",

      contrastProtocol:
        "not-required",

      clinicalIndication:
        "Synthetic outpatient abdominal ultrasound request.",

      specialInstructions:
        "Schedule on or after August 5, 2026.",

      requiresFasting: true,

      requiresPregnancyScreening:
        false,

      requiresRenalFunctionReview:
        false,

      preparationChecklist:
        createMockChecklist(
          "mock-radiology-order-0007",
          "RAD-US-ABD-COMPLETE",
          [],
          null,
          null
        ),

      scheduledStartAt: null,
      scheduledEndAt: null,
      durationMinutes: null,

      roomId: null,
      roomName: null,

      schedulingNotes: null,

      checkedInAt: null,
      checkedInBy: null,

      readyAt: null,
      readyBy: null,

      imagingStartedAt: null,
      imagingStartedBy: null,

      imagesAcquiredAt: null,
      imagesAcquiredBy: null,

      technicalCompletedAt: null,
      technicalCompletedBy: null,

      reportId: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt: null,
      noShowMarkedBy: null,

      createdAt:
        "2026-08-04T11:15:00+08:00",

      updatedAt:
        "2026-08-04T11:15:00+08:00",

      updatedBy:
        "Dr. Maria Santos",
    },
    {
      id:
        "mock-radiology-order-0008",

      orderNumber:
        "GM-RAD-2026-000008",

      patientId:
        "mock-patient-0014",

      consultationId: null,
      consultationNumber: null,

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      orderedByName:
        "Dr. Elena Reyes",

      priority: "routine",
      source: "outpatient",
      status: "no-show",

      procedureCode:
        "RAD-XR-CHEST-2V",

      procedureName:
        "Chest Radiograph — PA and Lateral",

      modality: "x-ray",
      bodyRegion: "Chest",

      contrastProtocol:
        "not-required",

      clinicalIndication:
        "Synthetic outpatient chest radiograph request.",

      specialInstructions: null,

      requiresFasting: false,

      requiresPregnancyScreening:
        true,

      requiresRenalFunctionReview:
        false,

      preparationChecklist:
        createMockChecklist(
          "mock-radiology-order-0008",
          "RAD-XR-CHEST-2V",
          [],
          null,
          null
        ),

      scheduledStartAt:
        "2026-08-04T11:00:00+08:00",

      scheduledEndAt:
        "2026-08-04T11:20:00+08:00",

      durationMinutes: 20,

      roomId:
        "radiology-room-xray-01",

      roomName:
        "X-ray Room 1",

      schedulingNotes: null,

      checkedInAt: null,
      checkedInBy: null,

      readyAt: null,
      readyBy: null,

      imagingStartedAt: null,
      imagingStartedBy: null,

      imagesAcquiredAt: null,
      imagesAcquiredBy: null,

      technicalCompletedAt: null,
      technicalCompletedBy: null,

      reportId: null,

      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,

      noShowAt:
        "2026-08-04T11:20:00+08:00",

      noShowMarkedBy:
        "GalenMed Radiology Desk",

      createdAt:
        "2026-08-03T13:00:00+08:00",

      updatedAt:
        "2026-08-04T11:20:00+08:00",

      updatedBy:
        "GalenMed Radiology Desk",
    },
  ]
