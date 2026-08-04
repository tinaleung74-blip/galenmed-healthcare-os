import type {
  RadiologyContrastProtocol,
  RadiologyModality,
  RadiologyOrderFilters,
  RadiologyOrderPriority,
  RadiologyOrderSource,
  RadiologyOrderStatus,
  RadiologyProcedureDefinition,
  RadiologyRoomDefinition,
} from "@/features/radiology/types/radiology.types"

export const RADIOLOGY_ORDER_STATUS_LABELS: Record<
  RadiologyOrderStatus,
  string
> = {
  ordered: "Ordered",
  scheduled: "Scheduled",
  "checked-in": "Checked in",
  ready: "Ready for imaging",
  "in-progress": "Imaging in progress",
  "images-acquired": "Images acquired",
  "technically-completed":
    "Technically completed",
  "report-draft": "Report draft",
  verified: "Radiologist verified",
  released: "Final report released",
  cancelled: "Cancelled",
  "no-show": "No-show",
}

export const RADIOLOGY_ORDER_PRIORITY_LABELS: Record<
  RadiologyOrderPriority,
  string
> = {
  routine: "Routine",
  urgent: "Urgent",
  stat: "STAT",
}

export const RADIOLOGY_ORDER_SOURCE_LABELS: Record<
  RadiologyOrderSource,
  string
> = {
  consultation: "Consultation",
  outpatient: "Outpatient",
  inpatient: "Inpatient",
  emergency: "Emergency",
  "external-referral": "External referral",
}

export const RADIOLOGY_MODALITY_LABELS: Record<
  RadiologyModality,
  string
> = {
  "x-ray": "X-ray",
  ultrasound: "Ultrasound",
  ct: "CT",
  mri: "MRI",
  mammography: "Mammography",
}

export const RADIOLOGY_CONTRAST_PROTOCOL_LABELS: Record<
  RadiologyContrastProtocol,
  string
> = {
  "not-required": "Not required",
  "without-contrast": "Without contrast",
  "with-contrast": "With contrast",
  "with-and-without-contrast":
    "With and without contrast",
}

export const RADIOLOGY_DATE_VIEW_LABELS = {
  day: "Selected date",
  "next-7-days": "Next seven days",
  all: "All radiology orders",
} as const

export const RADIOLOGY_OPERATIONS_ACTOR =
  "GalenMed Radiology Desk"

export const DEFAULT_RADIOLOGY_ORDER_FILTERS: RadiologyOrderFilters =
  {
    search: "",
    status: "all",
    priority: "all",
    modality: "all",
    source: "all",
    branchId: "all",
    dateView: "day",
    selectedDate: "2026-08-04",
  }

export const RADIOLOGY_ROOMS = [
  {
    id: "radiology-room-xray-01",
    name: "X-ray Room 1",
    branchId: "branch-makati",
    supportedModalities: [
      "x-ray",
    ],
  },
  {
    id: "radiology-room-ultrasound-01",
    name: "Ultrasound Room 1",
    branchId: "branch-makati",
    supportedModalities: [
      "ultrasound",
    ],
  },
  {
    id: "radiology-room-ct-01",
    name: "CT Suite 1",
    branchId: "branch-makati",
    supportedModalities: [
      "ct",
    ],
  },
  {
    id: "radiology-room-mri-01",
    name: "MRI Suite 1",
    branchId: "branch-makati",
    supportedModalities: [
      "mri",
    ],
  },
  {
    id: "radiology-room-mammography-01",
    name: "Mammography Room 1",
    branchId: "branch-makati",
    supportedModalities: [
      "mammography",
    ],
  },
] as const satisfies readonly RadiologyRoomDefinition[]

/**
 * Synthetic development procedure catalog.
 *
 * Durations, preparation requirements, contrast
 * protocols, and screening rules are not approved
 * production radiology master data.
 */
