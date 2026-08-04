import type {
  RadiologyAuditEventAction,
  RadiologyAuditEventCategory,
  RadiologyAuditFilters,
} from "@/features/radiology/types/radiology-audit.types"

export const RADIOLOGY_AUDIT_CATEGORY_LABELS: Record<
  RadiologyAuditEventCategory,
  string
> = {
  order: "Radiology Order",
  preparation: "Patient Preparation",
  imaging: "Image Acquisition",
  report: "Radiologist Report",
  verification: "Radiologist Verification",
  release: "Final Report Release",
}

export const RADIOLOGY_AUDIT_ACTION_LABELS: Record<
  RadiologyAuditEventAction,
  string
> = {
  created: "Created",
  prepared: "Preparation completed",
  "checked-in": "Checked in",
  ready: "Ready for imaging",
  "imaging-started": "Imaging started",
  "images-acquired": "Images acquired",
  "technically-completed":
    "Technically completed",
  "report-drafted": "Report drafted",
  "critical-communicated":
    "Critical finding communicated",
  verified: "Verified",
  released: "Released",
  cancelled: "Cancelled",
  "no-show": "No-show",
}

export const DEFAULT_RADIOLOGY_AUDIT_FILTERS: RadiologyAuditFilters =
  {
    search: "",
    category: "all",
    action: "all",
  }

export const RADIOLOGY_AUDIT_INITIAL_VISIBLE_EVENTS =
  15
