import type {
  PharmacyAuditEventAction,
  PharmacyAuditEventCategory,
  PharmacyAuditFilters,
} from "@/features/pharmacy/types/pharmacy-audit.types"

export const PHARMACY_AUDIT_CATEGORY_LABELS: Record<
  PharmacyAuditEventCategory,
  string
> = {
  prescription: "Prescription",
  "safety-review": "Safety Review",
  dispensing: "Medication Dispensing",
  verification: "Pharmacist Verification",
  counseling: "Medication Counseling",
  release: "Medication Release",
}

export const PHARMACY_AUDIT_ACTION_LABELS: Record<
  PharmacyAuditEventAction,
  string
> = {
  created: "Created",
  "allergy-reviewed": "Allergy reviewed",
  "interaction-reviewed":
    "Interaction reviewed",
  dispensed: "Medication dispensed",
  "pharmacist-verified":
    "Pharmacist verified",
  "counseling-completed":
    "Counseling completed",
  released: "Released",
  cancelled: "Cancelled",
}

export const DEFAULT_PHARMACY_AUDIT_FILTERS: PharmacyAuditFilters =
  {
    search: "",
    category: "all",
    action: "all",
  }

export const PHARMACY_AUDIT_INITIAL_VISIBLE_EVENTS =
  15