export const RADIOLOGY_PROCEDURE_CATALOG = [
  {
    code: "RAD-XR-CHEST-2V",
    name:
      "Chest Radiograph — PA and Lateral",

    modality: "x-ray",
    bodyRegion: "Chest",

    defaultDurationMinutes: 20,

    contrastProtocol:
      "not-required",

    requiresFasting: false,

    requiresPregnancyScreening: true,

    requiresRenalFunctionReview: false,

    preparationItems: [
      {
        code: "identity-confirmed",
        label:
          "Patient identity confirmed",
        required: true,
      },
      {
        code: "pregnancy-screening",
        label:
          "Pregnancy screening completed when applicable",
        required: true,
      },
      {
        code: "remove-metal",
        label:
          "Metal objects removed from imaging field",
        required: true,
      },
    ],
  },
  {
    code: "RAD-US-ABD-COMPLETE",
    name:
      "Complete Abdominal Ultrasound",

    modality: "ultrasound",
    bodyRegion: "Abdomen",

    defaultDurationMinutes: 45,

    contrastProtocol:
      "not-required",

    requiresFasting: true,

    requiresPregnancyScreening: false,

    requiresRenalFunctionReview: false,

    preparationItems: [
      {
        code: "identity-confirmed",
        label:
          "Patient identity confirmed",
        required: true,
      },
      {
        code: "fasting-confirmed",
        label:
          "Synthetic fasting preparation confirmed",
        required: true,
      },
      {
        code: "procedure-explained",
        label:
          "Procedure explained to patient",
        required: true,
      },
    ],
  },
  {
    code: "RAD-CT-BRAIN-NC",
    name:
      "CT Brain Without Contrast",

    modality: "ct",
    bodyRegion: "Head",

    defaultDurationMinutes: 30,

    contrastProtocol:
      "without-contrast",

    requiresFasting: false,

    requiresPregnancyScreening: true,

    requiresRenalFunctionReview: false,

    preparationItems: [
      {
        code: "identity-confirmed",
        label:
          "Patient identity confirmed",
        required: true,
      },
      {
        code: "pregnancy-screening",
        label:
          "Pregnancy screening completed when applicable",
        required: true,
      },
      {
        code: "remove-metal",
        label:
          "Removable metal objects cleared",
        required: true,
      },
    ],
  },
  {
    code: "RAD-CT-CHEST-CONTRAST",
    name:
      "CT Chest With Contrast",

    modality: "ct",
    bodyRegion: "Chest",

    defaultDurationMinutes: 45,

    contrastProtocol:
      "with-contrast",

    requiresFasting: true,

    requiresPregnancyScreening: true,

    requiresRenalFunctionReview: true,

    preparationItems: [
      {
        code: "identity-confirmed",
        label:
          "Patient identity confirmed",
        required: true,
      },
      {
        code: "contrast-allergy-review",
        label:
          "Contrast allergy review completed",
        required: true,
      },
      {
        code: "renal-function-review",
        label:
          "Renal-function review completed",
        required: true,
      },
      {
        code: "pregnancy-screening",
        label:
          "Pregnancy screening completed when applicable",
        required: true,
      },
      {
        code: "fasting-confirmed",
        label:
          "Synthetic fasting preparation confirmed",
        required: true,
      },
    ],
  },
  {
    code: "RAD-MRI-BRAIN-NC",
    name:
      "MRI Brain Without Contrast",

    modality: "mri",
    bodyRegion: "Brain",

    defaultDurationMinutes: 45,

    contrastProtocol:
      "without-contrast",

    requiresFasting: false,

    requiresPregnancyScreening: true,

    requiresRenalFunctionReview: false,

    preparationItems: [
      {
        code: "identity-confirmed",
        label:
          "Patient identity confirmed",
        required: true,
      },
      {
        code: "mri-metal-screening",
        label:
          "MRI metal and implant screening completed",
        required: true,
      },
      {
        code: "claustrophobia-screening",
        label:
          "Claustrophobia screening completed",
        required: true,
      },
      {
        code: "pregnancy-screening",
        label:
          "Pregnancy screening completed when applicable",
        required: true,
      },
    ],
  },
  {
    code: "RAD-MAMMO-BILATERAL",
    name:
      "Bilateral Screening Mammography",

    modality: "mammography",
    bodyRegion: "Breast",

    defaultDurationMinutes: 30,

    contrastProtocol:
      "not-required",

    requiresFasting: false,

    requiresPregnancyScreening: true,

    requiresRenalFunctionReview: false,

    preparationItems: [
      {
        code: "identity-confirmed",
        label:
          "Patient identity confirmed",
        required: true,
      },
      {
        code: "pregnancy-screening",
        label:
          "Pregnancy screening completed when applicable",
        required: true,
      },
      {
        code: "deodorant-removal",
        label:
          "Deodorant, powder, and lotion removal confirmed",
        required: true,
      },
    ],
  },
] as const satisfies readonly RadiologyProcedureDefinition[]
