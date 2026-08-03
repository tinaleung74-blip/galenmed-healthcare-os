import type {
  LaboratoryCollectionMethod,
  LaboratoryOrderFilters,
  LaboratoryOrderItemStatus,
  LaboratoryOrderPriority,
  LaboratoryOrderSource,
  LaboratoryOrderStatus,
  LaboratorySpecimenStatus,
  LaboratorySpecimenType,
  LaboratoryTestDefinition,
} from "@/features/laboratory/types/laboratory.types"

export const LABORATORY_ORDER_STATUS_LABELS: Record<
  LaboratoryOrderStatus,
  string
> = {
  ordered: "Ordered",
  "specimen-collected": "Specimen collected",
  received: "Received",
  "in-process": "In process",
  completed: "Completed",
  verified: "Technically verified",
  released: "Released",
  rejected: "Specimen rejected",
  cancelled: "Cancelled",
}

export const LABORATORY_ORDER_PRIORITY_LABELS: Record<
  LaboratoryOrderPriority,
  string
> = {
  routine: "Routine",
  urgent: "Urgent",
  stat: "STAT",
}

export const LABORATORY_ORDER_SOURCE_LABELS: Record<
  LaboratoryOrderSource,
  string
> = {
  consultation: "Consultation",
  outpatient: "Outpatient",
  inpatient: "Inpatient",
  "external-referral": "External referral",
}

export const LABORATORY_SPECIMEN_TYPE_LABELS: Record<
  LaboratorySpecimenType,
  string
> = {
  "whole-blood": "Whole blood",
  serum: "Serum",
  plasma: "Plasma",
  urine: "Urine",
  stool: "Stool",
  swab: "Swab",
  sputum: "Sputum",
  tissue: "Tissue",
  other: "Other",
}

export const LABORATORY_COLLECTION_METHOD_LABELS: Record<
  LaboratoryCollectionMethod,
  string
> = {
  venipuncture: "Venipuncture",
  capillary: "Capillary collection",
  "clean-catch-urine": "Clean-catch urine",
  "midstream-urine": "Midstream urine",
  swab: "Swab collection",
  expectoration: "Expectoration",
  other: "Other",
}

export const LABORATORY_SPECIMEN_STATUS_LABELS: Record<
  LaboratorySpecimenStatus,
  string
> = {
  collected: "Collected",
  received: "Received",
  rejected: "Rejected",
}

export const LABORATORY_ORDER_ITEM_STATUS_LABELS: Record<
  LaboratoryOrderItemStatus,
  string
> = {
  pending: "Pending",
  "in-process": "In process",
  completed: "Completed",
  verified: "Verified",
  released: "Released",
  cancelled: "Cancelled",
}

export const LABORATORY_DATE_VIEW_LABELS = {
  day: "Selected date",
  "last-7-days": "Last seven days",
  all: "All laboratory orders",
} as const

export const DEFAULT_LABORATORY_ORDER_FILTERS: LaboratoryOrderFilters =
  {
    search: "",
    status: "all",
    priority: "all",
    source: "all",
    branchId: "all",
    dateView: "day",
    selectedDate: "2026-08-01",
  }

export const LABORATORY_PROCESSING_ACTOR =
  "GalenMed Laboratory Desk"

export const LABORATORY_TEST_CATALOG = [
  {
    code: "LAB-CBC",
    name: "Complete Blood Count",
    category: "Hematology",

    specimenType: "whole-blood",

    defaultContainer:
      "Lavender-top EDTA tube",

    estimatedTurnaroundMinutes: 90,

    requiresFasting: false,
  },
  {
    code: "LAB-FBS",
    name: "Fasting Blood Sugar",
    category: "Clinical Chemistry",

    specimenType: "serum",

    defaultContainer:
      "Serum separator tube",

    estimatedTurnaroundMinutes: 60,

    requiresFasting: true,
  },
  {
    code: "LAB-HBA1C",
    name: "Hemoglobin A1c",
    category: "Clinical Chemistry",

    specimenType: "whole-blood",

    defaultContainer:
      "Lavender-top EDTA tube",

    estimatedTurnaroundMinutes: 120,

    requiresFasting: false,
  },
  {
    code: "LAB-LIPID",
    name: "Lipid Profile",
    category: "Clinical Chemistry",

    specimenType: "serum",

    defaultContainer:
      "Serum separator tube",

    estimatedTurnaroundMinutes: 120,

    requiresFasting: true,
  },
  {
    code: "LAB-CREAT",
    name: "Serum Creatinine",
    category: "Clinical Chemistry",

    specimenType: "serum",

    defaultContainer:
      "Serum separator tube",

    estimatedTurnaroundMinutes: 60,

    requiresFasting: false,
  },
  {
    code: "LAB-ALT",
    name: "Alanine Aminotransferase",
    category: "Clinical Chemistry",

    specimenType: "serum",

    defaultContainer:
      "Serum separator tube",

    estimatedTurnaroundMinutes: 60,

    requiresFasting: false,
  },
  {
    code: "LAB-UA",
    name: "Routine Urinalysis",
    category: "Clinical Microscopy",

    specimenType: "urine",

    defaultContainer:
      "Sterile urine container",

    estimatedTurnaroundMinutes: 45,

    requiresFasting: false,
  },
  {
    code: "LAB-CRP",
    name: "C-Reactive Protein",
    category: "Immunology",

    specimenType: "serum",

    defaultContainer:
      "Serum separator tube",

    estimatedTurnaroundMinutes: 90,

    requiresFasting: false,
  },
] as const satisfies readonly LaboratoryTestDefinition[]
