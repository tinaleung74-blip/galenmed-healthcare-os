import type {
  ConsultationAuditEventAction,
  ConsultationAuditEventCategory,
  ConsultationAuditFilters,
} from "@/features/consultations/types/consultation-audit.types"

export const CONSULTATION_AUDIT_CATEGORY_LABELS: Record<
  ConsultationAuditEventCategory,
  string
> = {
  encounter: "Encounter",
  soap: "SOAP Notes",
  diagnosis: "Diagnosis",
  prescription: "Prescription",
  "follow-up": "Follow-up",
  signature: "Clinical Attestation",
}

export const CONSULTATION_AUDIT_ACTION_LABELS: Record<
  ConsultationAuditEventAction,
  string
> = {
  created: "Created",
  "checked-in": "Checked in",
  started: "Started",
  recorded: "Recorded",
  saved: "Saved",
  updated: "Updated",
  activated: "Activated",
  archived: "Archived",
  finalized: "Finalized",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
}

export const DEFAULT_CONSULTATION_AUDIT_FILTERS: ConsultationAuditFilters =
  {
    search: "",
    category: "all",
    action: "all",
  }

export const CONSULTATION_AUDIT_INITIAL_VISIBLE_EVENTS =
  20
