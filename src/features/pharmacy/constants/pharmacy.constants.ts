import type {
  PharmacyDateView,
  PharmacyDosageForm,
  PharmacyInventoryStatus,
  PharmacyMedicationDefinition,
  PharmacyMedicationRoute,
  PharmacyPrescriptionFilters,
  PharmacyPrescriptionItemStatus,
  PharmacyPrescriptionPriority,
  PharmacyPrescriptionSource,
  PharmacyPrescriptionStatus,
  PharmacyReviewStatus,
} from "@/features/pharmacy/types/pharmacy.types"

export const PHARMACY_PRESCRIPTION_STATUS_LABELS: Record<
  PharmacyPrescriptionStatus,
  string
> = {
  received: "Received",
  "pending-review": "Pending review",
  "on-hold": "On hold",
  approved: "Approved for dispensing",
  "partially-dispensed": "Partially dispensed",
  dispensed: "Dispensed",
  cancelled: "Cancelled",
}

export const PHARMACY_PRESCRIPTION_PRIORITY_LABELS: Record<
  PharmacyPrescriptionPriority,
  string
> = {
  routine: "Routine",
  urgent: "Urgent",
  stat: "STAT",
}

export const PHARMACY_PRESCRIPTION_SOURCE_LABELS: Record<
  PharmacyPrescriptionSource,
  string
> = {
  consultation: "Consultation",
  outpatient: "Outpatient",
  inpatient: "Inpatient",
  emergency: "Emergency",
  "external-prescription": "External prescription",
}

export const PHARMACY_REVIEW_STATUS_LABELS: Record<
  PharmacyReviewStatus,
  string
> = {
  pending: "Pending",
  clear: "Clear",
  warning: "Warning",
  blocked: "Blocked",
  "not-applicable": "Not applicable",
}

export const PHARMACY_DOSAGE_FORM_LABELS: Record<
  PharmacyDosageForm,
  string
> = {
  tablet: "Tablet",
  capsule: "Capsule",
  syrup: "Syrup",
  suspension: "Suspension",
  solution: "Solution",
  cream: "Cream",
  ointment: "Ointment",
  inhaler: "Inhaler",
  injection: "Injection",
  sachet: "Sachet",
}

export const PHARMACY_MEDICATION_ROUTE_LABELS: Record<
  PharmacyMedicationRoute,
  string
> = {
  oral: "Oral",
  topical: "Topical",
  inhalation: "Inhalation",
  intramuscular: "Intramuscular",
  intravenous: "Intravenous",
  subcutaneous: "Subcutaneous",
  ophthalmic: "Ophthalmic",
  otic: "Otic",
  nasal: "Nasal",
  rectal: "Rectal",
}

export const PHARMACY_INVENTORY_STATUS_LABELS: Record<
  PharmacyInventoryStatus,
  string
> = {
  available: "Available",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock",
  inactive: "Inactive",
}

export const PHARMACY_PRESCRIPTION_ITEM_STATUS_LABELS: Record<
  PharmacyPrescriptionItemStatus,
  string
> = {
  pending: "Pending",
  "partially-dispensed": "Partially dispensed",
  dispensed: "Dispensed",
  cancelled: "Cancelled",
}

export const PHARMACY_DATE_VIEW_LABELS: Record<
  PharmacyDateView,
  string
> = {
  day: "Selected date",
  "last-7-days": "Last seven days",
  all: "All prescriptions",
}

export const PHARMACY_OPERATIONS_ACTOR =
  "GalenMed Pharmacy Desk"

export const PHARMACY_DEFAULT_FILTERS: PharmacyPrescriptionFilters =
  {
    search: "",
    status: "all",
    priority: "all",
    source: "all",
    allergyReviewStatus: "all",
    inventoryStatus: "all",
    branchId: "all",
    dateView: "day",
    selectedDate: "2026-08-04",
  }

/**
 * Synthetic medication catalog for development
 * workflow and interface testing only.
 *
 * It is not a prescribing guide, production
 * formulary, or medication recommendation.
 */
export const PHARMACY_MEDICATION_CATALOG = [
  {
    id: "medication-paracetamol-500-tablet",
    sku: "MED-PARA-500-TAB",

    genericName: "Paracetamol",
    brandName: null,

    strength: "500 mg",
    dosageForm: "tablet",
    defaultRoute: "oral",

    unitOfMeasure: "tablet",

    requiresPrescription: false,
    controlledSubstance: false,

    active: true,
  },
  {
    id: "medication-amoxicillin-500-capsule",
    sku: "MED-AMOX-500-CAP",

    genericName: "Amoxicillin",
    brandName: null,

    strength: "500 mg",
    dosageForm: "capsule",
    defaultRoute: "oral",

    unitOfMeasure: "capsule",

    requiresPrescription: true,
    controlledSubstance: false,

    active: true,
  },
  {
    id: "medication-cetirizine-10-tablet",
    sku: "MED-CETI-10-TAB",

    genericName: "Cetirizine",
    brandName: null,

    strength: "10 mg",
    dosageForm: "tablet",
    defaultRoute: "oral",

    unitOfMeasure: "tablet",

    requiresPrescription: false,
    controlledSubstance: false,

    active: true,
  },
  {
    id: "medication-omeprazole-20-capsule",
    sku: "MED-OMEP-20-CAP",

    genericName: "Omeprazole",
    brandName: null,

    strength: "20 mg",
    dosageForm: "capsule",
    defaultRoute: "oral",

    unitOfMeasure: "capsule",

    requiresPrescription: true,
    controlledSubstance: false,

    active: true,
  },
  {
    id: "medication-metformin-500-tablet",
    sku: "MED-METF-500-TAB",

    genericName: "Metformin",
    brandName: null,

    strength: "500 mg",
    dosageForm: "tablet",
    defaultRoute: "oral",

    unitOfMeasure: "tablet",

    requiresPrescription: true,
    controlledSubstance: false,

    active: true,
  },
  {
    id: "medication-salbutamol-inhaler",
    sku: "MED-SALB-100-INH",

    genericName: "Salbutamol",
    brandName: null,

    strength: "100 mcg per actuation",
    dosageForm: "inhaler",
    defaultRoute: "inhalation",

    unitOfMeasure: "inhaler",

    requiresPrescription: true,
    controlledSubstance: false,

    active: true,
  },
  {
    id: "medication-oral-rehydration-salts",
    sku: "MED-ORS-SACHET",

    genericName: "Oral Rehydration Salts",
    brandName: null,

    strength: "Standard sachet",
    dosageForm: "sachet",
    defaultRoute: "oral",

    unitOfMeasure: "sachet",

    requiresPrescription: false,
    controlledSubstance: false,

    active: true,
  },
  {
    id: "medication-mupirocin-ointment",
    sku: "MED-MUPI-2-OINT",

    genericName: "Mupirocin",
    brandName: null,

    strength: "2%",
    dosageForm: "ointment",
    defaultRoute: "topical",

    unitOfMeasure: "tube",

    requiresPrescription: true,
    controlledSubstance: false,

    active: true,
  },
] as const satisfies readonly PharmacyMedicationDefinition[]
