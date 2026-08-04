import type {
  LaboratoryAuditEventAction,
  LaboratoryAuditEventCategory,
  LaboratoryAuditFilters,
} from "@/features/laboratory/types/laboratory-audit.types"

export const LABORATORY_AUDIT_CATEGORY_LABELS: Record<
  LaboratoryAuditEventCategory,
  string
> = {
  order: "Laboratory Order",
  specimen: "Specimen",
  processing: "Processing",
  result: "Result Entry",
  verification: "Technical Verification",
  release: "Result Release",
}

export const LABORATORY_AUDIT_ACTION_LABELS: Record<
  LaboratoryAuditEventAction,
  string
> = {
  created: "Created",
  collected: "Collected",
  received: "Received",
  rejected: "Rejected",
  "processing-started": "Processing started",
  "result-entered": "Result entered",
  completed: "Completed",
  verified: "Verified",
  released: "Released",
  cancelled: "Cancelled",
}

export const DEFAULT_LABORATORY_AUDIT_FILTERS: LaboratoryAuditFilters =
  {
    search: "",
    category: "all",
    action: "all",
  }

export const LABORATORY_AUDIT_INITIAL_VISIBLE_EVENTS =
  15
